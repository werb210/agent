import { routeIntent } from "./intentRouter.js";
import { safeReply } from "./safeReply.js";
import { log } from "../system/logger.js";

export async function handleMessage(input: string, context: unknown) {
  if (!input || typeof input !== "string") {
    log("invalid_input", { inputType: typeof input });
    return safeReply("invalid_input");
  }

  try {
    log("intent_start", { input });
    const intent = routeIntent(input);
    const response = await intent.handler(input, context ?? {});
    log("intent_success", { input });
    return response;
  } catch (error) {
    log("intent_error", {
      input,
      error: error instanceof Error ? error.message : "UNKNOWN_ERROR",
    });
    return safeReply("internal_error");
  }
}
