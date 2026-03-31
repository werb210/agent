const fetchMock = jest.fn(async (url: string, config: RequestInit) => {
  if (url === "https://boreal-staff-server.azurewebsites.net/api/health" && String(config.method).toUpperCase() === "GET") {
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({
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
  });

  it("calls BF endpoint and validates response envelope", async () => {
    const { bfServerRequest } = await import("../src/integrations/bfServerClient");

    await expect(bfServerRequest("/api/health", "GET")).resolves.toEqual({ status: "ok" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://boreal-staff-server.azurewebsites.net/api/health",
      expect.objectContaining({
        method: "GET"
      })
    );
  });
});
