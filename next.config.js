/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "qisxkjvaehtwayccikyj.supabase.co",
				pathname: "/storage/v1/object/public/**",
			},
			{
				protocol: "https",
				hostname: "qisxkjvaehtwayccikyj.supabase.co",
				// Allow signed URLs with any path under /storage/v1/object/sign/
				pathname: "/storage/v1/object/sign/**",
			},
		],
	},
	experimental: {
		typedRoutes: false,
		serverActions: {
			bodySizeLimit: "10mb",
		},
	},
};

module.exports = nextConfig;
