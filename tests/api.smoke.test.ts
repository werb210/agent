process.env.API_TOKEN = process.env.API_TOKEN || "test-token";

const fetchMock = jest.fn(async (url: string, config: RequestInit) => {
  if (url === "https://boreal-staff-server.azurewebsites.net/api/health" && String(config.method).toUpperCase() === "GET") {
    return {
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({
        success: true,
        data: { status: "ok" }
      })
    } as unknown as Response;
  }

  return {
    ok: false,
    status: 500,
    text: async () => "not found",
    headers: { get: () => "text/plain" }
  } as unknown as Response;
});

describe("api smoke", () => {
  beforeEach(() => {
    fetchMock.mockClear();
    (global as any).fetch = fetchMock;
  });

  it("calls BF endpoint and validates response envelope", async () => {
    const { apiRequest } = await import("../src/lib/api");

    await expect(apiRequest<{ status: string }>("/api/health", "GET")).resolves.toEqual({ status: "ok" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://boreal-staff-server.azurewebsites.net/api/health",
      expect.objectContaining({
        method: "GET"
      })
    );
  });
});
