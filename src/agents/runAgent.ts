import { runMayaAgents } from "./orchestrator";
import { MayaAgentPayload } from "./agentTypes";
import { validateInput } from "../lib/validateInput";
import { validateOutput } from "../lib/validateOutput";

async function executeFlow(input: MayaAgentPayload) {
  return runMayaAgents(input);
}

export async function runAgent(input: unknown) {
  const validatedInput = validateInput<MayaAgentPayload>(input);
  const result = await executeFlow(validatedInput);
  const validatedOutput = validateOutput({ result });
  return validatedOutput;
}
