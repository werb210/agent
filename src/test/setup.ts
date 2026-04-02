import { vi } from 'vitest';

(globalThis as typeof globalThis & { jest: typeof vi }).jest = vi;

process.env.API_URL = process.env.API_URL ?? 'https://server.boreal.financial';
process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ approval_probability: 0.5, probability: 0.5, data: { probability: 0.5 } }),
  } as Response)
);
