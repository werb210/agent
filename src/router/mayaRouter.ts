import { Router } from "express";
import { MayaRequest, MayaResponse } from "../types/maya";
import { handleClientMode } from "../services/modes/clientMode";
import { handleStaffMode } from "../services/modes/staffMode";
import { handleMarketingMode } from "../services/modes/marketingMode";
import { complianceFilter } from "../guardrails/complianceFilter";
import { sanitizeRateLanguage } from "../guardrails/rateRangeGuard";
import { logger } from "../logging/logger";
import { logDecision } from "../services/decisionLogger";
import { evaluateEscalation } from "../services/escalationEngine";
import { handleBooking } from "../services/bookingEngine";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const body: MayaRequest = req.body;

    if (!body.mode || !body.sessionId) {
      return res.status(400).json({ error: "Invalid Maya request" });
    }

    if (body.action === "book") {
      if (!body.startISO || !body.endISO) {
        return res.status(400).json({ error: "Missing booking window" });
      }

      const booking = await handleBooking({
        startISO: body.startISO,
        endISO: body.endISO,
        phone: body.phone
      });

      return res.json({
        reply: booking.message,
        confidence: booking.success ? 0.95 : 0.5,
        escalated: !booking.success,
        bookingRequired: !booking.success
      });
    }

    if (!body.message) {
      return res.status(400).json({ error: "Invalid Maya request" });
    }

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

    const sanitizedReply = sanitizeRateLanguage(result.reply);
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

    const escalation = await evaluateEscalation(finalEscalated);

    await logDecision({
      sessionId: body.sessionId,
      mode: body.mode,
      message: body.message,
      reply: finalReply,
      confidence: result.confidence,
      escalated: finalEscalated,
      violationDetected: guard.violationDetected
    });

    if (escalation.fallbackBooking) {
      return res.json({
        reply: `${finalReply} Let's schedule a call. What time works for you?`,
        confidence: result.confidence,
        escalated: true,
        bookingRequired: true
      });
    }

    return res.json({
      reply: finalReply,
      confidence: result.confidence,
      escalated: finalEscalated,
      transferTo: escalation.transferTo || null,
      fallbackBooking: escalation.fallbackBooking
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
