# ESLint Configuration Decision

After reviewing both `.eslintrc.js` and `eslint.config.mjs` configurations, I've decided to standardize on **eslint.config.mjs** (flat config) for the following reasons:

## Reasons for choosing the flat config format:

1. **Future Compatibility**: ESLint has made the flat config format the standard as of ESLint v9, which this project is already using (v9.22.0). The legacy config format will eventually be deprecated.

2. **Enhanced Functionality**: The flat config provides better support for:

   - Module-based plugins (ESM)
   - Configuration cascading and overrides
   - More explicit and structured rule organization
   - More granular path-specific configuration

3. **Comprehensive Configuration**: The current `eslint.config.mjs` already includes:

   - More plugins (react, react-hooks, import, jsx-a11y)
   - Better file type targeting with the `files` property
   - Explicit parser configuration for TypeScript
   - Organization by categories with separate rule sections

4. **Modern JavaScript**: The flat config uses ES modules (`.mjs`), which aligns with the broader JavaScript ecosystem's move toward native modules.

5. **Flexibility**: The array-based structure makes it easier to compose configurations from multiple sources and override rules for specific file patterns.

## Key differences between the current configurations:

- The flat config has more plugins and explicit rule configurations for React and accessibility
- The legacy config extends "next/core-web-vitals" and "prettier"
- Both configurations have similar core rules based on our development philosophy
- The flat config has better organization with rules grouped by purpose

## Next steps:

1. Consolidate any unique rules from `.eslintrc.js` into the flat config
2. Update the `eslint.config.mjs` to include any missing extended configurations
3. Remove `.eslintrc.js` once the consolidation is complete
4. Document the decision in the project documentation
