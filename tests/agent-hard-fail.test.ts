jest.mock("../src/agents/orchestrator", () => ({
  runMayaAgents: jest.fn()
}));

import { runAgent } from "../src/agents/runAgent";
import { validateOutput } from "../src/lib/validateOutput";

const { runMayaAgents } = jest.requireMock("../src/agents/orchestrator") as {
  runMayaAgents: jest.Mock;
};

describe("agent hard failures", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fails on invalid tool response", async () => {
    runMayaAgents.mockResolvedValue(null);
    await expect(runAgent({ bad: true })).rejects.toThrow();
  });

  it("fails on missing output structure", async () => {
    await expect(Promise.resolve().then(() => validateOutput(null))).rejects.toThrow();
  });
});
