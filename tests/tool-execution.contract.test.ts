import { execute } from "../src/ai/toolExecutor";

jest.mock("../src/tools", () => ({
  createLead: jest.fn().mockResolvedValue({ id: "lead-1" }),
  startCall: jest.fn().mockResolvedValue({ callId: "call-1" }),
  updateCallStatus: jest.fn().mockResolvedValue({ updated: true })
}));

jest.mock("../src/lib/db", () => ({
  queryDb: jest.fn().mockResolvedValue({ rows: [], rowCount: 1 })
}));

describe("tool execution response contract", () => {
  it("always returns structured success response", async () => {
    const response = await execute({
      callId: "test-call-id",
      name: "createLead",
      params: { name: "Alice", email: "alice@example.com", phone: "+15555550123" },
      fnOrToken: "token"
    });

    expect(response).toEqual({
      status: "ok",
      data: { id: "lead-1" }
    });
  });

  it("always returns structured error response", async () => {
    const response = await execute({
      callId: "test-call-id",
      name: "transferCall",
      params: { callSid: "abc" },
      fnOrToken: "token"
    });

    expect(response.status).toBe("error");
    expect(response).toEqual({
      status: "error",
      error: {
        code: "EXEC_FAIL",
        message: "INVALID_TOOL: transferCall"
      }
    });
  });
});
