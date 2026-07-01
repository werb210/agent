import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

const reg = readFileSync(fileURLToPath(new URL("../maya/toolRegistry.ts", import.meta.url)), "utf-8");
const aud = readFileSync(fileURLToPath(new URL("../maya/audience.ts", import.meta.url)), "utf-8");

describe("Maya CRM tools", () => {
  it("registers CRM tools and grants them to staff", () => {
    for (const t of ["crm.notes", "crm.add_note", "crm.tasks", "crm.create_task"]) {
      expect(reg).toContain(`"${t}"`);
      expect(aud).toContain(`"${t}"`);
    }
  });
});
