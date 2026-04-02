import { vi } from "vitest";
import { runAgent } from "../agents/runAgent";
import { execute } from "../ai/toolExecutor";

vi.mock("../ai/toolExecutor", () => ({
  execute: vi.fn()
}));

const executeMock = execute as vi.MockedFunction<typeof execute>;

describe("runAgent execution contract", () => {
  beforeEach(() => {
    executeMock.mockReset();
  });

  it("returns a frozen result with required contract fields", async () => {
    executeMock.mockResolvedValue({ status: "ok", data: { value: 1 } });

    const result = await runAgent({
      callId: "call-123",
      tool: "createLead",
      input: { name: "A" }
    } as any);

    expect(result).toHaveProperty("status");
    expect(result).toHaveProperty("meta.callId", "call-123");
    expect(result.meta).toBeDefined();
    expect(typeof result.meta.callId).toBe("string");
    expect(typeof result.meta.durationMs).toBe("number");
    expect(Object.isFrozen(result)).toBe(true);
  });

  it("blocks duplicate call execution while in progress", async () => {
    let release: (() => void) | undefined;
    executeMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          release = () => resolve({ status: "ok", data: {} });
        })
    );

    const first = runAgent({
      callId: "dup-1",
      tool: "createLead",
      input: {}
    } as any);

    await expect(
      runAgent({
        callId: "dup-1",
        tool: "createLead",
        input: {}
      } as any)
    ).rejects.toThrow("DUPLICATE_CALL");

    release?.();
    await expect(first).resolves.toHaveProperty("status");
  });
});