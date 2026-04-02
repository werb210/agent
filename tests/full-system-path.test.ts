import { createLead, startCall, updateCallStatus } from "../src/tools";
import { endpoints } from "../src/contracts/endpoints";

describe("full system path", () => {
  beforeEach(() => {
    (global as any).fetch = jest.fn(async (url: string) => {
      const path = String(url);

      if (path.endsWith(endpoints.createLead)) {
        return { json: async () => ({ success: true, data: { id: "lead-1" } }) } as Response;
      }

      if (path.endsWith(endpoints.startCall)) {
        return { json: async () => ({ success: true, data: { callId: "call-1" } }) } as Response;
      }

      if (path.endsWith(endpoints.updateCallStatus)) {
        return { json: async () => ({ success: true, data: { updated: true } }) } as Response;
      }

      return { status: 404, json: async () => ({ success: false, error: "Not found" }) } as Response;
    });
  });

  it("full flow", async () => {
    const lead = await createLead({ name: "A", email: "a@b.com", phone: "123" }, "token");
    const call = await startCall({ to: "+15555550123" }, "token");
    const update = await updateCallStatus({ callId: "call-1", status: "completed" }, "token");

    expect(lead).toBeDefined();
    expect(call).toBeDefined();
    expect(update).toBeDefined();
  });

  it("fails if lead creation layer breaks", async () => {
    (global as any).fetch = jest.fn(async (url: string) => {
      const path = String(url);
      if (path.endsWith(endpoints.createLead)) {
        return { json: async () => ({ success: false, error: "lead failure" }) } as Response;
      }

      return { json: async () => ({ success: true, data: {} }) } as Response;
    });

    await expect(createLead({ name: "A", email: "a@b.com", phone: "123" }, "token")).rejects.toThrow("lead failure");
  });

  it("fails if call start layer breaks", async () => {
    (global as any).fetch = jest.fn(async (url: string) => {
      const path = String(url);
      if (path.endsWith(endpoints.createLead)) {
        return { json: async () => ({ success: true, data: { id: "lead-1" } }) } as Response;
      }

      if (path.endsWith(endpoints.startCall)) {
        return { json: async () => ({ success: false, error: "call start failure" }) } as Response;
      }

      return { json: async () => ({ success: true, data: {} }) } as Response;
    });

    await createLead({ name: "A", email: "a@b.com", phone: "123" }, "token");
    await expect(startCall({ to: "+15555550123" }, "token")).rejects.toThrow("call start failure");
  });

  it("fails if status update layer breaks", async () => {
    (global as any).fetch = jest.fn(async (url: string) => {
      const path = String(url);
      if (path.endsWith(endpoints.createLead)) {
        return { json: async () => ({ success: true, data: { id: "lead-1" } }) } as Response;
      }

      if (path.endsWith(endpoints.startCall)) {
        return { json: async () => ({ success: true, data: { callId: "call-1" } }) } as Response;
      }

      if (path.endsWith(endpoints.updateCallStatus)) {
        return { json: async () => ({ success: false, error: "status update failure" }) } as Response;
      }

      return { json: async () => ({ success: true, data: {} }) } as Response;
    });

    await createLead({ name: "A", email: "a@b.com", phone: "123" }, "token");
    await startCall({ to: "+15555550123" }, "token");
    await expect(updateCallStatus({ callId: "call-1", status: "completed" }, "token")).rejects.toThrow(
      "status update failure"
    );
  });
});
