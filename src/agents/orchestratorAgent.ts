import { CreditAgent } from "./creditAgent";
import { MarketingAgent } from "./marketingAgent";
import { OperationsAgent } from "./operationsAgent";
import { ExecutiveAgent } from "./executiveAgent";

export class OrchestratorAgent {
  private credit = new CreditAgent();
  private marketing = new MarketingAgent();
  private ops = new OperationsAgent();
  private exec = new ExecutiveAgent();

  async runFullAnalysis(input: any) {
    const creditData = await this.credit.execute(input);
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
