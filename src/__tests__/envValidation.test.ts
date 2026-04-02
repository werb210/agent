import { validateEnv } from "../system/env";

describe("validateEnv", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.API_URL;
    delete process.env.AGENT_API_TOKEN;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("fails when API_URL is missing", () => {
    process.env.AGENT_API_TOKEN = "token";

    expect(() => validateEnv()).toThrow("MISSING_API_URL");
  });

  it("fails when API_URL does not include /api/v1", () => {
    process.env.API_URL = "https://example.com/api";
    process.env.AGENT_API_TOKEN = "token";

    expect(() => validateEnv()).toThrow("INVALID_API_VERSION");
  });
});
