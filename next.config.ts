import type { NextConfig } from "next";

const REMOTE_API = process.env.REMOTE_API_URL; // e.g. https://music.titosy.dev

const nextConfig: NextConfig = {
	images: {
		unoptimized: true,
	},
	// The share OG image reads its font from disk (src/app/share/t/[shareId]/og-font.ts).
	outputFileTracingIncludes: {
		"/share/t/**": ["./assets/fonts/**/*"],
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
