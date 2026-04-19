import { registerAgent } from "./agentRegistry.js";
import { marketingAgent } from "./marketingAgent.js";
import { riskAgent } from "./riskAgent.js";
import { salesAgent } from "./salesAgent.js";

export function registerMayaAgents(): void {
  registerAgent("sales", salesAgent);
  registerAgent("marketing", marketingAgent);
  registerAgent("risk", riskAgent);
}
