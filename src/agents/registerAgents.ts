import { registerAgent } from "./agentRegistry";
import { marketingAgent } from "./marketingAgent";
import { riskAgent } from "./riskAgent";
import { salesAgent } from "./salesAgent";

export function registerMayaAgents(): void {
  registerAgent("sales", salesAgent);
  registerAgent("marketing", marketingAgent);
  registerAgent("risk", riskAgent);
}
