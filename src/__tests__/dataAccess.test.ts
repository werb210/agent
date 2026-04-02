import { findApplication, getDocumentStatus, getLenderProductRanges } from "../services/dataAccess";
import { interpretAction } from "../services/actionInterpreter";
import { getApplicationsByStatus, getPipelineSummary } from "../services/staffDataAccess";

const callBFServer = jest.fn();

jest.mock("../integrations/bfServerClient", () => ({
  callBFServer: (...args: unknown[]) => callBFServer(...args)
}));

describe("data access layer", () => {
  beforeEach(() => {
    callBFServer.mockReset();
  });

  it("routes application lookup via BF server", async () => {
    callBFServer.mockResolvedValueOnce({ id: "app_1" });
    await findApplication("+1555");
    expect(callBFServer).toHaveBeenCalledWith(expect.stringContaining("/api/applications/status"), "GET");
  });

  it("routes document status lookup via BF server", async () => {
    callBFServer.mockResolvedValueOnce([]);
    await getDocumentStatus("app_1");
    expect(callBFServer).toHaveBeenCalledWith(expect.stringContaining("applicationId=app_1"), "GET");
  });

  it("routes lender product lookup via BF server", async () => {
    callBFServer.mockResolvedValueOnce([{ lender_name: "Lender A", min_rate: 7, max_rate: 19 }]);
    await getLenderProductRanges("LOC");
    expect(callBFServer).toHaveBeenCalledWith(expect.stringContaining("productType=LOC"), "GET");
  });
});

describe("action interpreter", () => {
  it("maps structured transfer tool", () => {
    expect(interpretAction('{"tool":"transferCall"}')).toEqual(expect.objectContaining({ type: "transfer" }));
  });
});

describe("staff data access layer", () => {
  beforeEach(() => {
    callBFServer.mockReset();
  });

  it("retrieves pipeline summary", async () => {
    callBFServer.mockResolvedValueOnce([{ status: "qualifying", count: "14" }]);
    const summary = await getPipelineSummary();
    expect(summary).toEqual([{ status: "qualifying", count: "14" }]);
  });

  it("retrieves applications for status", async () => {
    callBFServer.mockResolvedValueOnce([{ id: "app_1" }]);
    const apps = await getApplicationsByStatus("booking");
    expect(apps).toEqual([{ id: "app_1" }]);
  });
});
