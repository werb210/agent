process.env.AGENT_API_TOKEN = process.env.AGENT_API_TOKEN || "test-token";

jest.mock("axios", () => {
  const requestMock = jest.fn(async (config: any) => {
    if (config.url === "/api/health" && String(config.method).toUpperCase() === "GET") {
      return {
        status: 200,
        data: {
          success: true,
          data: { status: "ok" }
        }
      };
    }

    return {
      status: 500,
      data: {
        success: false,
        error: "not found"
      }
    };
  });

  return {
    __esModule: true,
    default: {
      create: () => ({
        interceptors: {
          request: { use: jest.fn() }
        },
        request: requestMock
      }),
      isAxiosError: () => true
    }
  };
});

describe("api smoke", () => {
  it("calls BF endpoint and validates response envelope", async () => {
    const { apiRequest } = await import("../src/lib/api");

    await expect(apiRequest<{ status: string }>("/api/health", "GET")).resolves.toEqual({ status: "ok" });
  });
});
