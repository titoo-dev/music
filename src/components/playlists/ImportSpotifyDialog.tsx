"use client";

import { useState, type ReactElement } from "react";
import Link from "next/link";
import { Loader2, Download, ExternalLink, AlertTriangle, Check } from "lucide-react";
import { toast } from "sonner";
import { postToServer } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
	DialogClose,
} from "@/components/ui/dialog";

interface ImportReport {
	totalSpotify: number;
	processed: number;
	matched: number;
	truncated: boolean;
	notFound: Array<{
		spotifyId: string;
		title: string;
		artist: string;
		album: string;
		reason: string;
	}>;
}

interface ImportResponse {
	playlist: { id: string; title: string } | null;
	report: ImportReport;
}

const FRIENDLY_ERRORS: Record<string, string> = {
	NOT_AUTHENTICATED: "Please sign in to import.",
	NO_DEEZER_ARL: "Connect your Deezer account in Settings before importing.",
	DEEZER_LOGIN_FAILED: "Your Deezer ARL is invalid. Update it in Settings.",
	SPOTIFY_NOT_CONFIGURED:
		"Spotify import isn't configured on this server (missing API credentials).",
	SPOTIFY_NOT_FOUND:
		"Playlist not found. Make sure the link is public and not region-locked.",
	SPOTIFY_FORBIDDEN:
		"Spotify denied the request. The developer account that owns the Spotify app must have an active Premium subscription. If you just changed it, allow a few hours.",
	SPOTIFY_RATE_LIMITED:
		"Spotify is rate-limiting requests. Please try again in a moment.",
	INVALID_URL: "That doesn't look like a Spotify playlist link.",
	MISSING_URL: "Paste a Spotify playlist URL first.",
	EMPTY_PLAYLIST: "This playlist has no importable tracks.",
};

export function ImportSpotifyDialog({
	trigger,
	onImported,
}: {
	trigger: ReactElement;
	onImported?: () => void;
}) {
	const [open, setOpen] = useState(false);
	const [url, setUrl] = useState("");
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState<ImportResponse | null>(null);
	const [showAllMisses, setShowAllMisses] = useState(false);

	const reset = () => {
		setUrl("");
		setLoading(false);
		setResult(null);
		setShowAllMisses(false);
	};

	const handleOpenChange = (next: boolean) => {
		if (loading) return; // don't let users close mid-import
		setOpen(next);
		if (!next) {
			// reset after the close animation so the result doesn't flash away
			setTimeout(reset, 200);
		}
	};

	const handleImport = async () => {
		if (!url.trim() || loading) return;
		setLoading(true);
		try {
			const data: ImportResponse = await postToServer(
				"playlists/import/spotify",
				{ url: url.trim() }
			);
			setResult(data);
			if (data.playlist) {
				onImported?.();
				toast.success(
					`Imported ${data.report.matched} of ${data.report.processed} tracks`,
					{
						description: data.report.notFound.length
							? `${data.report.notFound.length} not found on Deezer.`
							: undefined,
					}
				);
			} else {
				toast.error("No tracks could be matched on Deezer", {
					description: "Nothing was imported.",
				});
			}
		} catch (e) {
			const err = e as Error & { code?: string };
			const friendly = (err.code && FRIENDLY_ERRORS[err.code]) || err.message;
			toast.error("Import failed", { description: friendly });
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger render={trigger} />
			<DialogContent className="max-w-lg">
				{!result ? (
					<>
						<DialogHeader>
							<DialogTitle>Import from Spotify</DialogTitle>
							<DialogDescription>
								Paste a public Spotify playlist link. We&rsquo;ll match each
								track against Deezer.
							</DialogDescription>
						</DialogHeader>
						<Input
							autoFocus
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							placeholder="https://open.spotify.com/playlist/…"
							disabled={loading}
							onKeyDown={(e) => {
								if (e.key === "Enter") handleImport();
							}}
						/>
						<DialogFooter>
							<DialogClose
								render={
									<Button variant="outline" disabled={loading}>
										Cancel
									</Button>
								}
							/>
							<Button
								onClick={handleImport}
								disabled={loading || !url.trim()}
								className="gap-1.5"
							>
								{loading ? (
									<>
										<Loader2 className="size-4 animate-spin" />
										Matching tracks…
									</>
								) : (
									<>
										<Download className="size-4" />
										Import
									</>
								)}
							</Button>
						</DialogFooter>
					</>
				) : (
					<ImportReportView
						result={result}
						showAllMisses={showAllMisses}
						setShowAllMisses={setShowAllMisses}
						onClose={() => handleOpenChange(false)}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}

function ImportReportView({
	result,
	showAllMisses,
	setShowAllMisses,
	onClose,
}: {
	result: ImportResponse;
	showAllMisses: boolean;
	setShowAllMisses: (v: boolean) => void;
	onClose: () => void;
}) {
	const { playlist, report } = result;
	const missesShown = showAllMisses
		? report.notFound
		: report.notFound.slice(0, 5);

	return (
		<>
			<DialogHeader>
				<DialogTitle className="flex items-center gap-2">
					{playlist ? (
						<>
							<Check className="size-5" />
							Import complete
						</>
					) : (
						<>
							<AlertTriangle className="size-5" />
							No matches
						</>
					)}
				</DialogTitle>
				<DialogDescription>
					{playlist ? (
						<>
							Matched <strong>{report.matched}</strong> of{" "}
							<strong>{report.processed}</strong> tracks from Spotify
							{report.truncated && (
								<>
									{" "}
									(playlist had {report.totalSpotify} — capped to{" "}
									{report.processed})
								</>
							)}
							.
						</>
					) : (
						<>None of the {report.processed} tracks were found on Deezer.</>
					)}
				</DialogDescription>
			</DialogHeader>

			{report.notFound.length > 0 && (
				<div className="space-y-2">
					<p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
						{report.notFound.length} not found
					</p>
					<ul className="border-2 border-foreground divide-y-2 divide-foreground bg-card max-h-64 overflow-y-auto">
						{missesShown.map((m) => (
							<li
								key={m.spotifyId}
								className="px-3 py-2 flex items-start justify-between gap-2"
							>
								<div className="min-w-0">
									<p className="text-sm font-bold truncate">{m.title}</p>
									<p className="text-xs text-muted-foreground truncate">
										{m.artist}
										{m.album ? ` — ${m.album}` : ""}
									</p>
								</div>
								<Link
									href={`/search?term=${encodeURIComponent(`${m.title} ${m.artist}`)}`}
									className="shrink-0 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1 hover:underline"
									onClick={onClose}
								>
									Search
									<ExternalLink className="size-3" />
								</Link>
							</li>
						))}
					</ul>
					{report.notFound.length > missesShown.length && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setShowAllMisses(true)}
						>
							Show {report.notFound.length - missesShown.length} more
						</Button>
					)}
				</div>
			)}

			<DialogFooter>
				<Button variant="outline" onClick={onClose}>
					Close
				</Button>
				{playlist && (
					<Link href={`/my-playlists/${playlist.id}`} onClick={onClose}>
						<Button>Open playlist</Button>
					</Link>
				)}
			</DialogFooter>
		</>
	);
}
