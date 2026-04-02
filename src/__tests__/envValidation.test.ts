import { validateEnv } from "../system/env";

describe("validateEnv", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, API_URL: "https://server.boreal.financial", NODE_ENV: "test" };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("passes when required environment variables are present", () => {
    expect(() => validateEnv()).not.toThrow();
  });
});
