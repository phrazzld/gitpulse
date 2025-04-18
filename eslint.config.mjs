import typescriptPlugin from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import eslintCommentsPlugin from "eslint-plugin-eslint-comments";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import importPlugin from "eslint-plugin-import";
import jsxA11yPlugin from "eslint-plugin-jsx-a11y";
import globals from "globals";

export default [
  {
    // Global configuration
    // Combined from .eslintignore and previous configuration
    ignores: [
      "node_modules/**", 
      ".next/**", 
      "dist/**",
      "coverage/**",
      "out/**",
      "build/**",
      "public/**",
      "*.config.js"
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },

  // React and Next.js configuration
  {
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      import: importPlugin,
      "jsx-a11y": jsxA11yPlugin,
    },
    settings: {
      react: {
        version: "detect",
        runtime: "automatic" // Add this setting for new JSX transform
      }
    },
    rules: {
      // React rules
      "react/react-in-jsx-scope": "off", // Next.js doesn't require React import
      "react/prop-types": "off", // We use TypeScript for type checking
      "react/jsx-no-target-blank": "off", // Next.js handles this for us
      
      // Import rules
      "import/no-anonymous-default-export": "warn",
      
      // A11y rules
      "jsx-a11y/alt-text": ["warn", { elements: ["img"] }],
      "jsx-a11y/aria-props": "warn",
      "jsx-a11y/aria-proptypes": "warn",
      "jsx-a11y/aria-unsupported-elements": "warn",
      "jsx-a11y/role-has-required-aria-props": "warn",
      "jsx-a11y/role-supports-aria-props": "warn",
      
      // Next.js recommended rules (from next/core-web-vitals)
      "jsx-a11y/anchor-is-valid": [
        "error",
        {
          components: ["Link"],
          specialLink: ["hrefLeft", "hrefRight"],
          aspects: ["invalidHref", "preferButton"],
        },
      ],
      
      // Next.js specific best practices (since we can't directly import next plugin in flat config)
      // We implement the key rules directly to maintain compatibility
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
        project: "./tsconfig.json",
      },
    },
    rules: {
      ...typescriptPlugin.configs["recommended"].rules,

      // Forbid 'any' type as specified in DEVELOPMENT_PHILOSOPHY.md
      // Changed from warn to error as per task T004
      "@typescript-eslint/no-explicit-any": "error",

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
      // Using the consistent threshold of 400 lines as per FILE_SIZE_THRESHOLD_DECISION.md
      "max-lines": [
        "warn",
        { max: 400, skipBlankLines: true, skipComments: true },
      ],
      "max-lines-per-function": [
        "warn",
        { max: 100, skipBlankLines: true, skipComments: true },
      ],
      complexity: ["warn", 10],
      "max-depth": ["warn", 3],
      "max-nested-callbacks": ["warn", 3],
    },
    
    // Prettier compatibility
    // This comes last to override any conflicting rules
    linterOptions: {
      noInlineConfig: false,
      reportUnusedDisableDirectives: true,
    },
  },
  
  // Override for test files
  {
    files: ["**/__tests__/**/*.{ts,tsx}", "**/*.test.{ts,tsx}"],
    rules: {
      // Relaxed rules for tests to allow for more verbose assertions and mocks
      // Keep as warn for test files to allow more flexibility in test assertions
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "max-lines-per-function": "off", // Tests can be longer
      "max-nested-callbacks": "off", // Tests often have nested describe/it blocks
    },
  },
];
