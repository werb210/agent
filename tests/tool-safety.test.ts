import { execute } from "../src/ai/toolExecutor";
import { vi } from "vitest";

vi.mock("../src/tools", () => ({
  createLead: vi.fn(),
  startCall: vi.fn(),
  updateCallStatus: vi.fn()
}));

import * as toolsModule from "../src/tools";
const startCall = toolsModule.startCall as unknown as ReturnType<typeof vi.fn>;

describe("tool safety boundaries", () => {
  const originalToken = process.env.AGENT_API_TOKEN;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AGENT_API_TOKEN = "valid-token";
  });

  afterAll(() => {
    process.env.AGENT_API_TOKEN = originalToken;
  });

  it("times out long-running tools", async () => {
    vi.useFakeTimers();
    startCall.mockImplementation(() => new Promise(() => undefined));

    const pending = execute({
      callId: "tool-timeout-1",
      tool: "startCall",
      input: { to: "+15555550123" }
    });

    await vi.advanceTimersByTimeAsync(10_000);
    await expect(pending).resolves.toMatchObject({
      status: "error",
      error: { code: "TOOL_TIMEOUT" }
    });

    vi.useRealTimers();
  });

  it("rejects unknown tools that are not allow-listed", async () => {
    const result = await execute({
      callId: "tool-not-allowed-1",
      tool: "deleteEverything",
      input: {}
    });

    expect(result).toMatchObject({
      status: "error",
      error: { code: "TOOL_NOT_ALLOWED", message: "deleteEverything" }
    });
  });
});
