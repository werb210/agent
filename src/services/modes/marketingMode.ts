import { MayaRequest, MayaResponse } from "../../types/maya";
import { buildMarketingContext } from "../../context/buildMarketingContext";

export async function handleMarketingMode(
  body: MayaRequest
): Promise<MayaResponse> {
  const metrics = await buildMarketingContext();

  return {
    reply: `Total spend is ${metrics.totalSpend}. Total leads: ${metrics.totalLeads}.`,
    confidence: 0.8,
    escalated: false
  };
}
