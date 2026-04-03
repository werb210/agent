import { describe, it, expect, vi } from "vitest";
import { callMaya } from "../api/maya";

describe("Maya real integration", () => {
  it("POST /api/v1/maya/message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ status: "ok", data: {} }),
      }))
    );

    const result = await callMaya("/health");

    expect(result).toEqual({});
  });
});
