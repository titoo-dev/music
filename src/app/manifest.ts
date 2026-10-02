import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "wavelet",
		short_name: "wavelet",
		description: "Music downloader powered by Deezer",
		start_url: "/",
		display: "standalone",
		// Desktop PWA: drop the title bar and let the app header run up to the
		// window controls (see the window-controls-overlay rules in globals.css).
		display_override: ["window-controls-overlay", "standalone"],
		background_color: "#0a0a0a",
		theme_color: "#0a0a0a",
		orientation: "portrait-primary",
		categories: ["music", "entertainment"],
		icons: [
			{
				src: "/icons/icon-192.png",
				sizes: "192x192",
				type: "image/png",
			},
			{
				src: "/icons/icon-512.png",
				sizes: "512x512",
				type: "image/png",
			},
			{
				src: "/icons/icon-maskable-512.png",
				sizes: "512x512",
				type: "image/png",
				purpose: "maskable",
			},
		],
	};
}
