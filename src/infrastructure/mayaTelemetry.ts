import { createCorrelationId, logAudit } from "../core/auditLogger.js";

export async function logLLMUsage(model: string, task: string) {
  await logAudit({
    correlationId: createCorrelationId(),
    agentName: "maya",
    actionType: "llm_usage",
    metadata: {
      model,
      task,
      timestamp: new Date()
    }
  });
}
