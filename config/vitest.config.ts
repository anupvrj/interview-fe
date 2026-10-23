import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/__tests__/**/*.test.{ts,tsx}"],
    globals: false,
  },
  // Component tests (.tsx) use React's automatic JSX runtime.
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "../src"),
    },
  },
});
