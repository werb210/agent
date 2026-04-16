import { createCorrelationId, logAudit } from "./auditLogger";
import { CircuitBreaker } from "./circuitBreaker";
import { requireCapability } from "../security/capabilityGuard";
import { featureFlags } from "../security/featureFlags";
import { recordMetric } from "./metricsLogger";
import { measureExecutionTime } from "./performanceTelemetry";
import { calculateFeatureContributions } from "./explainability";
import { generateReasoningSummary } from "./generateExplanation";
import { pool } from "../integrations/bfServerClient";
import { AppError } from "../errors/AppError";

const nativeFetch = globalThis["fetch"];
const ML_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8001";

export const mlBreaker = new CircuitBreaker({
  timeout: 3000,
  failureThreshold: 5,
  resetTimeout: 10000
});

export async function getMLApprovalProbability(payload: any, role: string = "system", correlationId?: string) {
  requireCapability(role, "ml_predict");
  if (!featureFlags.enableNeuralNetwork) {
    throw new AppError("internal_error", 500, "Neural network predictions are disabled");
  }

  const resolvedCorrelationId = correlationId || createCorrelationId();

  try {
    return await mlBreaker.execute(async () => {
      const start = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await nativeFetch(`${ML_URL}/predict-nn`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Secret": process.env.ML_INTERNAL_SECRET ?? ""
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      }).finally(() => {
        clearTimeout(timeoutId);
      });

      if (!response.ok) {
        throw new Error(`ML service returned ${response.status}`);
      }

      const data = (await response.json()) as { approval_probability: number };
      const prob = data.approval_probability;

      await recordMetric(
        "ml_prediction_probability",
        prob,
        { session_id: payload.session_id }
      );
      await recordMetric("execution_time_ms", measureExecutionTime(start), {
        operation: "ml_predict"
      });

      await logAudit({
        correlationId: resolvedCorrelationId,
        agentName: "MLService",
        actionType: "ml_prediction",
        entityType: "session",
        entityId: payload.session_id,
        newValue: { approval_probability: prob }
      });

      const contributions = calculateFeatureContributions(payload);
      const summary = generateReasoningSummary(prob, contributions);

      await pool.request(
        `INSERT INTO maya_explanations
         (session_id, model_version, probability, feature_contributions, reasoning_summary)
         VALUES ($1, $2, $3, $4, $5)`,
        [payload.session_id, "NN_v1", prob, contributions, summary]
      );

      await logAudit({
        correlationId: resolvedCorrelationId,
        agentName: "ExplainabilityEngine",
        actionType: "explanation_generated",
        entityType: "session",
        entityId: payload.session_id,
        newValue: { probability: prob }
      });

      return prob;
    });
  } catch {
    return 0.5;
  }
}
