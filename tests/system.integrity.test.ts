import { runAgent } from "../src/agents/runAgent";
import { withRetry } from "../src/lib/retry";

jest.mock("../src/tools", () => ({
  createLead: jest.fn().mockResolvedValue({ id: "123" }),
  startCall: jest.fn().mockResolvedValue({ callId: "call-1" }),
  updateCallStatus: jest.fn().mockResolvedValue({ updated: true })
}));

describe("system integrity", () => {
  it("invalid input throws", async () => {
    await expect(runAgent(undefined as never)).rejects.toThrow("INVALID_CALL_INPUT");
  });

  it("invalid tool returns execution error", async () => {
    const response = await runAgent({ callId: "test-call-id", tool: "transferCall", input: { callSid: "abc" } });
    expect(response).toHaveProperty("status");
    expect(response).toHaveProperty("meta.callId");
    expect(response.status).toBe("error");
  });

  it("retry exhaustion throws", async () => {
    await expect(withRetry(async () => Promise.reject(new Error("always fails")))).rejects.toThrow("always fails");
  });
});
