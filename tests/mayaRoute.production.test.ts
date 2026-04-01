import { checkHealth } from "../src/health";

describe("maya runtime regression guard", () => {
  const originalEnv = process.env;

  beforeEach(() => {
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

  it("stays deterministic without network probing", async () => {
    await expect(checkHealth()).resolves.toEqual({ status: "ok" });
  });

  it("fails fast when required env is missing", async () => {
    delete process.env.OPENAI_API_KEY;
    await expect(checkHealth()).rejects.toThrow("Missing required environment variables");
  });
});
