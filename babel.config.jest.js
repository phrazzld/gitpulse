/**
 * Babel configuration for Jest tests
 *
 * This configuration is specifically designed to handle JSX transform for React 19
 * in the testing environment, while maintaining compatibility with Next.js.
 *
 * It resolves the JSX transform conflict between:
 * - Next.js requiring "jsx": "preserve" in tsconfig.json
 * - Tests needing proper JSX transform for React 19
 */
module.exports = {
  presets: [
    // Keep next/babel for Next.js features but customize React preset
    [
      "next/babel",
      {
        "preset-react": {
          runtime: "automatic",
          importSource: "react",
          development: process.env.NODE_ENV === "development",
        },
        // Ensure proper ES modules handling for tests
        "preset-env": {
          targets: {
            node: "current",
          },
          modules: "commonjs", // Use commonjs for Jest compatibility
        },
      },
    ],
    // Add separate React preset for explicit control over React 19 JSX transform
    [
      "@babel/preset-react",
      {
        runtime: "automatic",
        importSource: "react",
        development: process.env.NODE_ENV === "development",
      },
    ],
  ],
  // Ensure proper environment handling
  env: {
    test: {
      plugins: [
        // Ensure React runtime is correctly handled
        ["@babel/plugin-transform-react-jsx", { runtime: "automatic" }],
      ],
    },
  },
};
