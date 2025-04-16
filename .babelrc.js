module.exports = {
  // This file is used by Jest for testing
  presets: [
    [
      "next/babel",
      {
        "preset-react": {
          runtime: "automatic",
          importSource: "react",
        },
      },
    ],
  ],
};
