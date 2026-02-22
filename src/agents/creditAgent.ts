import { MayaAgent } from "./baseAgent";
import { calculateFundingProbability } from "../core/probabilityEngine";

export class CreditAgent implements MayaAgent {
  name = "CreditAgent";
  role = "Underwriting & Risk Evaluation";

  async execute(input: any) {
    const probability = await calculateFundingProbability(input);

    return {
      approval_probability: probability,
      decision_band:
        probability > 0.75 ? "strong"
        : probability > 0.5 ? "moderate"
        : "weak"
    };
  }
}
