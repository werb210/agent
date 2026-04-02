import { vi } from "vitest";
import fs from "fs";
import path from "path";
import { generateCreditSummary } from "../services/creditSummary";
import * as realClient from "../brain/openaiClient";
import * as mayaResilience from "../infrastructure/mayaResilience";

vi.mock("../infrastructure/mayaResilience", () => ({
  resilientLLM: vi.fn()
}));

const resilientLLM = mayaResilience.resilientLLM as vi.Mock;

describe("Maya V1 production hardening", () => {
  beforeEach(() => {
    resilientLLM.mockReset();
  });

  it("locks temperature to zero in maya model router", () => {
    const file = fs.readFileSync(path.join(process.cwd(), "src/core/mayaModelRouter.ts"), "utf8");
    expect(file).toContain("temperature: 0");
  });

  test("forbidden roles are rejected", async () => {
    await expect(
      realClient.runAI("web", "msg", [], { role: "client" })
    ).rejects.toMatchObject({
      code: "forbidden",
      status: 403,
    });
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
