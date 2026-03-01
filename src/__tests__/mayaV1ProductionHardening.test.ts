import fs from "fs";
import path from "path";
import { runAI } from "../brain/openaiClient";
import { generateCreditSummary } from "../services/creditSummary";

jest.mock("../infrastructure/mayaResilience", () => ({
  resilientLLM: jest.fn()
}));

const { resilientLLM } = jest.requireMock("../infrastructure/mayaResilience") as {
  resilientLLM: jest.Mock;
};

describe("Maya V1 production hardening", () => {
  beforeEach(() => {
    resilientLLM.mockReset();
  });

  it("locks temperature to zero in maya model router", () => {
    const file = fs.readFileSync(path.join(process.cwd(), "src/core/mayaModelRouter.ts"), "utf8");
    expect(file).toContain("temperature: 0");
  });

  it("rejects unauthorized roles", async () => {
    await expect(
      runAI("system", "hello", [], { role: "client" })
    ).rejects.toEqual(expect.objectContaining({ code: "forbidden", status: 403 }));
  });

  it("enforces credit summary schema", async () => {
    resilientLLM.mockResolvedValueOnce({
      output: JSON.stringify({
        transaction: "txn",
        overview: "overview",
        collateral: "collateral",
        financialSummary: "financial",
        risks: ["risk"],
        rationale: "rationale"
      })
    });

    const result = await generateCreditSummary({
      applicationId: "app-1",
      userId: "user-1",
      role: "Staff",
      payload: "sample"
    });

    expect(result.transaction).toBe("txn");
    expect(resilientLLM).toHaveBeenCalled();
  });

  it("fails on malformed model output", async () => {
    resilientLLM.mockResolvedValueOnce({ output: "not-json" });

    await expect(
      generateCreditSummary({
        applicationId: "app-1",
        userId: "user-1",
        role: "Admin",
        payload: "sample"
      })
    ).rejects.toEqual(expect.objectContaining({ code: "maya_failure", status: 500 }));
  });
});
