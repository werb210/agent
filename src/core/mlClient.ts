import axios from "axios";
import { createCorrelationId, logAudit } from "./auditLogger";

const ML_URL = process.env.ML_SERVICE_URL || "http://localhost:8001";

export async function getMLApprovalProbability(payload: any, correlationId?: string) {
  const resolvedCorrelationId = correlationId || createCorrelationId();

  const response = await axios.post(`${ML_URL}/predict-nn`, payload, {
    headers: { "X-Internal-Secret": process.env.ML_INTERNAL_SECRET }
  });

  const prob = response.data.approval_probability;

  await logAudit({
    correlationId: resolvedCorrelationId,
    agentName: "MLService",
    actionType: "ml_prediction",
    entityType: "session",
    entityId: payload.session_id,
    newValue: { approval_probability: prob }
  });

  return prob;
}
