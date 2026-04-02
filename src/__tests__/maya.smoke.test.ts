import { describe, it, expect, vi } from "vitest";
import { callMaya } from "../api/maya";

describe("Maya real integration", () => {
  it("GET /health", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        json: async () => ({ status: "ok", data: { health: "ok" } }),
      }))
    );

    const result = await callMaya("/health");

    expect(result).toBeDefined();
  });
});
