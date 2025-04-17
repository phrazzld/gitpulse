/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["avatars.githubusercontent.com"],
  },
  // Use swcMinify for production builds and configure other options as needed
  swcMinify: true,
};

module.exports = nextConfig;
