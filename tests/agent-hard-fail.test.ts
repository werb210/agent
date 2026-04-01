import { runAgent } from "../src/agents/runAgent";

describe("agent hard failures", () => {
  it("fails on invalid call payload", async () => {
    await expect(runAgent(undefined as never)).rejects.toThrow("INVALID_CALL_INPUT");
  });

  it("fails unknown tools deterministically", async () => {
    const result = await runAgent({
      callId: "call-1",
      tool: "missingTool",
      input: {}
    });

    expect(result).toHaveProperty("status");
    expect(result).toHaveProperty("meta.callId");
    expect(result.status).toBe("error");
  });
});
