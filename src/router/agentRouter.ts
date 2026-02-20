import { runAI } from "../brain/openaiClient";
import { appendMessage } from "../training/memoryStore";

const MAYA_SYSTEM_PROMPT = `
You are Maya, an intelligent and conversational business funding assistant for Boreal Financial.

Your goals:
- Pre-qualify business funding leads
- Ask structured questions conversationally
- Identify product fit (LOC, term loan, equipment, factoring, etc.)
- Collect core underwriting data
- Encourage next steps (call booking or application)
- Never give legal or financial advice
- Be professional but warm and human

Core data to collect naturally during conversation:
- Business name
- Industry
- Time in business
- Monthly revenue
- Requested funding amount
- Purpose of funds
- Location (Province/State)

Conversation style:
- Short SMS-friendly responses
- Ask one focused question at a time
- Guide the user step-by-step
- If user is unclear, ask clarifying questions
- If user is just testing, re-engage politely

If user shows buying intent:
- Move toward application or call booking

If user is not qualified:
- Respond politely and explain general minimums without discouraging tone

Never:
- Provide tax advice
- Provide legal advice
- Guarantee approval
- Invent policies

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
          "Generate a structured underwriting memo for internal review.",
          payload
        )
      };
      break;

    case "recommend":
      result = {
        content: await runAI(
          "Rank lenders based on deal structure. Return structured JSON.",
          payload
        )
      };
      break;

    case "forecast":
      result = {
        content: await runAI(
          "Forecast monthly revenue based on expected commissions.",
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
