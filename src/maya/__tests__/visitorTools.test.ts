// AGENT_BLOCK_v4_VISITOR_TOOLS_v1
import { describe, it, expect, vi, beforeEach } from "vitest";

const callMock = vi.fn();
vi.mock("../../integrations/bfServerClient.js", () => ({
  callBFServer: (...args: unknown[]) => callMock(...args),
}));

import {
  infoProducts,
  INFO_PRODUCTS_TOOL_DESCRIPTOR,
  infoQualifications,
  INFO_QUALIFICATIONS_TOOL_DESCRIPTOR,
} from "../tools/info.js";
import {
  leadCapture,
  LEAD_CAPTURE_TOOL_DESCRIPTOR,
  applyStartUrl,
  APPLY_START_URL_TOOL_DESCRIPTOR,
} from "../tools/leadCapture.js";
import { PRODUCTS, QUALIFICATIONS } from "../tools/infoCatalog.js";

describe("AGENT_BLOCK_v4 — info.products", () => {
  it("lists all products when no key is provided", async () => {
    const r = await infoProducts({});
    expect(r.ok).toBe(true);
    expect(r.products?.length).toBe(PRODUCTS.length);
    expect(r.summary).toContain(`${PRODUCTS.length} financing products`);
  });

  it("returns a specific product when key matches", async () => {
    const r = await infoProducts({ product_key: "term_loan" });
    expect(r.ok).toBe(true);
    expect(r.product?.key).toBe("term_loan");
    expect(r.summary).toContain("Term loan");
  });

  it("falls back to full list when key unknown", async () => {
    const r = await infoProducts({ product_key: "made_up" });
    expect(r.ok).toBe(true);
    expect(r.products?.length).toBe(PRODUCTS.length);
    expect(r.summary).toContain('No product matches "made_up"');
  });

  it("includes pgi in the catalog (marketing surface)", async () => {
    const r = await infoProducts({ product_key: "pgi" });
    expect(r.product?.name).toContain("Personal Guarantee");
  });

  it("descriptor advertises name and no required args", () => {
    expect(INFO_PRODUCTS_TOOL_DESCRIPTOR.function.name).toBe("info.products");
    expect((INFO_PRODUCTS_TOOL_DESCRIPTOR.function.parameters as any).required).toBeUndefined();
  });
});

describe("AGENT_BLOCK_v4 — info.qualifications", () => {
  it("lists all qualification topics when no key", async () => {
    const r = await infoQualifications({});
    expect(r.ok).toBe(true);
    expect(r.qualifications?.length).toBe(QUALIFICATIONS.length);
  });

  it("returns a specific topic when key matches", async () => {
    const r = await infoQualifications({ key: "annual_revenue" });
    expect(r.qualification?.key).toBe("annual_revenue");
  });

  it("descriptor advertises name", () => {
    expect(INFO_QUALIFICATIONS_TOOL_DESCRIPTOR.function.name).toBe("info.qualifications");
  });
});

describe("AGENT_BLOCK_v4 — lead.capture", () => {
  beforeEach(() => callMock.mockReset());

  it("rejects when neither email nor phone given", async () => {
    const r = await leadCapture({ name: "Jane" });
    expect(r.ok).toBe(false);
    expect(callMock).not.toHaveBeenCalled();
  });

  it("rejects when email looks invalid", async () => {
    const r = await leadCapture({ email: "not-an-email" });
    expect(r.ok).toBe(false);
    expect(callMock).not.toHaveBeenCalled();
  });

  it("forwards a valid lead to BF-Server", async () => {
    callMock.mockResolvedValueOnce({});
    const r = await leadCapture({
      name: "Jane Doe",
      email: "jane@example.com",
      company_name: "Acme",
      utm_source: "google",
    });
    expect(r.ok).toBe(true);
    expect(callMock).toHaveBeenCalledWith(
      "/api/crm/startup-waitlist",
      expect.objectContaining({
        method: "POST",
        body: expect.objectContaining({
          email: "jane@example.com",
          name: "Jane Doe",
          companyName: "Acme",
          channel: "website",
          source: "maya_visitor_tool",
          utm_source: "google",
        }),
      }),
    );
    expect(r.summary).toContain("jane@example.com");
  });

  it("accepts phone-only leads", async () => {
    callMock.mockResolvedValueOnce({});
    const r = await leadCapture({ phone: "+14165551234" });
    expect(r.ok).toBe(true);
  });

  it("returns ok=false on transport error", async () => {
    callMock.mockRejectedValueOnce(new Error("network"));
    const r = await leadCapture({ email: "jane@example.com" });
    expect(r.ok).toBe(false);
    expect(r.summary).toContain("lead_capture_failed");
  });

  it("descriptor advertises name", () => {
    expect(LEAD_CAPTURE_TOOL_DESCRIPTOR.function.name).toBe("lead.capture");
  });
});

describe("AGENT_BLOCK_v4 — apply.start_url", () => {
  it("returns the public apply URL", async () => {
    const r = await applyStartUrl();
    expect(r.ok).toBe(true);
    expect(r.url).toMatch(/^https:\/\/client\.boreal\.financial/);
    expect(r.summary).toContain(r.url);
  });

  it("descriptor advertises name", () => {
    expect(APPLY_START_URL_TOOL_DESCRIPTOR.function.name).toBe("apply.start_url");
  });
});
