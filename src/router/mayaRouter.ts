import { Router } from "express";
import { MayaRequest, MayaResponse } from "../types/maya";
import { handleClientMode } from "../services/modes/clientMode";
import { handleStaffMode } from "../services/modes/staffMode";
import { handleMarketingMode } from "../services/modes/marketingMode";
import { complianceFilter } from "../guardrails/complianceFilter";
import { sanitizeRateLanguage } from "../guardrails/rateRangeGuard";
import { logger } from "../logging/logger";
import { logDecision } from "../services/decisionLogger";
import { interpretAction } from "../services/actionInterpreter";
import { executeAction } from "../services/actionExecutor";
import { logAction } from "../services/actionLogger";
import { getSessionState, updateSessionState } from "../services/stageEngine";
import { determineNextStage } from "../services/qualificationEngine";
import { runMayaCore } from "../services/mayaCore";
import { evaluateConfidence } from "../services/confidenceEngine";
import { evaluateDealRisk } from "../services/dealRiskEngine";
import {
  findApplication,
  getDocumentStatus,
  getLenderProductRanges
} from "../services/dataAccess";
import { formatRateRanges } from "../services/dataFormatter";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const body: MayaRequest = req.body;

    if (!body.mode || !body.sessionId) {
      return res.status(400).json({ error: "Invalid Maya request" });
    }

    if (!body.message) {
      return res.status(400).json({ error: "Invalid Maya request" });
    }

    const session = await getSessionState(body.sessionId);

    let result: MayaResponse;

    switch (body.mode) {
      case "client":
        result = await handleClientMode(body);
        break;
      case "staff":
        result = await handleStaffMode(body);
        break;
      case "marketing":
        result = await handleMarketingMode(body);
        break;
      default:
        return res.status(400).json({ error: "Unknown mode" });
    }

    const history = Array.isArray(session.context.history)
      ? (session.context.history as { role: "user" | "assistant"; content: string }[])
      : [];

    const stageAwareReply = await runMayaCore(body.message, session.stage, history);
    const sanitizedReply = sanitizeRateLanguage(stageAwareReply || result.reply);
    const guard = complianceFilter(sanitizedReply);

    if (guard.violationDetected) {
      logger.warn("Maya guardrail violation detected", {
        mode: body.mode,
        sessionId: body.sessionId,
        originalReply: result.reply
      });
    }

    const finalReply = guard.safeReply;
    const finalEscalated = result.escalated || guard.escalated;
    const confidenceEval = evaluateConfidence({
      aiConfidence: result.confidence ?? 0.5,
      stage: session.stage,
      message: body.message,
      violationDetected: guard.violationDetected
    });

    const dealRisk = evaluateDealRisk(body.message);

    let finalEscalation = finalEscalated;

    // Escalate for low confidence
    if (confidenceEval.shouldEscalate) {
      finalEscalation = true;
    }

    // Escalate high-value deals
    if (dealRisk.highValue) {
      finalEscalation = true;
    }


    await logDecision({
      sessionId: body.sessionId,
      mode: body.mode,
      message: body.message,
      reply: finalReply,
      confidence: confidenceEval.score,
      escalated: finalEscalation,
      violationDetected: guard.violationDetected
    });

    const action = interpretAction(finalReply);

    const nextStage = determineNextStage(session.stage, body.message);
    const nextContext = {
      ...session.context,
      history: [...history, { role: "user", content: body.message }, { role: "assistant", content: finalReply }].slice(-20)
    };

    await updateSessionState(body.sessionId, nextStage, nextContext);

    if (action.requiresConfirmation && !body.confirmed) {
      await logAction({
        sessionId: body.sessionId,
        actionType: action.type,
        requiresConfirmation: action.requiresConfirmation,
        executed: false
      });

      return res.json({
        reply: `${finalReply} Please confirm to proceed.`,
        requiresConfirmation: true,
        action: action.type
      });
    }

    if (action.type !== "none" && body.confirmed) {
      const execution = await executeAction(action, body);

      await logAction({
        sessionId: body.sessionId,
        actionType: action.type,
        requiresConfirmation: action.requiresConfirmation,
        executed: execution.success,
        message: execution.message
      });

      return res.json({
        reply: execution.message,
        action: action.type,
        executed: execution.success
      });
    }

    // Application status check
    if (body.lookupIdentifier) {
      const app = await findApplication(body.lookupIdentifier);

      if (app) {
        const documents = await getDocumentStatus(app.id);

        return res.json({
          reply: `Your application is currently in ${app.status} status.`,
          applicationId: app.id,
          documentStatus: documents
        });
      }

      return res.json({
        reply: "No application found with that information."
      });
    }

    // Rate range query
    if (body.productType) {
      const products = await getLenderProductRanges(body.productType);
      const formatted = formatRateRanges(products);

      return res.json({
        reply: formatted
      });
    }

    return res.json({
      reply: finalReply,
      confidence: confidenceEval.score,
      escalated: finalEscalation
    });
  } catch (error) {
    console.error("Maya router error:", error);
    return res.status(500).json({
      reply: "System error. Please try again.",
      confidence: 0,
      escalated: false
    });
  }
});

export default router;
