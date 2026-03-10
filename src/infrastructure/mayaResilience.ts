import { MayaTaskType, runMayaLLM } from "../core/mayaModelRouter";
import { logger } from "../infrastructure/logger";

type ResilientOptions = {
  responseFormat?: {
    type: "json_schema";
    json_schema: Record<string, unknown>;
  };
  applicationId?: string;
  userId?: string;
  actionType?: string;
};

export async function resilientLLM(task: MayaTaskType, prompt: string, options: ResilientOptions = {}) {
  try {
    return await runMayaLLM(task, prompt, {
      responseFormat: options.responseFormat,
      meta: {
        applicationId: options.applicationId,
        userId: options.userId,
        actionType: options.actionType ?? task
      }
    });
  } catch (err) {
    logger.error("Maya LLM invocation failed", { err, task });
    throw err;
  }
}
