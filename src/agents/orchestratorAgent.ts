import { CreditAgent } from "./creditAgent";
import { MarketingAgent } from "./marketingAgent";
import { OperationsAgent } from "./operationsAgent";
import { ExecutiveAgent } from "./executiveAgent";
import { requireCapability } from "../security/capabilityGuard";

export class OrchestratorAgent {
  private credit = new CreditAgent();
  private marketing = new MarketingAgent();
  private ops = new OperationsAgent();
  private exec = new ExecutiveAgent();

  constructor(private role: string = "system") {}

  async runFullAnalysis(input: any) {
    requireCapability(this.role, "view_sessions");

    const creditData = await this.credit.execute(input);

    if (this.role === "executive") {
      return { credit: creditData };
    }

    const marketingData = await this.marketing.execute();
    const opsData = await this.ops.execute();
    const execData = await this.exec.execute();

    return {
      credit: creditData,
      marketing: marketingData,
      operations: opsData,
      executive: execData
    };
  }
}
