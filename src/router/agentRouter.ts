import { runAI } from "../brain/openaiClient";

export async function routeAgent(task: string, payload: any) {
  switch (task) {
    case "chat":
      return {
        content: await runAI(
          "You are Maya, a booking agent. Never give legal or financial advice.",
          payload
        )
      };

    case "memo":
      return {
        content: await runAI(
          "Generate structured underwriting memo.",
          payload
        )
      };

    case "recommend":
      return {
        content: await runAI(
          "Rank lenders based on deal structure. Return structured JSON.",
          payload
        )
      };

    case "forecast":
      return {
        content: await runAI(
          "Forecast monthly revenue based on expected commissions.",
          payload
        )
      };

    default:
      throw new Error("Invalid task");
  }
}
