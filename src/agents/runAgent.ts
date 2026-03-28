import { runMayaAgents } from "./orchestrator";
import { MayaAgentPayload } from "./agentTypes";
import { validateInput } from "../lib/validateInput";
import { validateOutput } from "../lib/validateOutput";

export async function executeFlow(input: MayaAgentPayload) {
  return runMayaAgents(input);
}

export async function runAgent(input: unknown) {
  validateInput(input);
  const result = await executeFlow(input as MayaAgentPayload);
  return validateOutput(result);
}
