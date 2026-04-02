import { getEnv } from "../config/env";

describe("env validation", () => {
  it("returns valid env in test mode", () => {
    const env = getEnv();
    expect(env.API_URL).toBeDefined();
  });
});
