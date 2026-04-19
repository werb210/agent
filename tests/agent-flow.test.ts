import { assertApiResponse } from "../src/lib/assertApiResponse.js";
import { vi } from "vitest";

vi.mock("../src/tools/index.js", () => ({
  createLead: vi.fn(),
  startCall: vi.fn(),
  updateCallStatus: vi.fn()
}));

import * as toolsModule from "../src/tools/index.js";
const startCall = toolsModule.startCall as unknown as ReturnType<typeof vi.fn>;

describe("agent deterministic flow", () => {
  const originalToken = process.env.AGENT_API_TOKEN;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AGENT_API_TOKEN = "valid-token";
  });

  afterAll(() => {
    process.env.AGENT_API_TOKEN = originalToken;
  });

  it("valid input returns valid output", async () => {
    startCall.mockResolvedValue({ scheduled: true });
    const { runAgent } = await import("../src/agents/runAgent.js");
    const response = await runAgent({
      callId: "test-call-id-1",
      tool: "startCall",
      input: { to: "+15555550123" }
    });

    expect(response).toHaveProperty("status");
    expect(response).toHaveProperty("meta.callId");
    expect(response.status).toBe("ok");
  });

  it("invalid input throws", async () => {
    const { runAgent } = await import("../src/agents/runAgent.js");
    await expect(runAgent(undefined as never)).rejects.toThrow("INVALID_CALL_INPUT");
  });

  it("tool failure returns error response", async () => {
    startCall.mockRejectedValue(new Error("tool failed"));
    const { runAgent } = await import("../src/agents/runAgent.js");

    const response = await runAgent({
      callId: "test-call-id-2",
      tool: "startCall",
      input: { to: "+15555550123" }
    });

    expect(response).toHaveProperty("status");
    expect(response).toHaveProperty("meta.callId");
    expect(response.status).toBe("error");
  });

  it("API failure bubbles up", () => {
    expect(() =>
      assertApiResponse({
        status: "error",
        error: "Request failed upstream"
      })
    ).toThrow("Request failed upstream");
  });
});
