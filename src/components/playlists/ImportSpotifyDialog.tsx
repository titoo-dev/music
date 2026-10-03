"use client";

import { useEffect, useState, type ReactElement } from "react";
import Link from "next/link";
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "motion/react";
import { ChevronDown, ClipboardPaste, Download, Link2, ListMusic, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Equalizer, Spinner } from "@/components/motion/icons";
import { postToServer } from "@/utils/api";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { DialogBadge, FilledField, M3DialogBody, filledButton, textButton } from "./PlaylistDialogs";

interface ImportReport {
	totalSpotify: number;
	processed: number;
	matched: number;
	truncated: boolean;
	// Spotify only exposed the first 100 tracks (public embed, no API access).
	limited?: boolean;
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
	SPOTIFY_NOT_FOUND: "Playlist not found. Make sure the link is public and not region-locked.",
	SPOTIFY_FORBIDDEN: "Spotify refused to share this playlist. Make sure it's public.",
	SPOTIFY_ERROR: "Couldn't read this playlist from Spotify. Please try again.",
	SPOTIFY_RATE_LIMITED: "Spotify is rate-limiting requests. Please try again in a moment.",
	INVALID_URL: "That doesn't look like a Spotify playlist link.",
	MISSING_URL: "Paste a Spotify playlist URL first.",
	EMPTY_PLAYLIST: "This playlist has no importable tracks.",
};

const morph = {
	initial: { opacity: 0, scale: 0.94 },
	animate: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: [0.05, 0.7, 0.1, 1] } },
	exit: { opacity: 0, scale: 0.97, transition: { duration: 0.15, ease: [0.3, 0, 0.8, 0.15] } },
} as const;

/**
 * Import a public Spotify playlist: a URL form that morphs into a summary
 * (match ring + the tracks Deezer didn't have). Use it with a `trigger`, or
 * controlled with `open` / `onOpenChange`.
 */
export function ImportSpotifyDialog({
	trigger,
	onImported,
	open: openProp,
	onOpenChange,
}: {
	trigger?: ReactElement;
	onImported?: () => void;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}) {
	const [openState, setOpenState] = useState(false);
	const open = openProp ?? openState;
	const [url, setUrl] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [result, setResult] = useState<ImportResponse | null>(null);
	const [showAllMisses, setShowAllMisses] = useState(false);

	const reset = () => {
		setUrl("");
		setLoading(false);
		setError(null);
		setResult(null);
		setShowAllMisses(false);
	};

	const handleOpenChange = (next: boolean) => {
		if (loading) return; // don't let users close mid-import
		setOpenState(next);
		onOpenChange?.(next);
		if (!next) {
			// reset after the close animation so the result doesn't flash away
			setTimeout(reset, 200);
		}
	};

	const handleImport = async () => {
		if (!url.trim() || loading) return;
		setLoading(true);
		setError(null);
		try {
			const data: ImportResponse = await postToServer("playlists/import/spotify", { url: url.trim() });
			setResult(data);
			if (data.playlist) {
				onImported?.();
				toast.success(`Imported ${data.report.matched} of ${data.report.processed} tracks`, {
					description: data.report.notFound.length ? `${data.report.notFound.length} not found on Deezer.` : undefined,
				});
			} else {
				toast.error("No tracks could be matched on Deezer", { description: "Nothing was imported." });
			}
		} catch (e) {
			const err = e as Error & { code?: string };
			setError((err.code && FRIENDLY_ERRORS[err.code]) || err.message || "Import failed");
		} finally {
			setLoading(false);
		}
	};

	const paste = async () => {
		try {
			const text = (await navigator.clipboard.readText()).trim();
			if (text) {
				setUrl(text);
				setError(null);
			}
		} catch {
			// Clipboard access denied — the user can still paste by hand.
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			{trigger && <DialogTrigger render={trigger} />}
			<DialogContent showCloseButton={false} className="gap-0 overflow-hidden rounded-[28px] border-0 bg-surface-high p-0 sm:max-w-[460px]">
				<AnimatePresence mode="wait" initial={false}>
					{!result ? (
						<motion.div key="form" {...morph} className="p-6">
							<M3DialogBody
								badge={<DialogBadge icon={Download} tone="spotify" />}
								title="Import from Spotify"
								description="Paste a public Spotify playlist link. Tracks are matched on Deezer (up to 500)."
								actions={
									<>
										<button type="button" className={textButton} disabled={loading} onClick={() => handleOpenChange(false)}>
											Cancel
										</button>
										<button type="button" className={filledButton} onClick={handleImport} disabled={loading || !url.trim()}>
											{loading ? (
												<>
													<Spinner size={16} />
													Matching tracks…
												</>
											) : (
												<>
													<Download />
													Import
												</>
											)}
										</button>
									</>
								}
							>
								<FilledField
									autoFocus
									type="url"
									inputMode="url"
									label="Playlist URL"
									placeholder="https://open.spotify.com/playlist/…"
									icon={Link2}
									value={url}
									onValueChange={(v) => {
										setUrl(v);
										if (error) setError(null);
									}}
									error={error}
									disabled={loading}
									onKeyDown={(e) => {
										if (e.key === "Enter") void handleImport();
									}}
									suffix={
										<button
											type="button"
											disabled={loading}
											aria-label={url ? "Clear" : "Paste"}
											title={url ? "Clear" : "Paste"}
											onClick={() => (url ? setUrl("") : void paste())}
											className="flex size-11 items-center justify-center rounded-full text-muted-foreground transition-[background-color,transform] hover:bg-foreground/[0.08] active:scale-90 disabled:opacity-50"
										>
											<AnimatePresence mode="popLayout" initial={false}>
												<motion.span key={url ? "x" : "paste"} initial={{ rotate: -90, scale: 0.5, opacity: 0 }} animate={{ rotate: 0, scale: 1, opacity: 1 }} exit={{ rotate: 90, scale: 0.5, opacity: 0 }} className="flex">
													{url ? <X className="size-5" /> : <ClipboardPaste className="size-5" />}
												</motion.span>
											</AnimatePresence>
										</button>
									}
								/>
								<AnimatePresence initial={false}>
									{loading && (
										<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }} className="overflow-hidden">
											<div className="pt-4">
												<div className="relative h-1.5 overflow-hidden rounded-full bg-primary/15">
													<motion.span
														className="absolute inset-y-0 w-2/5 rounded-full bg-primary"
														initial={{ left: "-40%" }}
														animate={{ left: "100%" }}
														transition={{ repeat: Infinity, duration: 1.3, ease: [0.4, 0, 0.2, 1] }}
													/>
												</div>
												<p className="mt-2.5 flex items-center gap-2.5 text-xs text-muted-foreground">
													<Equalizer playing className="h-4 text-primary" />
													Matching tracks… this can take a while.
												</p>
											</div>
										</motion.div>
									)}
								</AnimatePresence>
							</M3DialogBody>
						</motion.div>
					) : (
						<motion.div key="summary" {...morph} className="p-6">
							<ImportReportView result={result} showAllMisses={showAllMisses} setShowAllMisses={setShowAllMisses} onClose={() => handleOpenChange(false)} />
						</motion.div>
					)}
				</AnimatePresence>
			</DialogContent>
		</Dialog>
	);
}

/** Ring filling up to matched / processed while the number counts up. */
function MatchRing({ matched, total, failed }: { matched: number; total: number; failed: boolean }) {
	const ratio = total > 0 ? matched / total : 0;
	const progress = useMotionValue(0);
	const shown = useTransform(progress, (v) => Math.round(v * total));
	const [n, setN] = useState(0);
	useEffect(() => shown.on("change", setN), [shown]);
	useEffect(() => {
		const a = animate(progress, ratio, { duration: 0.9, ease: [0.05, 0.7, 0.1, 1] });
		return () => a.stop();
	}, [progress, ratio]);
	const r = 56;
	const c = 2 * Math.PI * r;
	const dash = useTransform(progress, (v) => `${v * c} ${c}`);
	return (
		<div className="relative mx-auto size-[132px]">
			<svg viewBox="0 0 132 132" className="size-full -rotate-90">
				<circle cx="66" cy="66" r={r} fill="none" strokeWidth="10" className="stroke-surface-highest" />
				<motion.circle cx="66" cy="66" r={r} fill="none" strokeWidth="10" strokeLinecap="round" className={failed ? "stroke-destructive" : "stroke-primary"} style={{ strokeDasharray: dash }} />
			</svg>
			<div className="absolute inset-0 flex flex-col items-center justify-center">
				<span className="text-3xl font-semibold tabular-nums tracking-tight">{n}</span>
				<span className="text-xs font-medium text-muted-foreground">of {total}</span>
			</div>
		</div>
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
	const missesShown = showAllMisses ? report.notFound : report.notFound.slice(0, 5);

	return (
		<M3DialogBody
			title={<span className="block text-center">{playlist ? "Import complete" : "No matches"}</span>}
			actions={
				<>
					<button type="button" className={textButton} onClick={onClose}>
						Close
					</button>
					{playlist && (
						<Link href={`/my-playlists/${playlist.id}`} onClick={onClose} className={filledButton}>
							<ListMusic />
							Open playlist
						</Link>
					)}
				</>
			}
		>
			<MatchRing matched={report.matched} total={report.processed} failed={!playlist} />
			<p className="mt-3 text-center text-base">
				{playlist ? (
					<>
						Matched <strong className="font-semibold tabular-nums">{report.matched}</strong> of <strong className="font-semibold tabular-nums">{report.processed}</strong> tracks.
					</>
				) : (
					<>None of the {report.processed} tracks were found on Deezer.</>
				)}
			</p>
			{report.limited && !report.truncated && (
				<p className="mt-1 text-center text-xs text-muted-foreground">
					Spotify only shares the first {report.processed} tracks of a playlist without API access.
				</p>
			)}
			{report.truncated && (
				<p className="mt-1 text-center text-xs text-muted-foreground">
					Only the first {report.processed} of {report.totalSpotify} tracks were imported.
				</p>
			)}

			{report.notFound.length > 0 && (
				<div className="mt-5">
					<p className="type-eyebrow text-primary">Not found · {report.notFound.length}</p>
					<ul className="-mx-2 mt-1.5 max-h-64 overflow-y-auto">
						{missesShown.map((m, i) => (
							<motion.li
								key={m.spotifyId}
								initial={{ opacity: 0, y: 8 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: Math.min(i, 8) * 0.05, duration: 0.3 }}
								className="flex items-center gap-3 rounded-2xl px-2 py-1.5 transition-colors hover:bg-surface-highest/60"
							>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-medium">{m.title}</p>
									<p className="truncate text-xs text-muted-foreground">
										{m.artist}
										{m.album ? ` — ${m.album}` : ""}
									</p>
								</div>
								<Link
									href={`/search?term=${encodeURIComponent(`${m.title} ${m.artist}`)}`}
									onClick={onClose}
									aria-label={`Search ${m.title}`}
									title="Search"
									className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-[background-color,transform] hover:bg-secondary/80 active:scale-90"
								>
									<Search className="size-4" />
								</Link>
							</motion.li>
						))}
					</ul>
					{report.notFound.length > missesShown.length && (
						<button type="button" className={`${textButton} mt-1 -ml-2`} onClick={() => setShowAllMisses(true)}>
							<ChevronDown />
							Show {report.notFound.length - missesShown.length} more
						</button>
					)}
				</div>
			)}
		</M3DialogBody>
	);
}
