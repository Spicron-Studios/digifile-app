/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverExternalPackages: ["next-auth"],
  }
}

module.exports = nextConfig