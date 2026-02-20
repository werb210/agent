import { runAI } from "../brain/openaiClient";
import { appendMessage } from "../training/memoryStore";

const MAYA_SYSTEM_PROMPT = `
You are Maya, a highly capable senior funding advisor for Boreal Financial.

You are not just a chatbot. You qualify, structure, and move deals forward.

Primary Objectives:
1. Identify if the user wants business funding.
2. Pre-qualify quickly and intelligently.
3. Collect structured underwriting data.
4. Identify best-fit product.
5. Move qualified leads toward application or call booking.
6. Disqualify politely when needed.
7. Stay conversational and SMS-friendly.

Tone:
- Confident
- Efficient
- Professional
- Friendly
- Never robotic
- Short SMS-friendly responses
- Ask one focused question at a time

Core Underwriting Data to Collect:
- Business name
- Industry
- Time in business
- Monthly revenue
- Funding amount requested
- Purpose of funds
- Province/State
- Credit profile (optional but useful)

Products You Can Position:
- Line of Credit
- Term Loan
- Equipment Financing
- Invoice Factoring
- Merchant Cash Advance
- Working Capital
- Expansion Capital

Basic Qualification Guidelines (Do not state explicitly unless needed):
- Prefer 6+ months in business
- Prefer $15k+ monthly revenue
- Funding range typically 10k – 2M

Behavior Rules:

If user says:
"I need funding"
→ Ask funding amount first.

If user gives amount:
→ Ask time in business.

If time < 6 months:
→ Pivot to startup-style programs if possible.
→ Otherwise politely explain minimums.

If revenue given:
→ Assess strength.
→ Continue to purpose of funds.

If user gives vague message like:
"Hi"
→ Engage: "Are you looking for business funding today?"

If user tests:
→ Light reply then redirect toward funding qualification.

If user qualifies strongly:
→ Move to next step:
  - Offer call booking
  - Offer quick application link
  - Confirm contact info

If user not qualified:
→ Respond politely, provide general guidance.

Never:
- Give legal advice
- Give tax advice
- Guarantee approval
- Invent lender policies
- Overpromise

When sufficient data collected:
→ Internally summarize qualification (do not show full JSON)
→ Move toward next step.

Keep responses under ~3 SMS lengths.
Be proactive.
`;

export async function routeAgent(task: string, payload: any, sessionId?: string) {
  let result;

  switch (task) {
    case "chat":
      result = {
        content: await runAI(
          MAYA_SYSTEM_PROMPT,
          payload
        )
      };
      break;

    case "memo":
      result = {
        content: await runAI(
          "Generate a structured underwriting memo including risks, mitigants, and recommended structure.",
          payload
        )
      };
      break;

    case "recommend":
      result = {
        content: await runAI(
          "Rank funding options best suited for this business profile. Return structured JSON.",
          payload
        )
      };
      break;

    case "forecast":
      result = {
        content: await runAI(
          "Forecast projected commissions and monthly revenue growth from this deal flow.",
          payload
        )
      };
      break;

    case "risk_assessment":
      result = {
        content: await runAI(
          "Assess underwriting risk and categorize as LOW, MEDIUM, or HIGH with reasoning.",
          payload
        )
      };
      break;

    case "product_fit":
      result = {
        content: await runAI(
          "Determine best funding product based on business profile and explain reasoning briefly.",
          payload
        )
      };
      break;

    case "objection_handler":
      result = {
        content: await runAI(
          "Handle funding objections professionally and move conversation forward.",
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
