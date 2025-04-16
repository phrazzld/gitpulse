/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["avatars.githubusercontent.com"],
  },
  compiler: {
    // Enable the React new JSX transform for Next.js compilation
    // This works in conjunction with "jsx": "preserve" in tsconfig.json
    // Note: Test environment has its own handling through jest and babel config
    jsx: {
      runtime: "automatic",
    },
  },
};

module.exports = nextConfig;
