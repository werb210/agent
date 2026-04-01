import { runMayaAgents } from "./orchestrator";
import { MayaAgentPayload } from "./agentTypes";
import { validateInput } from "../lib/validateInput";
import { validateOutput } from "../lib/validateOutput";

let isAgentRunning = false;

async function executeFlow(input: MayaAgentPayload) {
  return runMayaAgents(input);
}

export async function runAgent(input: unknown) {
  if (isAgentRunning) {
    throw new Error("AGENT_ALREADY_RUNNING");
  }
  isAgentRunning = true;

  let stepCount = 0;
  try {
    const validatedInput = validateInput<MayaAgentPayload>(input);

    stepCount += 1;
    if (stepCount > 10) {
      throw new Error("MAX_AGENT_STEPS_EXCEEDED");
    }

    const finalOutput = await executeFlow(validatedInput);
    if (!finalOutput || typeof finalOutput !== "object") {
      throw new Error("INVALID_FINAL_OUTPUT");
    }

    const validatedOutput = validateOutput({ success: true, result: finalOutput as unknown as Record<string, unknown> });
    return validatedOutput;
  } finally {
    isAgentRunning = false;
  }
}
