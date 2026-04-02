import { beforeAll, afterAll, afterEach, vi } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

process.env.API_URL = process.env.API_URL ?? "https://server.boreal.financial";
process.env.NODE_ENV = process.env.NODE_ENV ?? "test";

(globalThis as typeof globalThis & { jest: typeof vi }).jest = vi;

export const server = setupServer(
  http.post("*/api/v1/applications", () => {
    return HttpResponse.json({ id: "mock-id" });
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true, data: {} })
  } as Response)
);
