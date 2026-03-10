import { findApplication, getDocumentStatus, getLenderProductRanges } from "../services/dataAccess";
import { interpretAction } from "../services/actionInterpreter";
import { getApplicationsByStatus, getPipelineSummary } from "../services/staffDataAccess";

const bfServerRequest = jest.fn();

jest.mock("../integrations/bfServerClient", () => ({
  bfServerRequest: (...args: unknown[]) => bfServerRequest(...args)
}));

describe("data access layer", () => {
  beforeEach(() => {
    bfServerRequest.mockReset();
  });

  it("routes application lookup via BF server", async () => {
    bfServerRequest.mockResolvedValueOnce({ id: "app_1" });
    await findApplication("+1555");
    expect(bfServerRequest).toHaveBeenCalledWith(expect.stringContaining("/api/applications/status"), "GET");
  });

  it("routes document status lookup via BF server", async () => {
    bfServerRequest.mockResolvedValueOnce([]);
    await getDocumentStatus("app_1");
    expect(bfServerRequest).toHaveBeenCalledWith(expect.stringContaining("applicationId=app_1"), "GET");
  });

  it("routes lender product lookup via BF server", async () => {
    bfServerRequest.mockResolvedValueOnce([{ lender_name: "Lender A", min_rate: 7, max_rate: 19 }]);
    await getLenderProductRanges("LOC");
    expect(bfServerRequest).toHaveBeenCalledWith(expect.stringContaining("productType=LOC"), "GET");
  });
});

describe("action interpreter", () => {
  it("maps structured transfer tool", () => {
    expect(interpretAction('{"tool":"transferCall"}')).toEqual(expect.objectContaining({ type: "transfer" }));
  });
});

describe("staff data access layer", () => {
  beforeEach(() => {
    bfServerRequest.mockReset();
  });

  it("retrieves pipeline summary", async () => {
    bfServerRequest.mockResolvedValueOnce([{ status: "qualifying", count: "14" }]);
    const summary = await getPipelineSummary();
    expect(summary).toEqual([{ status: "qualifying", count: "14" }]);
  });

  it("retrieves applications for status", async () => {
    bfServerRequest.mockResolvedValueOnce([{ id: "app_1" }]);
    const apps = await getApplicationsByStatus("booking");
    expect(apps).toEqual([{ id: "app_1" }]);
  });
});
