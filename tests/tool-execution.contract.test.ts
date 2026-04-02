import { runAgent } from "../src/agents/runAgent";
import { vi } from "vitest";

vi.mock("../src/tools", () => ({
  createLead: jest.fn().mockResolvedValue({ id: "lead-1" }),
  startCall: jest.fn().mockResolvedValue({ callId: "call-1" }),
  updateCallStatus: jest.fn().mockResolvedValue({ updated: true })
}));

describe("tool execution response contract", () => {
  const originalToken = process.env.AGENT_API_TOKEN;

  beforeEach(() => {
    process.env.AGENT_API_TOKEN = "valid-token";
  });

  afterAll(() => {
    process.env.AGENT_API_TOKEN = originalToken;
  });

  it("always returns structured success response", async () => {
    const response = await runAgent({
      callId: "test-call-id-1",
      tool: "createLead",
      input: { name: "Alice", email: "alice@example.com", phone: "+15555550123" }
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

  it("fails hard when AGENT_API_TOKEN is missing", async () => {
    delete process.env.AGENT_API_TOKEN;

    const response = await runAgent({
      callId: "test-call-id-3",
      tool: "createLead",
      input: { name: "Alice", email: "alice@example.com", phone: "+15555550123" }
    });

    expect(response.status).toBe("error");
    expect(response.error).toMatchObject({ code: "EXEC_FAIL", message: "AGENT AUTH TOKEN MISSING" });
  });
});
