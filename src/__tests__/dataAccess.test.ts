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
});
