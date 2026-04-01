import { runAgent } from "../src/agents/runAgent";

jest.mock("../src/tools", () => ({
  createLead: jest.fn().mockResolvedValue({ id: "lead-1" }),
  startCall: jest.fn().mockResolvedValue({ callId: "call-1" }),
  updateCallStatus: jest.fn().mockResolvedValue({ updated: true })
}));

describe("tool execution response contract", () => {
  it("always returns structured success response", async () => {
    const response = await runAgent({
      callId: "test-call-id-1",
      tool: "createLead",
      input: { name: "Alice", email: "alice@example.com", phone: "+15555550123", token: "token" }
    });

    expect(response).toHaveProperty("status");
    expect(response).toHaveProperty("meta.callId");
    expect(response.status).toBe("ok");
  });

  it("always returns structured error response", async () => {
    const response = await runAgent({
      callId: "test-call-id-2",
      tool: "transferCall",
      input: { callSid: "abc" }
    });

    expect(response).toHaveProperty("status");
    expect(response).toHaveProperty("meta.callId");
    expect(response.status).toBe("error");
  });
});
