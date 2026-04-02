import { vi } from "vitest";

process.env.AGENT_API_TOKEN ||= "test-token";

global.fetch = vi.fn((url, options: any) => {
  if (!options?.headers?.Authorization) {
    throw new Error("Missing Authorization header");
  }

  if (!options?.headers?.["x-request-id"]) {
    throw new Error("Missing request id");
  }

  return Promise.resolve({
    ok: true,
    status: 200,
    json: async () => ({ success: true }),
    text: async () => "",
  } as Response);
});
