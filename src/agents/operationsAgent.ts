import { MayaAgent } from "./baseAgent.js";
import { detectStalledDeals } from "../core/churnDetection.js";

export class OperationsAgent implements MayaAgent {
  name = "OperationsAgent";
  role = "Pipeline & Broker Efficiency";

  async execute() {
    const stalled = await detectStalledDeals();

    return {
      stalled_deals_count: stalled.length,
      action_required: stalled.length > 0
    };
  }
}
