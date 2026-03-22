"use client";

import { useErrorStore } from "@/stores/useErrorStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function ErrorsPage() {
	const { errors, downloadInfo, clearErrors } = useErrorStore();

	return (
		<div className="max-w-3xl mx-auto space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<h1 className="text-brutal-lg">
					Download errors
				</h1>
				{errors.length > 0 && (
					<Button variant="destructive" size="sm" onClick={clearErrors}>
						Clear all
					</Button>
				)}
			</div>

			{downloadInfo && (
				<Card>
					<CardContent>
						<p className="text-sm font-medium text-foreground">
							{downloadInfo.title}
						</p>
						<p className="text-xs text-muted-foreground">
							{downloadInfo.artist} · {downloadInfo.size} tracks
						</p>
					</CardContent>
				</Card>
			)}

			<Separator />

			{errors.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-24 gap-2">
					<p className="text-sm font-bold text-foreground uppercase tracking-wider">
						No errors
					</p>
					<p className="text-xs text-muted-foreground font-medium">
						All downloads completed cleanly.
					</p>
				</div>
			) : (
				<div className="space-y-3">
					{errors.map((error, idx) => (
						<Card key={idx}>
							<CardContent>
								<div className="flex items-start gap-3">
									<span className="mt-0.5 h-2 w-2 bg-destructive flex-shrink-0" />
									<div className="flex-1 min-w-0 space-y-1">
										<p className="text-sm font-medium text-foreground">
											{error.message}
										</p>
										{error.data && (
											<p className="text-xs text-muted-foreground">
												{error.data.artist} · {error.data.title} · ID: {error.data.id}
											</p>
										)}
										{error.errid && (
											<Badge variant="outline" className="mt-1">
												{error.errid}
											</Badge>
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
