import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";

const spaceGrotesk = Space_Grotesk({
	subsets: ["latin"],
	variable: "--font-sans",
	weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
	subsets: ["latin"],
	variable: "--font-mono",
	weight: ["400", "500", "700"],
});

export const viewport: Viewport = {
	themeColor: "#18181B",
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
	viewportFit: "cover",
};

export const metadata: Metadata = {
	title: "deemix",
	description: "Music downloader powered by Deezer",
	applicationName: "deemix",
	appleWebApp: {
		capable: true,
		statusBarStyle: "black-translucent",
		title: "deemix",
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
			className={cn("h-full", spaceGrotesk.variable, jetbrainsMono.variable)}
		>
			<body className="min-h-full font-sans bg-background text-foreground">
				<ServiceWorkerRegistration />
				<TooltipProvider>{children}</TooltipProvider>
			</body>
		</html>
	);
}
