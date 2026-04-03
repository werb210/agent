import { beforeEach, afterEach, describe, expect, test, vi } from "vitest";
import { handleMessage } from "../core/handleMessage";

describe("Maya message handler hardening", () => {
  beforeEach(() => {
    vi.spyOn(global, "fetch").mockImplementation(async (url) => {
      if (typeof url === "string" && url.includes("/v1/application/status")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ status: "In Review" }),
        } as Response;
      }

      return {
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      } as Response;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("handles invalid input", async () => {
    const res = await handleMessage("", {});
    expect(res.message).toBeDefined();
  });

  test("routes application intent", async () => {
    const res = await handleMessage("I want to apply", {});
    expect(res.message).toContain("Application");
  });
});
