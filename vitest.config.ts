import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ["./src/__tests__/setupEnv.ts"],
    include: ["src/__tests__/envValidation.test.ts"],
  },
});
