import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import { THEME_SCRIPT } from "@/lib/theme";

const geistSans = Geist({
	subsets: ["latin"],
	variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
	subsets: ["latin"],
	variable: "--font-geist-mono",
});

export const viewport: Viewport = {
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#ffffff" },
		{ media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
	],
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
	viewportFit: "cover",
};

export const metadata: Metadata = {
	// Canonical origin for absolute OG / Twitter image URLs (https://wavelet.titosy.dev in production).
	metadataBase: process.env.BETTER_AUTH_URL ? new URL(process.env.BETTER_AUTH_URL) : undefined,
	title: "wavelet",
	description: "Music downloader powered by Deezer",
	applicationName: "wavelet",
	appleWebApp: {
		capable: true,
		statusBarStyle: "black-translucent",
		title: "wavelet",
	},
	formatDetection: {
		telephone: false,
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			suppressHydrationWarning
			className={cn("h-full", geistSans.variable, geistMono.variable)}
		>
			<head>
				{/* Resolve the theme before first paint to avoid a light flash. */}
				<script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
			</head>
			<body className="min-h-full font-sans bg-background text-foreground">
				<ServiceWorkerRegistration />
				<TooltipProvider>{children}</TooltipProvider>
			</body>
		</html>
	);
}
