import nextPlugin from "eslint-plugin-next";
import typescriptPlugin from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import eslintCommentsPlugin from "eslint-plugin-eslint-comments";

export default [
  {
    // Global configuration
    ignores: ["node_modules/**", ".next/**", "dist/**"],
  },

  // Next.js configuration
  {
    plugins: {
      next: nextPlugin,
    },
    rules: {
      ...nextPlugin.configs["recommended"].rules,
    },
  },

  // TypeScript configuration
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "@typescript-eslint": typescriptPlugin,
    },
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    rules: {
      ...typescriptPlugin.configs["recommended"].rules,

      // Forbid 'any' type as specified in DEVELOPMENT_PHILOSOPHY.md
      // Set to warn instead of error initially to avoid breaking existing code
      "@typescript-eslint/no-explicit-any": "warn",

      // Prevent suppression directives (from DEVELOPMENT_PHILOSOPHY.md section 6)
      "@typescript-eslint/ban-ts-comment": "warn",

      // Relax some rules for existing code
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },

  // ESLint comments rules
  {
    plugins: {
      "eslint-comments": eslintCommentsPlugin,
    },
    rules: {
      "eslint-comments/no-unlimited-disable": "warn",
      "eslint-comments/no-unused-disable": "warn",
    },
  },

  // Standard rules
  {
    rules: {
      // Encourage immutability (from DEVELOPMENT_PHILOSOPHY.md section 3)
      "prefer-const": "error",
      "no-var": "error",

      // Meaningful naming (from DEVELOPMENT_PHILOSOPHY.md section 5)
      camelcase: "warn",

      // Function purity (from DEVELOPMENT_PHILOSOPHY.md section 4)
      "no-param-reassign": "warn",

      // File complexity (inspired by DEVELOPMENT_PHILOSOPHY.md section 1)
      "max-lines": [
        "warn",
        { max: 500, skipBlankLines: true, skipComments: true },
      ],
      "max-lines-per-function": [
        "warn",
        { max: 100, skipBlankLines: true, skipComments: true },
      ],
      complexity: ["warn", 10],
      "max-depth": ["warn", 3],
      "max-nested-callbacks": ["warn", 3],
    },
  },
];
