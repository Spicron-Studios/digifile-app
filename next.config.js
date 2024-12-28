/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["next-auth"],
  },
  auth: {
    path: "/app/lib/auth",
  }
};

module.exports = nextConfig;