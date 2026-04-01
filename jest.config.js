module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts", "<rootDir>/src/test/setup.ts"],
  detectOpenHandles: true,
  forceExit: true,
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "setupTests.ts"]
};
