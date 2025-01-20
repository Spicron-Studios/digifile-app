/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'qisxkjvaehtwayccikyj.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  experimental: {
    serverExternalPackages: ["next-auth"],
    typedRoutes: false,
  },
  typescript: {
    // !! WARN !!
    // This will allow production builds to successfully complete
    // even if your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig