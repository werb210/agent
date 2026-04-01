import { saveToken } from "../src/services/token";

const fetchMock = jest.fn();

globalThis.fetch = fetchMock as any;

fetchMock.mockResolvedValue({
  ok: true,
  status: 200,
  json: async () => ({ status: "ok" }),
});

describe("api smoke", () => {
  beforeEach(() => {
    fetchMock.mockClear();
    saveToken("test-token");
  });

  it("calls api endpoint and validates response envelope", async () => {
    const { apiRequest } = await import("../src/lib/api");

    await expect(apiRequest<{ status: string }>("/api/health", "GET")).resolves.toEqual({ status: "ok" });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/health",
      expect.objectContaining({
        method: "GET"
      })
    );
  });
});
