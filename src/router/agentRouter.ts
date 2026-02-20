import { runAI } from "../brain/openaiClient";
import { appendMessage } from "../training/memoryStore";

/*
Core conversational system prompt
*/
const MAYA_SYSTEM_PROMPT = `
You are Maya, a senior business funding advisor for Boreal Financial.

Your job:
- Qualify business funding leads
- Collect underwriting data naturally
- Identify best product fit
- Score deal strength internally
- Move qualified leads toward next step
- Stay SMS friendly

Collect:
- Business name
- Industry
- Time in business
- Monthly revenue
- Funding amount
- Purpose
- Location

Be proactive.
Ask one focused question at a time.
Never give legal or tax advice.
Never guarantee approval.
Keep responses short.
`;

/*
Structured extraction prompt
*/
const EXTRACTION_PROMPT = `
Extract structured underwriting data from the conversation.

Return ONLY valid JSON in this format:

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

/*
Scoring prompt
*/
const SCORING_PROMPT = `
Score this deal from 0 to 100 based on funding strength.

Return JSON:
{
  "score": number,
  "risk": "LOW" | "MEDIUM" | "HIGH",
  "reason": string
}
`;

/*
Product fit prompt
*/
const PRODUCT_PROMPT = `
Determine best funding product.

Return JSON:
{
  "recommended_product": string,
  "why": string
}
`;

export async function routeAgent(task: string, payload: any, sessionId?: string) {
  let result;

  switch (task) {
    case "chat": {
      const conversational = await runAI(
        MAYA_SYSTEM_PROMPT,
        payload
      );

      // Structured extraction
      const extracted = await runAI(
        EXTRACTION_PROMPT,
        payload,
        { json: true }
      );

      let structuredData;
      try {
        structuredData = JSON.parse(extracted as string);
      } catch {
        structuredData = null;
      }

      let scoreData = null;
      let productFit = null;

      if (structuredData) {
        try {
          const scoring = await runAI(
            SCORING_PROMPT,
            structuredData,
            { json: true }
          );
          scoreData = JSON.parse(scoring as string);

          const product = await runAI(
            PRODUCT_PROMPT,
            structuredData,
            { json: true }
          );
          productFit = JSON.parse(product as string);
        } catch {
          // fail silently for scoring layer
        }
      }

      result = {
        content: conversational,
        structured: structuredData,
        scoring: scoreData,
        productFit
      };

      break;
    }

    case "memo":
      result = {
        content: await runAI(
          "Generate structured underwriting memo with risks and mitigants.",
          payload
        )
      };
      break;

    case "recommend":
      result = {
        content: await runAI(
          "Rank lenders best suited for this deal. Return structured JSON.",
          payload
        )
      };
      break;

    case "forecast":
      result = {
        content: await runAI(
          "Forecast projected commission and pipeline growth.",
          payload
        )
      };
      break;

    default:
      throw new Error("Invalid task");
  }

  if (sessionId) {
    appendMessage(sessionId, {
      task,
      payload,
      result
    });
  }

  return result;
}
