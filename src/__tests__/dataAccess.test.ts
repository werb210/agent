const queryMock = jest.fn();

jest.mock("pg", () => ({
  Pool: jest.fn().mockImplementation(() => ({
    query: queryMock
  }))
}));

import {
  findApplication,
  getDocumentStatus,
  getLenderProductRanges
} from "../services/dataAccess";
import {
  getApplicationsByStatus,
  getPipelineSummary
} from "../services/staffDataAccess";
import { formatRateRanges } from "../services/dataFormatter";
import { interpretAction } from "../services/actionInterpreter";

describe("data access layer", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it("looks up an application by identifier", async () => {
    queryMock.mockResolvedValue({
      rows: [{ id: "app_1", status: "review", product_type: "LOC", created_at: "2026-01-01" }]
    });

    const app = await findApplication("client@example.com");

    expect(app).toEqual(expect.objectContaining({ id: "app_1", status: "review" }));
    expect(queryMock).toHaveBeenCalledWith(expect.stringContaining("FROM applications"), ["client@example.com"]);
  });

  it("retrieves document status for an application", async () => {
    queryMock.mockResolvedValue({
      rows: [{ document_type: "bank_statement", status: "received" }]
    });

    const docs = await getDocumentStatus("app_1");

    expect(docs).toEqual([{ document_type: "bank_statement", status: "received" }]);
    expect(queryMock).toHaveBeenCalledWith(expect.stringContaining("FROM documents"), ["app_1"]);
  });

  it("returns formatted loc rates for active products", async () => {
    queryMock.mockResolvedValue({
      rows: [
        { lender_name: "Lender A", min_rate: 7, max_rate: 19 }
      ]
    });

    const products = await getLenderProductRanges("LOC");
    const formatted = formatRateRanges(products);

    expect(queryMock).toHaveBeenCalledWith(expect.stringContaining("FROM lender_products"), ["LOC"]);
    expect(formatted).toEqual([{ lender: "Lender A", range: "7% to 19%" }]);
  });

  it("returns safe response for unknown product", () => {
    expect(formatRateRanges([])).toBe("No active products available at this time.");
  });
});

describe("action interpreter data query intents", () => {
  it("detects application status intent", () => {
    expect(interpretAction("Can I get the status of my application?")).toEqual(
      expect.objectContaining({ type: "qualify", requiresConfirmation: false })
    );
  });

  it("detects rates intent", () => {
    expect(interpretAction("What are LOC rates right now?")).toEqual(
      expect.objectContaining({ type: "none", payload: { dataQuery: "rates" } })
    );
  });

  it("detects pipeline summary staff intent", () => {
    expect(interpretAction("Give me pipeline summary")).toEqual(
      expect.objectContaining({ type: "staff_pipeline_summary", requiresConfirmation: false })
    );
  });

  it("detects applications by status staff intent", () => {
    expect(interpretAction("show applications in booking")).toEqual(
      expect.objectContaining({
        type: "staff_applications_by_status",
        payload: { status: "booking" }
      })
    );
  });
});

describe("staff data access layer", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it("retrieves pipeline summary grouped by status", async () => {
    queryMock.mockResolvedValue({
      rows: [{ status: "qualifying", count: "14" }]
    });

    const summary = await getPipelineSummary();

    expect(summary).toEqual([{ status: "qualifying", count: "14" }]);
    expect(queryMock).toHaveBeenCalledWith(expect.stringContaining("GROUP BY status"));
  });

  it("retrieves applications for a given status", async () => {
    queryMock.mockResolvedValue({
      rows: [{ id: "app_1", applicant_name: "A", product_type: "LOC", created_at: "2026-01-01" }]
    });

    const apps = await getApplicationsByStatus("booking");

    expect(apps).toEqual([
      { id: "app_1", applicant_name: "A", product_type: "LOC", created_at: "2026-01-01" }
    ]);
    expect(queryMock).toHaveBeenCalledWith(expect.stringContaining("WHERE status = $1"), ["booking"]);
  });
});
