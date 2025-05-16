module.exports = {
  extends: ["next/core-web-vitals", "plugin:storybook/recommended"],
  plugins: ["gitpulse"],
  overrides: [
    {
      files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx", "**/__tests__/**/*"],
      rules: {
        "gitpulse/no-direct-date-mock": ["error", {
          allowedFiles: ["src/lib/tests/dateMock.ts"]
        }]
      }
    }
  ]
};
