import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: [
        "src/lib/domain/**/*.ts",
        "src/lib/services/**/*.ts",
        "src/lib/actions/travel-actions.ts",
        "src/lib/actions/booking-actions.ts",
        "src/lib/actions/member-actions.ts",
        "src/lib/validation/**/*.ts",
      ],
      reporter: ["text", "json-summary", "html"],
      thresholds: {
        lines: 85,
        functions: 90,
        branches: 80,
        statements: 85,
      },
    },
  },
});
