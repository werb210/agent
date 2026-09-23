// AGENT_RESOLVED_APPLICATION_ID_v431
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  rememberResolvedApplicationId,
  getResolvedApplicationId,
  applicationIdFromFindMine,
} from "../dispatch";
const src = readFileSync(path.join(process.cwd(), "src/maya/dispatch.ts"), "utf8");

describe("v431 app-scoped tools use a real application id", () => {
  it("extracts the id from a find_mine result", () => {
    expect(applicationIdFromFindMine({ ok: true, applications: [{ id: "d5aa4b1e" }] })).toBe("d5aa4b1e");
  });

  it("returns null when find_mine found nothing", () => {
    expect(applicationIdFromFindMine({ ok: true, applications: [] })).toBeNull();
    expect(applicationIdFromFindMine(null)).toBeNull();
  });

  it("remembers per session and keeps sessions apart", () => {
    rememberResolvedApplicationId("s1", "app-1");
    rememberResolvedApplicationId("s2", "app-2");
    expect(getResolvedApplicationId("s1")).toBe("app-1");
    expect(getResolvedApplicationId("s2")).toBe("app-2");
    expect(getResolvedApplicationId("s3")).toBeNull();
  });

  it("ignores empty input", () => {
    rememberResolvedApplicationId("", "app-x");
    rememberResolvedApplicationId("s4", "");
    expect(getResolvedApplicationId("s4")).toBeNull();
  });

  it("strips a model-invented id when nothing trusted is available", () => {
    expect(src).toContain("const { application_id: _discarded, ...withoutGuess } = modelArgs");
  });

  it("captures the id straight after find_mine runs", () => {
    expect(src.indexOf("applicationIdFromFindMine(result)"))
      .toBeGreaterThan(src.indexOf("await entry.run(args)"));
  });
});
