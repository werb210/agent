import { runAgent } from "../src/agents/runAgent";

describe("system integrity", () => {
  it("never returns partial success", async () => {
    await expect(runAgent({ invalid: true })).rejects.toThrow();
  });
});
