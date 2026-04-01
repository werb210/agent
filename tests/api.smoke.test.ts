import { checkHealth } from "../src/health";
import { pool } from "../src/db";

describe("service smoke", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.spyOn(pool, "query").mockResolvedValue({ rows: [{ ok: 1 }], rowCount: 1 });
    process.env = {
      ...originalEnv,
      OPENAI_API_KEY: "test-openai-key",
      TWILIO_ACCOUNT_SID: "test-sid",
      TWILIO_AUTH_TOKEN: "test-token",
      REDIS_URL: "redis://127.0.0.1:6379"
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("calls internal readiness directly", async () => {
    await expect(checkHealth()).resolves.toEqual({ status: "ok" });
  });
});
