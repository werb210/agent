import { MayaAgent } from "./baseAgent.js";
import { forecast90Days } from "../core/capitalForecast.js";
import { capitalEfficiencyIndex } from "../core/capitalEfficiency.js";

export class ExecutiveAgent implements MayaAgent {
  name = "ExecutiveAgent";
  role = "Strategic Intelligence";

  async execute() {
    const forecast = await forecast90Days();
    const efficiency = await capitalEfficiencyIndex();

    return {
      capital_forecast: forecast,
      efficiency_index: efficiency
    };
  }
}
