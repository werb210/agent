import axios from "axios";

const ML_URL = process.env.ML_SERVICE_URL || "http://localhost:8001";

export async function getMLApprovalProbability(payload: any) {
  const response = await axios.post(`${ML_URL}/predict-nn`, payload, {
    headers: { "X-Internal-Secret": process.env.ML_INTERNAL_SECRET }
  });
  return response.data.approval_probability;
}
