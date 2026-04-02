import { afterEach, vi } from "vitest";

const jestCompat = Object.assign({}, vi, {
  requireMock: (path: string) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(path);
  },
});

(globalThis as typeof globalThis & { jest: typeof jestCompat }).jest = jestCompat;

process.env.API_URL = process.env.API_URL || "http://localhost:3000";
process.env.NODE_ENV = process.env.NODE_ENV || "test";

afterEach(() => {
  vi.clearAllMocks();
});
