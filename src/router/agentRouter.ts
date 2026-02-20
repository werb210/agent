import { runAI } from "../brain/openaiClient";
import { getSession, updateSession } from "../memory/sessionStore";
import { scoreDeal } from "../engine/scoringEngine";
import { classifyTier } from "../engine/tierEngine";
import { determineProduct } from "../engine/productEngine";
import { matchLenders } from "../engine/lenderEngine";
import { shouldEscalate } from "../engine/escalationEngine";
import { pushToCRM } from "../engine/crmEngine";

const SYSTEM_PROMPT = `
You are Maya, senior funding advisor.
Qualify, collect data, and move deals forward.
Keep SMS short.
Ask one question at a time.
`;

const EXTRACTION_PROMPT = `
Extract structured data and return JSON:
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
  if (!sessionId) sessionId = "default";

  const session = getSession(sessionId);

  if (task === "chat") {
    const conversational = await runAI(SYSTEM_PROMPT, payload);

    const extractedRaw = await runAI(EXTRACTION_PROMPT, payload, { json: true });

    let structured = {};
    try {
      structured = JSON.parse(extractedRaw as string);
    } catch {}

    const merged = { ...session.structured, ...structured };

    const scoring = scoreDeal(merged);
    const tier = classifyTier(scoring.score);
    const product = determineProduct(merged);
    const lenders = matchLenders(merged, tier);
    const hotLead = shouldEscalate(scoring.score, merged.funding_amount);

    updateSession(sessionId, {
      structured: merged,
      scoring,
      tier,
      product,
      lenderMatches: lenders,
      hotLead
    });

    if (hotLead) {
      await pushToCRM({
        ...merged,
        score: scoring.score,
        tier,
        product,
        lenders
      });
    }

    return {
      content: conversational,
      internal: {
        structured: merged,
        scoring,
        tier,
        product,
        lenders,
        hotLead
      }
    };
  }

  throw new Error("Invalid task");
}
