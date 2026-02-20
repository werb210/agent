import { runAI } from "../brain/openaiClient";
import { appendMessage } from "../training/memoryStore";

export async function routeAgent(task: string, payload: any, sessionId?: string) {
  let result;

  switch (task) {
    case "chat":
      result = {
        content: await runAI(
          "You are Maya, a booking agent. Never give legal or financial advice.",
          payload
        )
      };
      break;

    case "memo":
      result = {
        content: await runAI(
          "Generate structured underwriting memo.",
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
