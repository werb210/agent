import { createLead, startCall, updateCallStatus } from "../src/tools";
import { sendMessage } from "../src/api/maya";
import { endpoints } from "../src/contracts/endpoints";

describe("tool contract orchestration", () => {
  beforeEach(() => {
    (global as any).fetch = vi.fn(async (_url: string, init: RequestInit) => {
      const path = String(_url);
      const auth = (init.headers as Record<string, string>).Authorization;
      if (!auth) {
        return { json: async () => ({ status: "error", error: "Missing auth token" }) } as Response;
      }

      if (path.endsWith(endpoints.createLead)) {
        return { json: async () => ({ status: "ok", data: { saved: true } }) } as Response;
      }
      if (path.endsWith(endpoints.startCall)) {
        return { json: async () => ({ status: "ok", data: { started: true } }) } as Response;
      }
      if (path.endsWith(endpoints.updateCallStatus)) {
        return { json: async () => ({ status: "ok", data: { recorded: true } }) } as Response;
      }
      if (path.endsWith(endpoints.sendMessage)) {
        return { json: async () => ({ status: "ok", data: { reply: "ok" } }) } as Response;
      }

      return { status: 404, json: async () => ({ status: "error", error: "Not found" }) } as Response;
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
    await expect(sendMessage("hello", "token")).resolves.toEqual({ reply: "ok" });
  });

  it("Invalid payload → rejected", async () => {
    await expect(createLead({ name: "A", phone: "123" }, "token")).rejects.toThrow("Invalid tool payload");
  });

  it("Missing auth → rejected", async () => {
    await expect(startCall({ to: "+15555550123" }, "")).rejects.toThrow("Missing auth token");
  });
});
