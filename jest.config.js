const tsJestPath = require.resolve("ts-jest");

/** @type {import("jest").Config} **/
module.exports = {
  setupFiles: [],
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": [tsJestPath, {}],
  },
};
