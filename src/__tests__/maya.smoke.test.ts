import { describe, it, expect } from "vitest";
import { callMaya } from "../api/maya";

describe("Maya real integration", () => {
  it("GET /health", async () => {
    const result = await callMaya("/health");

    expect(result).toBeDefined();
  });
});
