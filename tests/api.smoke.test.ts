import { saveToken } from "../src/services/token";

const fetchMock = jest.fn(async (url: string, config: RequestInit) => {
  if (url === "/api/health" && String(config.method).toUpperCase() === "GET") {
    return {
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          success: true,
          data: { status: "ok" }
        })
    } as unknown as Response;
  }

  return {
    ok: false,
    status: 500,
    text: async () => "not found"
  } as unknown as Response;
});

describe("api smoke", () => {
  beforeEach(() => {
    fetchMock.mockClear();
    (global as any).fetch = fetchMock;
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
