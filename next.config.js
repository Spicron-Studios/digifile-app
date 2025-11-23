/** @type {import('next').NextConfig} */
const webpack = require("webpack");

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
	webpack: (config) => {
		// Allow using the Node.js `node:` protocol (e.g. `node:crypto`) in source
		// while still letting Webpack resolve the core modules correctly.
		// This keeps Biome's `useNodejsImportProtocol` rule happy and fixes
		// the Next.js build error about the unsupported "node:" scheme.
		config.plugins.push(
			new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
				// Strip the `node:` prefix so Webpack sees the core module name.
				// Example: "node:crypto" -> "crypto"
				// eslint-disable-next-line no-param-reassign
				resource.request = resource.request.replace(/^node:/, "");
			}),
		);
		return config;
	},
	experimental: {
		typedRoutes: false,
		serverActions: {
			bodySizeLimit: "10mb",
		},
	},
	eslint: {
		ignoreDuringBuilds: true,
	},
};

module.exports = nextConfig;
