import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    isolate: true,
    globals: true,
    environment: "node",
    setupFiles: "./src/__tests__/setup.ts",
  },
});
