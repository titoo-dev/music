"use client";

import { useState } from "react";
import { fetchData } from "@/utils/api";
import { useDownload } from "@/hooks/useDownload";
import { convertDuration } from "@/utils/helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, Loader2, Link2, AlertCircle } from "lucide-react";
import { CoverImage } from "@/components/ui/cover-image";

export default function LinkAnalyzerPage() {
	const [link, setLink] = useState("");
	const [result, setResult] = useState<any>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const { download, isLoading: isDownloading } = useDownload();

	const handleAnalyze = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!link.trim()) return;
		setLoading(true);
		setError("");
		setResult(null);
		try {
			const data = await fetchData("content/analyze-link", {
				term: link.trim(),
			});
			if (data.error) {
				setError(data.error);
			} else {
				setResult(data);
			}
		} catch {
			setError("Failed to analyze link");
		}
		setLoading(false);
	};

	const handleDownload = () => {
		if (link.trim()) {
			download(link.trim());
		}
	};

	return (
		<div className="max-w-2xl mx-auto space-y-6">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">
					Link Analyzer
				</h1>
				<p className="text-sm text-muted-foreground mt-1">
					Paste a Deezer or Spotify link to analyze and download.
				</p>
			</div>

			<form onSubmit={handleAnalyze} className="flex gap-2">
				<div className="relative flex-1">
					<Link2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
					<Input
						type="text"
						value={link}
						onChange={(e) => setLink(e.target.value)}
						placeholder="Paste a link here..."
						className="pl-9"
					/>
				</div>
				<Button type="submit" disabled={loading}>
					{loading ? (
						<Loader2 className="size-4 animate-spin" />
					) : (
						"Analyze"
					)}
				</Button>
			</form>

			{error && (
				<div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3">
					<AlertCircle className="size-4 text-destructive shrink-0" />
					<p className="text-sm text-destructive">{error}</p>
				</div>
			)}

			{result && (
				<Card>
					<CardContent className="pt-6">
						<div className="flex gap-4">
							<CoverImage
								src={result.cover_xl || result.cover_big || result.picture_xl}
								className="w-28 h-28 rounded-xl shrink-0"
							/>
							<div className="flex-1 min-w-0 space-y-2">
								<h2 className="text-lg font-semibold truncate">
									{result.title}
								</h2>
								{result.artist?.name && (
									<p className="text-sm text-muted-foreground">
										{result.artist.name}
									</p>
								)}
								<div className="flex gap-2 flex-wrap">
									{result.duration && (
										<Badge variant="secondary">
											{convertDuration(result.duration)}
										</Badge>
									)}
									{result.nb_tracks && (
										<Badge variant="secondary">
											{result.nb_tracks} tracks
										</Badge>
									)}
								</div>
								<Button
									size="sm"
									onClick={handleDownload}
									disabled={isDownloading(link.trim())}
									className="gap-1.5 mt-1"
								>
									{isDownloading(link.trim()) ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
									{isDownloading(link.trim()) ? "Adding..." : "Download"}
								</Button>
							</div>
						</div>

						{result.tracks?.data && (
							<>
								<Separator className="my-4" />
								<div className="space-y-1">
									<h3 className="text-sm font-medium text-muted-foreground mb-3">
										Tracklist
									</h3>
									<div className="rounded-lg border border-border overflow-hidden">
										{result.tracks.data.map(
											(track: any, idx: number) => (
												<div key={track.id || idx}>
													<div className="flex items-center gap-3 py-2 px-3 hover:bg-muted/50 transition-colors">
														<span className="text-xs text-muted-foreground w-6 text-right tabular-nums">
															{idx + 1}
														</span>
														<span className="text-sm flex-1 truncate">
															{track.title}
														</span>
														<span className="text-xs text-muted-foreground tabular-nums">
															{convertDuration(
																track.duration
															)}
														</span>
													</div>
													{idx <
														result.tracks.data.length -
															1 && <Separator />}
												</div>
											)
										)}
									</div>
								</div>
							</>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	);
}
