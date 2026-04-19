import { checkStatus } from "../intents/checkStatus.js";
import { startApplication } from "../intents/startApplication.js";

export type IntentHandler = (input: string, context: unknown) => Promise<{ message: string }>;

export function routeIntent(input: string): { handler: IntentHandler } {
  const lower = input.toLowerCase();

  if (lower.includes("apply")) {
    return { handler: startApplication };
  }

  if (lower.includes("status")) {
    return { handler: checkStatus };
  }

  return {
    handler: async () => ({
      message: "I didn’t understand that request.",
    }),
  };
}
