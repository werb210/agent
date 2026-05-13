// AGENT_BLOCK_v3_CLIENT_TOOLS_v1
import { describe, it, expect, vi, beforeEach } from "vitest";

const fetchMock = vi.fn();
vi.mock("../../integrations/bfServerClient.js", () => ({
  fetchApplicationStatus: (...args: unknown[]) => fetchMock(...args),
}));

import {
  applicationStatus,
  APPLICATION_STATUS_TOOL_DESCRIPTOR,
} from "../tools/applicationStatus.js";
import {
  docsChecklist,
  DOCS_CHECKLIST_TOOL_DESCRIPTOR,
} from "../tools/docsChecklist.js";
import {
  pgiCompletionLink,
  PGI_COMPLETION_LINK_TOOL_DESCRIPTOR,
} from "../tools/pgiCompletionLink.js";

describe("AGENT_BLOCK_v3 — application.my_status", () => {
  beforeEach(() => fetchMock.mockReset());

  it("returns stage + doc progress + PGI handoff when set", async () => {
    fetchMock.mockResolvedValueOnce({
      id: "bf-app-1",
      name: "Acme LLC",
      pipeline_state: "Documents Required",
      status: "in_progress",
      requested_amount: 250000,
      documents: [
        { document_category: "bank_statement", status: "accepted" },
        { document_category: "tax_return", status: "pending" },
      ],
      bi_application_id: "BI-ABC123",
      bi_public_id: "pub-xyz",
      bi_completion_url: "https://www.boreal.insure/login?next=/applications/pub-xyz",
    });
    const r = await applicationStatus({ application_id: "bf-app-1" });
    expect(r.ok).toBe(true);
    expect(r.pipeline_state).toBe("Documents Required");
    expect(r.documents_total).toBe(2);
    expect(r.documents_complete).toBe(1);
    expect(r.pgi_handoff?.available).toBe(true);
    expect(r.pgi_handoff?.completion_url).toMatch(/^https:\/\/www\.boreal\.insure/);
    expect(r.summary).toContain("PGI application is ready");
  });

  it("reports PGI not available when bi_completion_url is null", async () => {
    fetchMock.mockResolvedValueOnce({
      id: "bf-app-2",
      pipeline_state: "Received",
      documents: [],
      bi_completion_url: null,
    });
    const r = await applicationStatus({ application_id: "bf-app-2" });
    expect(r.ok).toBe(true);
    expect(r.pgi_handoff?.available).toBe(false);
    expect(r.summary).not.toContain("PGI application is ready");
  });

  it("returns ok=false on missing application_id", async () => {
    const r = await applicationStatus({ application_id: "" });
    expect(r.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns ok=false on transport error", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network"));
    const r = await applicationStatus({ application_id: "bf-app-3" });
    expect(r.ok).toBe(false);
    expect(r.summary).toContain("application_status_failed");
  });

  it("descriptor advertises name and required arg", () => {
    expect(APPLICATION_STATUS_TOOL_DESCRIPTOR.function.name).toBe("application.my_status");
    expect(APPLICATION_STATUS_TOOL_DESCRIPTOR.function.parameters.required).toEqual(["application_id"]);
  });
});

describe("AGENT_BLOCK_v3 — docs.checklist", () => {
  beforeEach(() => fetchMock.mockReset());

  it("categorizes documents into missing vs complete", async () => {
    fetchMock.mockResolvedValueOnce({
      documents: [
        { document_category: "bank_statement", status: "accepted" },
        { document_category: "tax_return", status: "pending" },
        { document_category: "void_cheque", status: "uploaded" },
      ],
    });
    const r = await docsChecklist({ application_id: "bf-app-1" });
    expect(r.ok).toBe(true);
    expect(r.complete.length).toBe(2);
    expect(r.missing.length).toBe(1);
    expect(r.missing[0].document_type).toBe("tax_return");
    expect(r.summary).toContain("1 document(s) still needed");
  });

  it("returns 'all on file' when no missing", async () => {
    fetchMock.mockResolvedValueOnce({
      documents: [{ document_category: "bank_statement", status: "accepted" }],
    });
    const r = await docsChecklist({ application_id: "bf-app-1" });
    expect(r.summary).toContain("All 1 document(s) on file");
  });

  it("returns ok=false on missing application_id", async () => {
    const r = await docsChecklist({ application_id: "" });
    expect(r.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("descriptor advertises name and required arg", () => {
    expect(DOCS_CHECKLIST_TOOL_DESCRIPTOR.function.name).toBe("docs.checklist");
    expect(DOCS_CHECKLIST_TOOL_DESCRIPTOR.function.parameters.required).toEqual(["application_id"]);
  });
});

describe("AGENT_BLOCK_v3 — pgi.completion_link", () => {
  beforeEach(() => fetchMock.mockReset());

  it("returns the URL when set", async () => {
    fetchMock.mockResolvedValueOnce({
      bi_public_id: "pub-xyz",
      bi_completion_url: "https://www.boreal.insure/login?next=/applications/pub-xyz",
    });
    const r = await pgiCompletionLink({ application_id: "bf-app-1" });
    expect(r.ok).toBe(true);
    expect(r.available).toBe(true);
    expect(r.completion_url).toMatch(/boreal\.insure/);
  });

  it("returns available=false with explanation when no handoff", async () => {
    fetchMock.mockResolvedValueOnce({ bi_completion_url: null });
    const r = await pgiCompletionLink({ application_id: "bf-app-2" });
    expect(r.ok).toBe(true);
    expect(r.available).toBe(false);
    expect(r.summary).toContain("No PGI completion flow");
  });

  it("descriptor advertises name and required arg", () => {
    expect(PGI_COMPLETION_LINK_TOOL_DESCRIPTOR.function.name).toBe("pgi.completion_link");
    expect(PGI_COMPLETION_LINK_TOOL_DESCRIPTOR.function.parameters.required).toEqual(["application_id"]);
  });
});
