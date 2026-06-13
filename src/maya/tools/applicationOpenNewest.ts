// MAYA_STAFF_APPLICATION_OPEN_NEWEST — resolve + open the newest deal.
import { callBFServer } from "../../integrations/bfServerClient.js";

export type ApplicationOpenNewestArgs = { session_id?: string };
export type ApplicationOpenNewestResult = {
  ok: boolean;
  application?: Record<string, unknown> | null;
  action?: Record<string, unknown>;
  error?: string;
};

export async function applicationOpenNewest(args: ApplicationOpenNewestArgs): Promise<ApplicationOpenNewestResult> {
  try {
    const r = await callBFServer<{ ok: boolean; application?: any }>("/api/maya/staff/application-newest", {
      method: "POST",
      body: { session_id: typeof args?.session_id === "string" ? args.session_id : undefined },
    });
    if (!r || typeof r !== "object" || !r.ok) return { ok: false, error: "application_newest_failed" };
    const app = r.application ?? null;
    if (!app?.id) return { ok: true, application: null, error: "no_applications" };
    return {
      ok: true,
      application: app,
      action: {
        type: "navigate",
        target: "application",
        id: String(app.id),
        label: app.name ? `Newest application: ${app.name}` : "Newest application",
      },
    };
  } catch {
    return { ok: false, error: "application_newest_failed" };
  }
}

export const APPLICATION_OPEN_NEWEST_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "application.open_newest",
    description:
      "Resolve and open the newest application/deal in the portal. Use for commands like 'open the newest application' or 'show me the latest deal'. Returns the application plus a navigate action the portal executes.",
    parameters: {
      type: "object",
      properties: {
        session_id: { type: "string", description: "Optional session id for correlation." },
      },
      required: [],
    },
  },
};
