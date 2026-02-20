import { runAI } from "../brain/openaiClient";
import { getSession, updateSession } from "../memory/sessionStore";
import { scoreDeal } from "../engine/scoringEngine";
import { classifyTier } from "../engine/tierEngine";
import { determineProduct } from "../engine/productEngine";
import { matchLenders } from "../engine/lenderEngine";
import { notifyStaffIfHot, shouldEscalate } from "../engine/escalationEngine";
import { pushToCRM } from "../engine/crmEngine";
import { calculateApprovalProbability } from "../engine/probabilityEngine";
import { generateDocumentChecklist } from "../engine/documentChecklist";
import { scheduleFollowUp } from "../engine/followupEngine";
import { createCallBooking } from "../engine/callBookingEngine";

const SYSTEM_PROMPT = `
You are Maya, senior funding advisor.
Qualify, collect data, and move deals forward.
Keep SMS short.
Ask one question at a time.
`;

const EXTRACTION_PROMPT = `
Extract structured data and return JSON only:
{
  "business_name": string | null,
  "industry": string | null,
  "time_in_business_months": number | null,
  "monthly_revenue": number | null,
  "funding_amount": number | null,
  "purpose": string | null,
  "location": string | null
}
`;

export async function routeAgent(task: string, payload: any, sessionId?: string) {
  const resolvedSessionId = sessionId ?? payload?.userId ?? "default";
  const session = await getSession(resolvedSessionId);
  const history = session.conversation ?? [];

  if (task === "chat") {
    const userMessage = String(payload?.message ?? payload ?? "");

    const conversational = await runAI(SYSTEM_PROMPT, userMessage, history);

    const extractedRaw = await runAI(EXTRACTION_PROMPT, userMessage, history);

    let structured = {};
    try {
      structured = JSON.parse(extractedRaw as string);
    } catch {
      structured = {};
    }

    const merged = { ...session.structured, ...structured };

    const scoring = scoreDeal(merged);
    const tier = classifyTier(scoring.score);
    const product = determineProduct(merged);
    const lenders = await matchLenders(merged, tier);
    const hotLead = shouldEscalate(scoring.score, merged.funding_amount);
    const approvalProbability = calculateApprovalProbability(scoring.score);
    const documentChecklist = generateDocumentChecklist(merged);

    const nextConversation = [
      ...history,
      { role: "user", content: userMessage },
      { role: "assistant", content: conversational ?? "" }
    ];

    const nextSession = {
      ...session,
      structured: merged,
      scoring,
      tier,
      product,
      lenderMatches: lenders,
      hotLead,
      approvalProbability,
      documentChecklist,
      conversation: nextConversation
    };

    await updateSession(resolvedSessionId, nextSession);

    if (hotLead) {
      await pushToCRM({
        ...merged,
        score: scoring.score,
        tier,
        product,
        lenders
      });
      await notifyStaffIfHot(nextSession);
    }

    if (payload?.userId) {
      scheduleFollowUp(payload.userId);
    }

    return {
      content: conversational,
      internal: {
        structured: merged,
        scoring,
        tier,
        product,
        lenders,
        hotLead,
        approvalProbability,
        documentChecklist
      }
    };
  }

  if (task === "objection") {
    const response = await runAI(
      "Handle funding objections professionally and move toward closing.",
      String(payload?.message ?? ""),
      history
    );

    const nextSession = {
      ...session,
      conversation: [
        ...history,
        { role: "user", content: String(payload?.message ?? "") },
        { role: "assistant", content: response ?? "" }
      ]
    };

    await updateSession(resolvedSessionId, nextSession);
    return { content: response };
  }

  if (task === "book_call") {
    const booking = await createCallBooking(
      resolvedSessionId,
      String(payload?.phone ?? payload?.userId ?? ""),
      String(payload?.requestedTime ?? new Date().toISOString())
    );

    return {
      content: "Great — I have your call request and our team will confirm shortly.",
      booking
    };
  }

  throw new Error("Invalid task");
}
