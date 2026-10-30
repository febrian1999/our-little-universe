import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**"],
    coverage: {
      provider: "v8",
      include: ["lib/**"],
      // Query repository & migrasi diuji manual di Neon branch (PRD §17.4).
      exclude: ["lib/db/**"],
      reporter: ["text", "lcov"],
      thresholds: { lines: 80, functions: 80 },
    },
  },
});
