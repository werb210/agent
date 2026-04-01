import { createLead, startCall, updateCallStatus } from "../src/tools";
import { sendMessage } from "../src/api/maya";

describe("tool contract orchestration", () => {
  beforeEach(() => {
    (global as any).fetch = jest.fn(async (_url: string, init: RequestInit) => {
      const path = String(_url);
      const auth = (init.headers as Record<string, string>).Authorization;
      if (!auth) {
        return { json: async () => ({ success: false, error: "Missing auth token" }) } as Response;
      }

      if (path.endsWith("/api/lead")) {
        return { json: async () => ({ success: true, data: { saved: true } }) } as Response;
      }
      if (path.endsWith("/api/call/start")) {
        return { json: async () => ({ success: true, data: { started: true } }) } as Response;
      }
      if (path.endsWith("/api/voice/status")) {
        return { json: async () => ({ success: true, data: { recorded: true } }) } as Response;
      }
      if (path.endsWith("/api/maya/message")) {
        return { json: async () => ({ success: true, data: { reply: "ok" } }) } as Response;
      }

      return { json: async () => ({ success: false, error: "Not found" }) } as Response;
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
