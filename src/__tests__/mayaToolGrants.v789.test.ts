// AGENT_v789 - who can call which tool, checked on the live registry and allowlist
// (replaces the catalog / CRM / marketing tests that read toolRegistry.ts and audience.ts as text).
import { describe, expect, it } from "vitest";
import { TOOL_REGISTRY, descriptorsForAudience } from "../maya/toolRegistry.js";
import { TOOLS_BY_AUDIENCE, isToolAllowed } from "../maya/audience.js";

const offered = (audience: "visitor" | "client" | "staff") => descriptorsForAudience(audience).map((d) => d.function.name);

describe("tool grants", () => {
  it("catalog.summary is for clients and staff, not visitors (AGENT_MAYA_SITE_FACTS_v371)", () => {
    expect(TOOL_REGISTRY["catalog.summary"]).toBeDefined();
    expect(offered("client")).toContain("catalog.summary");
    expect(offered("staff")).toContain("catalog.summary");
    expect(offered("visitor")).not.toContain("catalog.summary");
  });

  it("CRM and marketing tools are registered and staff-only", () => {
    for (const t of ["crm.notes", "crm.add_note", "crm.tasks", "crm.create_task", "marketing.overview", "marketing.send_campaign"]) {
      expect(TOOL_REGISTRY[t]?.descriptor.function.name, t).toBe(t);
      expect(isToolAllowed("staff", t), t).toBe(true);
      expect(isToolAllowed("client", t), t).toBe(false);
      expect(isToolAllowed("visitor", t), t).toBe(false);
    }
  });

  it("every allowlisted tool is registered", () => {
    for (const list of Object.values(TOOLS_BY_AUDIENCE)) for (const t of list) expect(TOOL_REGISTRY[t], t).toBeDefined();
  });

  it("pending.confirm is never offered unless the caller says it may be", () => {
    expect(offered("staff")).not.toContain("pending.confirm");
    expect(descriptorsForAudience("staff", { includeConfirm: true }).map((d) => d.function.name)).toContain("pending.confirm");
    expect(descriptorsForAudience("client", { includeConfirm: true }).map((d) => d.function.name)).not.toContain("pending.confirm");
  });

  it("no client or visitor tool asks the model for an application, contact or phone it could use to look someone up", () => {
    const capture = new Set(["visitor.identify", "lead.capture", "waitlist.join"]);
    for (const audience of ["client", "visitor"] as const) {
      for (const d of descriptorsForAudience(audience)) {
        if (capture.has(d.function.name)) continue;
        const props = Object.keys((d.function.parameters as { properties?: object }).properties ?? {});
        for (const k of ["contact_id", "phone"]) expect(props, `${audience} ${d.function.name}`).not.toContain(k);
      }
    }
  });
});
