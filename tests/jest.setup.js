require("ts-node/register/transpile-only");

const { setRuntimeToken } = require("../src/lib/token.ts");

beforeAll(() => {
  if (!process.env.TEST_TOKEN) {
    throw new Error("[TEST BLOCKED] NO TEST TOKEN PROVIDED");
  }

  setRuntimeToken(process.env.TEST_TOKEN);
});
