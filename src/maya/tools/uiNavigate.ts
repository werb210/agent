// MAYA_STAFF_UI_NAVIGATE — return a navigation directive for the staff portal.
export type UiNavigateArgs = { target: string; id?: string; path?: string; label?: string };
export type UiNavigateResult = { ok: boolean; action?: Record<string, unknown>; error?: string };

const ALLOWED = new Set([
  "application",
  "contact",
  "company",
  "pipeline",
  "contacts",
  "companies",
  "applications",
  "path",
]);

export async function uiNavigate(args: UiNavigateArgs): Promise<UiNavigateResult> {
  const target = typeof args?.target === "string" ? args.target.trim().toLowerCase() : "";
  if (!target || !ALLOWED.has(target)) return { ok: false, error: "invalid_target" };
  const id = typeof args?.id === "string" ? args.id.trim() : "";
  const path = typeof args?.path === "string" ? args.path.trim() : "";
  if ((target === "application" || target === "contact" || target === "company") && !id) {
    return { ok: false, error: "id_required" };
  }
  if (target === "path" && !path) return { ok: false, error: "path_required" };
  return {
    ok: true,
    action: {
      type: "navigate",
      target,
      id: id || undefined,
      path: path || undefined,
      label: typeof args?.label === "string" ? args.label : undefined,
    },
  };
}

export const UI_NAVIGATE_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "ui.navigate",
    description:
      "Open a screen in the staff portal. Use for commands like 'open this contact', 'go to the pipeline', or 'open application X'. Pass target='application'|'contact'|'company' with the record id (read the id from the current screen context when they say 'this'/'current'), target='pipeline'|'contacts'|'companies'|'applications' for a section, or target='path' with an explicit portal path. The portal performs the navigation; this returns a navigate action.",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", description: "What to open: application, contact, company, pipeline, contacts, companies, applications, or path." },
        id: { type: "string", description: "Record id (required for application/contact/company)." },
        path: { type: "string", description: "Explicit portal path (only for target='path')." },
        label: { type: "string", description: "Optional human label for confirmation." },
      },
      required: ["target"],
    },
  },
};
