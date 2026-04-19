import { requireCapability } from "../security/capabilityGuard.js";
import { ToolExecutionCall } from "../ai/toolExecutor.js";
import { runAgent } from "./runAgent.js";

export class OrchestratorAgent {
  constructor(private role: string = "system") {}

  async runFullAnalysis(call: ToolExecutionCall) {
    if (!call.tool) {
      throw new Error("MISSING_TOOL_NAME");
    }

    if (!call.input || typeof call.input !== "object") {
      throw new Error("INVALID_INPUT");
    }

    requireCapability(this.role, "view_sessions");
    return await runAgent(call);
  }
}
