"use client";

import { useAppStore } from "@/stores/useAppStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AudioCacheManager } from "@/components/audio/AudioCacheManager";

export default function AboutPage() {
	const { currentVersion, latestVersion, updateAvailable } = useAppStore();

	return (
		<div className="max-w-md mx-auto py-16 space-y-10">
			{/* Title */}
			<div className="text-center space-y-3">
				<div className="mx-auto flex h-16 w-16 items-center justify-center border-2 sm:border-[3px] border-foreground bg-primary text-2xl font-black text-white shadow-[var(--shadow-brutal)]">
					D
				</div>
				<h1 className="text-brutal-xl text-foreground mt-4">
					DEEMIX
				</h1>
				<p className="text-sm text-muted-foreground uppercase tracking-widest font-bold">Next.js edition</p>
			</div>

			{/* Version Info */}
			<Card>
				<CardHeader>
					<CardTitle>Version</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{currentVersion && (
						<div className="flex items-center justify-between">
							<span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Current</span>
							<span className="text-sm font-mono font-bold tabular-nums">
								{currentVersion}
							</span>
						</div>
					)}
					{latestVersion && (
						<div className="flex items-center justify-between">
							<span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Latest</span>
							<span className="text-sm font-mono font-bold tabular-nums">
								{latestVersion}
							</span>
						</div>
					)}
					{updateAvailable && (
						<>
							<Separator />
							<div className="flex justify-center">
								<Badge variant="destructive">Update available</Badge>
							</div>
						</>
					)}
				</CardContent>
			</Card>

			{/* Audio Cache */}
			<AudioCacheManager />

			{/* Credits */}
			<div className="text-center space-y-2">
				<p className="text-xs text-muted-foreground font-medium">
					Migrated to Next.js from the original deemix project.
				</p>
				<p className="text-xs text-muted-foreground">
					Original project by{" "}
					<a
						href="https://github.com/bambanah/deemix"
						target="_blank"
						rel="noreferrer"
						className="font-bold text-foreground underline underline-offset-4 hover:text-primary transition-colors"
					>
						bambanah
					</a>
				</p>
			</div>
		</div>
	);
}
