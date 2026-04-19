import { createLead, startCall, updateCallStatus } from "../src/tools/index.js";
import { sendMessage } from "../src/api/maya.js";
import { endpoints } from "../src/contracts/endpoints.js";

describe("tool contract orchestration", () => {
  beforeAll(() => {
    process.env.SERVER_URL = "https://server.boreal.financial";
  });

  beforeEach(() => {
    (global as any).fetch = vi.fn(async (_url: string, init: RequestInit) => {
      const path = String(_url);
      const auth = (init.headers as Record<string, string>).Authorization;
      if (!auth) {
        return { ok: false, status: 401, json: async () => ({ status: "error", error: "Missing auth token" }) } as Response;
      }

      if (path.endsWith(endpoints.createLead)) {
        return { ok: true, status: 200, json: async () => ({ status: "ok", data: { saved: true } }) } as Response;
      }
      if (path.endsWith(endpoints.startCall)) {
        return { ok: true, status: 200, json: async () => ({ status: "ok", data: { started: true } }) } as Response;
      }
      if (path.endsWith(endpoints.updateCallStatus)) {
        return { ok: true, status: 200, json: async () => ({ status: "ok", data: { recorded: true } }) } as Response;
      }
      if (path.endsWith(endpoints.sendMessage)) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ status: "ok", data: { reply: "ok" } }),
        } as Response;
      }

      return { ok: false, status: 404, json: async () => ({ status: "error", error: "Not found" }) } as Response;
    });
  });

  it("createLead tool → lead saved in server", async () => {
    await expect(createLead({ name: "A", email: "a@b.com", phone: "123" }, "token")).resolves.toEqual({ saved: true });
  });

  it("startCall tool → call endpoint hit", async () => {
    await expect(startCall({ to: "+15555550123" }, "token")).resolves.toEqual({ started: true });
  });

  it("updateCallStatus → status recorded", async () => {
    await expect(updateCallStatus({ callId: "id-1", status: "completed" }, "token")).resolves.toEqual({ recorded: true });
  });

  it("Maya message → valid response", async () => {
    await expect(sendMessage("hello", "token")).resolves.toEqual("ok");
    expect(global.fetch).toHaveBeenCalledWith(
      "https://server.boreal.financial/api/maya/message",
      expect.any(Object),
    );
  });

  it("Invalid payload → rejected", async () => {
    await expect(createLead({ name: "A", phone: "123" }, "token")).rejects.toThrow("Invalid tool payload");
  });

  it("Missing auth → rejected", async () => {
    await expect(startCall({ to: "+15555550123" }, "")).rejects.toThrow("Missing auth token");
  });
});
