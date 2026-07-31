import { reactRouter } from "@react-router/dev/vite";
import yaml from "@rollup/plugin-yaml";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";

import { markdown } from "./plugins/markdown";

export default defineConfig({
  plugins: [tailwindcss(), markdown(), reactRouter(), yaml()],
  test: {
    include: ["src/content/**/*.test.ts", "src/lib/**/*.test.ts"],
    environment: "node",
    passWithNoTests: true,
  },
});
