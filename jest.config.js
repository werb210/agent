module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts", "<rootDir>/src/__tests__/setupTests.ts"],
  detectOpenHandles: true,
  forceExit: true
};
