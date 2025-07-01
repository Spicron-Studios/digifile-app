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
    serverExternalPackages: ['next-auth'],
    typedRoutes: false,
  },
};

module.exports = nextConfig;
