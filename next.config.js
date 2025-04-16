/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["avatars.githubusercontent.com"],
  },
  compiler: {
    // Enable the React new JSX transform
    jsx: {
      runtime: "automatic",
    },
  },
};

module.exports = nextConfig;
