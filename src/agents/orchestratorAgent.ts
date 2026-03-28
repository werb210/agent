import { requireCapability } from "../security/capabilityGuard";
import { runAgent } from "./runAgent";

export class OrchestratorAgent {
  constructor(private role: string = "system") {}

  async runFullAnalysis(input: unknown) {
    requireCapability(this.role, "view_sessions");
    return runAgent(input);
  }
}
