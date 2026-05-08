import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Prototype code excluded from tsconfig (see commit b87bf70).
    "design/**",
    // Generated coverage output (vitest --coverage).
    "coverage/**",
    // Generated Prisma client.
    "src/generated/**",
  ]),
]);

export default eslintConfig;
