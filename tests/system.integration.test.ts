import { createLead, startCall, updateCallStatus } from "../src/tools/index.js";
import { endpoints } from "../src/contracts/endpoints.js";

describe("system integration", () => {
  const originalApiUrl = process.env.API_URL;

  beforeEach(() => {
    process.env.API_URL = "https://server.example.com";
    (global as any).fetch = vi.fn(async (url: string) => {
      const path = String(url);

      if (path.endsWith(endpoints.createLead)) {
        return {
          status: 200,
          json: async () => ({ status: "ok", data: { id: "lead-1" } })
        } as Response;
      }

      if (path.endsWith(endpoints.startCall)) {
        return {
          status: 200,
          json: async () => ({ status: "ok", data: { callId: "call-1" } })
        } as Response;
      }

      if (path.endsWith(endpoints.updateCallStatus)) {
        return {
          status: 200,
          json: async () => ({ status: "ok", data: { updated: true } })
        } as Response;
      }

      return {
        status: 404,
        json: async () => ({ status: "error", error: "Not found" })
      } as Response;
    });
  });

  afterAll(() => {
    process.env.API_URL = originalApiUrl;
  });

  it("system integration", async () => {
    await expect(createLead({ name: "A", email: "a@b.com", phone: "123" }, "token")).resolves.toEqual({
      id: "lead-1"
    });

    await expect(startCall({ to: "+15555550123" }, "token")).resolves.toEqual({ callId: "call-1" });

    await expect(updateCallStatus({ callId: "call-1", status: "completed" }, "token")).resolves.toEqual({
      updated: true
    });
  });
});
