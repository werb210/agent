import { runAgent } from "../src/agents/runAgent";
import { execute } from "../src/ai/toolExecutor";
import { withRetry } from "../src/lib/retry";

jest.mock("../src/agents/orchestrator", () => ({
  runMayaAgents: jest.fn().mockResolvedValue({ completed: true })
}));

jest.mock("../src/tools", () => ({
  createLead: jest.fn().mockResolvedValue({ id: "123" }),
  startCall: jest.fn().mockResolvedValue({ callId: "call-1" }),
  updateCallStatus: jest.fn().mockResolvedValue({ updated: true })
}));


jest.mock("../src/lib/toolExecutor", () => ({
  executeTool: jest.fn(async (_callId: string, _name: string, _params: Record<string, unknown>, fn: () => Promise<unknown>) => fn())
}));
describe("system integrity", () => {
  it("invalid input throws", async () => {
    await expect(runAgent(undefined)).rejects.toThrow("INVALID_AGENT_INPUT");
  });

  it("invalid tool returns execution error", async () => {
    const response = await execute({ callId: "test-call-id", name: "transferCall", params: { callSid: "abc" }, fnOrToken: "token" });
    expect(response).toEqual({
      status: "error",
      error: {
        code: "EXEC_FAIL",
        message: "INVALID_TOOL: transferCall"
      }
    });
  });

  it("missing call id returns execution error", async () => {
    const response = await execute({ callId: "", name: "startCall", params: { to: "+15555550123" }, fnOrToken: "token" });
    expect(response).toEqual({
      status: "error",
      error: {
        code: "EXEC_FAIL",
        message: "Missing callId"
      }
    });
  });

  it("retry exhaustion throws", async () => {
    await expect(withRetry(async () => Promise.reject(new Error("always fails")))).rejects.toThrow("always fails");
  });
});
