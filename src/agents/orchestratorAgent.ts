import { requireCapability } from "../security/capabilityGuard";
import { ToolExecutionCall } from "../ai/toolExecutor";
import { runAgent } from "./runAgent";

export class OrchestratorAgent {
  constructor(private role: string = "system") {}

  async runFullAnalysis(input: ToolExecutionCall) {
    requireCapability(this.role, "view_sessions");
    return await runAgent(input);
  }
}
