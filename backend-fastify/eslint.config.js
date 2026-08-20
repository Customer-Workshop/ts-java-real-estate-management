import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["node_modules/**", "uploads/**", "coverage/**", "reports/**"],
  },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Reported as warnings so the existing codebase lints clean while new
      // occurrences still surface in CI logs.
      "no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", caughtErrors: "none" },
      ],
      "no-useless-assignment": "warn",
      "no-useless-escape": "warn",
    },
  },
];
