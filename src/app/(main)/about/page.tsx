"use client";

import { useAppStore } from "@/stores/useAppStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function AboutPage() {
	const { currentVersion, latestVersion, updateAvailable } = useAppStore();

	return (
		<div className="max-w-md mx-auto py-16 space-y-8">
			{/* Title */}
			<div className="text-center space-y-2">
				<h1 className="text-4xl font-semibold tracking-tight text-foreground">
					deemix
				</h1>
				<p className="text-sm text-muted-foreground">Next.js edition</p>
			</div>

			{/* Version Info */}
			<Card>
				<CardHeader>
					<CardTitle>Version</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{currentVersion && (
						<div className="flex items-center justify-between">
							<span className="text-sm text-muted-foreground">Current</span>
							<span className="text-sm font-medium tabular-nums">
								{currentVersion}
							</span>
						</div>
					)}
					{latestVersion && (
						<div className="flex items-center justify-between">
							<span className="text-sm text-muted-foreground">Latest</span>
							<span className="text-sm font-medium tabular-nums">
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

			{/* Credits */}
			<div className="text-center space-y-2">
				<p className="text-xs text-muted-foreground">
					Migrated to Next.js from the original deemix project.
				</p>
				<p className="text-xs text-muted-foreground">
					Original project by{" "}
					<a
						href="https://github.com/bambanah/deemix"
						target="_blank"
						rel="noreferrer"
						className="font-medium text-foreground underline underline-offset-4 hover:text-muted-foreground transition-colors"
					>
						bambanah
					</a>
				</p>
			</div>
		</div>
	);
}
