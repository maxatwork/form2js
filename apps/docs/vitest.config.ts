import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["test-e2e/**"]
  }
});
