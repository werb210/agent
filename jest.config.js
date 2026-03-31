const tsJestPath = require.resolve("ts-jest");

/** @type {import("jest").Config} **/
module.exports = {
  setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.js"],
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": [tsJestPath, {}],
  },
};
