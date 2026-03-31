import { saveToken } from "../src/services/token";

beforeAll(() => {
  if (!process.env.TEST_TOKEN) {
    throw new Error("[TEST BLOCKED]");
  }

  saveToken(process.env.TEST_TOKEN);
});
