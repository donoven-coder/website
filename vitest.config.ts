// Tests for the /api functions and the follow-up copy: `npm test`. Not part of the site build.
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  test: { include: ["tests/**/*.test.ts"], environment: "node" },
});
