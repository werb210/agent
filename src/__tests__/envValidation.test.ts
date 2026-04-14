import { ENV, getEnv } from "../config/env";

describe("env validation", () => {
  it("returns valid env in test mode", () => {
    const env = getEnv();
    expect(env.API_URL).toBeDefined();
  });

  it("exports JWT_SECRET", () => {
    expect(ENV.JWT_SECRET).toBeDefined();
    expect(typeof ENV.JWT_SECRET).toBe("string");
  });

  it("exports AGENT_API_TOKEN", () => {
    expect(ENV.AGENT_API_TOKEN).toBeDefined();
  });
});
