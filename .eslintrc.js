module.exports = {
  extends: [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  rules: {
    // Forbid 'any' type as specified in DEVELOPMENT_PHILOSOPHY.md
    // Set to warn instead of error initially to avoid breaking existing code
    "@typescript-eslint/no-explicit-any": "warn",
    
    // Prevent suppression directives (from DEVELOPMENT_PHILOSOPHY.md section 6)
    "@typescript-eslint/ban-ts-comment": "warn",
    "eslint-comments/no-unlimited-disable": "warn",
    "eslint-comments/no-unused-disable": "warn",
    
    // Encourage immutability (from DEVELOPMENT_PHILOSOPHY.md section 3)
    "prefer-const": "error",
    "no-var": "error",
    
    // Meaningful naming (from DEVELOPMENT_PHILOSOPHY.md section 5)
    "camelcase": "warn",
    
    // Function purity (from DEVELOPMENT_PHILOSOPHY.md section 4)
    "no-param-reassign": "warn",
    
    // File complexity (inspired by DEVELOPMENT_PHILOSOPHY.md section 1)
    "max-lines": ["warn", { "max": 500, "skipBlankLines": true, "skipComments": true }],
    "max-lines-per-function": ["warn", { "max": 100, "skipBlankLines": true, "skipComments": true }],
    "complexity": ["warn", 10],
    "max-depth": ["warn", 3],
    "max-nested-callbacks": ["warn", 3],

    // Relax some rules for test files
    "@typescript-eslint/no-unused-vars": "warn"
  },
  plugins: ["@typescript-eslint", "eslint-comments"]
};