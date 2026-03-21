import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

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
		<html lang="en" className={cn("h-full antialiased", geist.variable)}>
			<body className="min-h-full font-sans bg-background text-foreground">
				<TooltipProvider>{children}</TooltipProvider>
			</body>
		</html>
	);
}
