import type { Metadata } from "next";
import "./globals.css";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

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

export const metadata: Metadata = {
	title: "deemix",
	description: "Music downloader powered by Deezer",
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
				<TooltipProvider>{children}</TooltipProvider>
			</body>
		</html>
	);
}
