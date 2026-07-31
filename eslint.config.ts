import eslint from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-plugin-prettier/recommended";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default defineConfig(
  globalIgnores([
    "node_modules/**",
    "dist/**",
    "coverage/**",
    "test-results/**",
    "playwright-report/**",
    "blob-report/**",
    ".react-router/**",
    "pnpm-lock.yaml",
    "docs/**",
    // plain Node ESM preview server; no @types/node in this repo
    "scripts/serveClient.mjs",
  ]),
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  reactHooks.configs.flat.recommended,
  prettier,
);
