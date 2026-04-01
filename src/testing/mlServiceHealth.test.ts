import { checkHealth } from "../health";

describe("Runtime Health", () => {
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

  it("returns ok when required dependencies are configured", async () => {
    await expect(checkHealth()).resolves.toEqual({ status: "ok" });
  });
});
