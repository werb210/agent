// AGENT_ALBERTA_TIME_v713
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("Maya books in Alberta time, UTC-6 all year", () => {
  it("uses a zone that does not fall back in November", () => {
    const s = readFileSync("src/services/calendarService.ts", "utf8");
    expect(s).toContain('const TIMEZONE = "America/Regina";');
    expect(s).not.toContain("America/Edmonton");
  });
});
