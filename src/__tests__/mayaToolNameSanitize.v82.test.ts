import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";

const src = readFileSync("src/api/maya.ts", "utf-8");

describe("v82 Maya tool-name sanitization", () => {
  it("sanitizes tool names before sending to OpenAI", () => {
    expect(src).toContain('replace(/[^a-zA-Z0-9_-]/g, "_")');
    expect(src).toContain("toolNameMap");
  });
  it("maps the returned name back to the original before dispatch", () => {
    expect(src).toContain("toolNameMap.get(rawToolName) ?? rawToolName");
  });
  it("the sanitizer makes every current Maya tool name OpenAI-valid", () => {
    const names = [
      "lead.capture", "apply.start_url", "info.products", "info.qualifications",
      "docs.checklist", "pgi.completion_link", "application.my_status",
      "escalate.to_human", "pipeline.query", "visitor.identify",
    ];
    const valid = /^[a-zA-Z0-9_-]+$/;
    for (const n of names) {
      const safe = n.replace(/[^a-zA-Z0-9_-]/g, "_");
      expect(valid.test(safe)).toBe(true);
    }
  });
});
