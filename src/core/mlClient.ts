import axios from "axios";
import { createCorrelationId, logAudit } from "./auditLogger";
import { CircuitBreaker } from "./circuitBreaker";
import { requireCapability } from "../security/capabilityGuard";
import { featureFlags } from "../security/featureFlags";
import { recordMetric } from "./metricsLogger";
import { measureExecutionTime } from "./performanceTelemetry";

const ML_URL = process.env.ML_SERVICE_URL || "http://localhost:8001";

export const mlBreaker = new CircuitBreaker({
  timeout: 3000,
  failureThreshold: 3,
  resetTimeout: 10000
});

export async function getMLApprovalProbability(payload: any, role: string = "system", correlationId?: string) {
  requireCapability(role, "ml_predict");
  if (!featureFlags.enableNeuralNetwork) {
    throw new Error("Neural network predictions are disabled");
  }

  const resolvedCorrelationId = correlationId || createCorrelationId();

  try {
    return await mlBreaker.execute(async () => {
      const start = Date.now();
      const response = await axios.post(`${ML_URL}/predict-nn`, payload, {
        headers: { "X-Internal-Secret": process.env.ML_INTERNAL_SECRET }
      });

      const prob = response.data.approval_probability;

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

      return prob;
    });
  } catch {
    return 0.5;
  }
}
