import type { NextConfig } from "next";

const REMOTE_API = process.env.REMOTE_API_URL; // e.g. https://music.titosy.dev

const nextConfig: NextConfig = {
	output: "standalone",
	images: {
		unoptimized: true,
	},
	...(REMOTE_API
		? {
				rewrites: async () => [
					{
						source: "/api/:path*",
						destination: `${REMOTE_API}/api/:path*`,
					},
				],
			}
		: {}),
};

export default nextConfig;
