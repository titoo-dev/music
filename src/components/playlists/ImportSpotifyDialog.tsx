"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, Check, ChevronDown, ClipboardPaste, Download, Info, ListMusic, Music, Pencil, RotateCcw, Search, Square, X, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AlbumLink, ArtistLink } from "@/components/links/EntityLink";
import { Equalizer, Spinner } from "@/components/motion/icons";
import { M3_SPRING, swap } from "@/components/expressive";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { sizedCover } from "@/lib/cover-palette";
import { MAX_IMPORT_TRACKS, type ImportResult } from "@/lib/spotify/import";
import { commitLinks } from "@/lib/spotify/link-input";
import type { ResolvedTrack } from "@/lib/spotify/import-run";
import type { ReadProgress } from "@/lib/spotify/read-links";
import { detectInput, isRunning, useSpotifyImportStore, type ImportPhase } from "@/stores/useSpotifyImportStore";
import { FilledField, filledButton, textButton, tonalButton } from "./PlaylistDialogs";
import { ImportStage } from "./ImportStage";
import { SpotifyLinksField } from "./SpotifyLinksField";

const fmt = (n: number) => n.toLocaleString("en");
const TOAST_ID = "spotify-import";

/** M3 Expressive medium button (56dp): the dialog's main call to action. */
const bigButton = "h-14 px-7 text-base [&_svg]:size-5";

/**
 * Import from Spotify — an immersive dialog: an aurora stage that fills with
 * the covers of matched tracks, beside the form / live progress / report.
 * Driven by `useSpotifyImportStore`, so closing it mid-import keeps the import
 * running (a toast tracks it). Mounted once in the main layout; open it with
 * `useSpotifyImportStore.getState().openDialog()`.
 */
export function ImportSpotifyDialog() {
	const s = useSpotifyImportStore();
	const running = isRunning(s.phase);
	useBackgroundToasts();

	return (
		<Dialog open={s.open} onOpenChange={(o) => (o ? s.openDialog() : s.closeDialog())}>
			<DialogContent
				showCloseButton={false}
				className={cn(
					// Phones: full screen. md+: a large floating sheet.
					"top-0 left-0 grid h-dvh w-full max-w-none translate-x-0 translate-y-0 grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden rounded-none border-0 bg-surface-container p-0 text-foreground sm:max-w-none",
					"md:top-1/2 md:left-1/2 md:h-[min(720px,calc(100dvh-4rem))] md:w-[min(1040px,calc(100vw-4rem))] md:-translate-x-1/2 md:-translate-y-1/2 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] md:grid-rows-1 md:rounded-m3-xxl md:shadow-[0_40px_120px_-30px_rgb(0_0_0/0.55)]"
				)}
			>
				<ImportStage
					phase={s.phase}
					subject={s.subject}
					reading={s.reading}
					matching={s.matching}
					matched={s.matched}
					missed={s.missed}
					covers={s.covers}
					result={s.result}
					className="m-2 mb-0 h-[clamp(200px,32dvh,300px)] rounded-m3-xl pt-[env(safe-area-inset-top)] md:mb-2 md:h-auto md:rounded-[40px]"
				/>
				<div className="relative flex min-h-0 flex-col">
					<button
						type="button"
						onClick={s.closeDialog}
						aria-label={running ? "Continue in background" : "Close"}
						title={running ? "Continue in background" : "Close"}
						className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full text-muted-foreground transition-[background-color,transform] hover:bg-foreground/[0.08] active:scale-90 md:right-5 md:top-5"
					>
						<X className="size-5" />
					</button>
					<AnimatePresence mode="wait" initial={false}>
						<motion.div key={paneOf(s.phase)} variants={swap} initial="initial" animate="animate" exit="exit" className="flex min-h-0 flex-1 flex-col">
							{s.phase === "idle" && <FormPane />}
							{running && <ProgressPane />}
							{s.phase === "done" && s.result && <ReportPane result={s.result} />}
							{s.phase === "error" && <ErrorPane />}
						</motion.div>
					</AnimatePresence>
				</div>
			</DialogContent>
		</Dialog>
	);
}

const paneOf = (phase: ImportPhase) => (isRunning(phase) ? "run" : phase);

/** Scrolling body + an action row pinned to the bottom. */
function Pane({ title, description, children, actions }: { title: ReactNode; description?: ReactNode; children?: ReactNode; actions: ReactNode }) {
	return (
		<>
			<div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4 pt-6 md:px-10 md:pt-10">
				<DialogTitle className="pr-10 text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] md:text-[2rem]">{title}</DialogTitle>
				{description && <DialogDescription className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{description}</DialogDescription>}
				{children && <div className="mt-6">{children}</div>}
			</div>
			<div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/60 px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:border-0 md:px-10 md:pb-8">{actions}</div>
		</>
	);
}

// ─── Form ───────────────────────────────────────────────────────────────────

function FormPane() {
	const { input, title, error, setInput, setTitle, start, closeDialog } = useSpotifyImportStore();
	const detected = detectInput(input);

	const paste = async () => {
		try {
			const text = (await navigator.clipboard.readText()).trim();
			if (text) setInput(commitLinks(input, text) ?? text);
		} catch {
			// Clipboard access denied — the user can still paste by hand.
		}
	};

	return (
		<Pane
			title="Import from Spotify"
			description="Paste a public playlist link, or the track links of a whole playlist. Matched tracks become a new playlist."
			actions={
				<>
					<button type="button" className={textButton} onClick={closeDialog}>
						Cancel
					</button>
					<motion.button type="button" layout className={cn(filledButton, bigButton)} onClick={() => void start()} disabled={!detected} transition={M3_SPRING.fastSpatial}>
						<Download />
						{detected?.kind === "links" ? `Import ${fmt(Math.min(detected.count, MAX_IMPORT_TRACKS))} tracks` : "Import"}
					</motion.button>
				</>
			}
		>
			<SpotifyLinksField
				autoFocus
				label="Playlist or track links"
				value={input}
				onValueChange={setInput}
				onSubmit={() => void start()}
				error={error}
				suffix={
					<button
						type="button"
						aria-label={input ? "Clear" : "Paste"}
						title={input ? "Clear" : "Paste"}
						onClick={() => (input ? setInput("") : void paste())}
						className="flex size-11 items-center justify-center rounded-full text-muted-foreground transition-[background-color,transform] hover:bg-foreground/[0.08] active:scale-90"
					>
						<AnimatePresence mode="popLayout" initial={false}>
							<motion.span key={input ? "x" : "paste"} initial={{ rotate: -90, scale: 0.5, opacity: 0 }} animate={{ rotate: 0, scale: 1, opacity: 1 }} exit={{ rotate: 90, scale: 0.5, opacity: 0 }} className="flex">
								{input ? <X className="size-5" /> : <ClipboardPaste className="size-5" />}
							</motion.span>
						</AnimatePresence>
					</button>
				}
			/>

			<div className="flex min-h-9 flex-wrap items-center gap-2 px-1 pt-3">
				<AnimatePresence mode="popLayout" initial={false}>
					{detected?.kind === "playlist" && <Chip key="pl" icon={ListMusic} tone="primary">Playlist link</Chip>}
					{detected?.kind === "links" && (
						<Chip key="links" icon={Music} tone="primary">
							{fmt(detected.count)} track{detected.count === 1 ? "" : "s"} detected
						</Chip>
					)}
					{detected?.kind === "links" && detected.count > MAX_IMPORT_TRACKS && (
						<Chip key="cap" icon={Info} tone="tertiary">
							The first {fmt(MAX_IMPORT_TRACKS)} will be imported
						</Chip>
					)}
					{!detected && input.trim() && !error && (
						<Chip key="bad" icon={AlertCircle} tone="error">
							Not a Spotify link
						</Chip>
					)}
				</AnimatePresence>
			</div>

			<AnimatePresence initial={false} mode="wait">
				{detected?.kind === "links" ? (
					<motion.div key="name" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }} className="overflow-hidden">
						<FilledField className="pt-3" label="Playlist name" placeholder="Spotify import" icon={Pencil} value={title} onValueChange={setTitle} maxLength={200} />
					</motion.div>
				) : (
					<motion.div key="tip" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }} className="overflow-hidden">
						<div className="mt-3 rounded-m3-lg-plus bg-surface-high p-5">
							<p className="text-sm font-semibold">Want every track?</p>
							<p className="mt-1 text-[13px] text-muted-foreground">A playlist link only brings its first 100 tracks. For up to {fmt(MAX_IMPORT_TRACKS)}:</p>
							<ol className="mt-4 space-y-3">
								<Step n={1}>Open the playlist in the Spotify desktop app</Step>
								<Step n={2}>
									Select every track with <kbd className="kbd">Ctrl</kbd> <kbd className="kbd">A</kbd> and copy with <kbd className="kbd">Ctrl</kbd> <kbd className="kbd">C</kbd> (<kbd className="kbd">⌘</kbd> on Mac)
								</Step>
								<Step n={3}>Paste here</Step>
							</ol>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</Pane>
	);
}

function Step({ n, children }: { n: number; children: ReactNode }) {
	return (
		<li className="flex items-start gap-3 text-[13px] leading-6">
			<span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-container text-xs font-semibold text-on-primary-container">{n}</span>
			<span>{children}</span>
		</li>
	);
}

const CHIP_TONES = {
	primary: "bg-primary-container text-on-primary-container",
	tertiary: "bg-tertiary-container text-on-tertiary-container",
	error: "bg-error-container text-on-error-container",
} as const;

function Chip({ icon: Icon, tone, children }: { icon: LucideIcon; tone: keyof typeof CHIP_TONES; children: ReactNode }) {
	return (
		<motion.span
			layout
			initial={{ opacity: 0, scale: 0.8 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.8 }}
			transition={M3_SPRING.fastSpatial}
			className={cn("inline-flex h-8 items-center gap-1.5 rounded-m3-sm px-3 text-[13px] font-medium tabular-nums", CHIP_TONES[tone])}
		>
			<Icon className="size-4" />
			{children}
		</motion.span>
	);
}

// ─── Progress ───────────────────────────────────────────────────────────────

function ProgressPane() {
	const { phase, subject, reading, matching, feed, cancel, closeDialog } = useSpotifyImportStore();
	const order: ImportPhase[] = ["reading", "matching", "saving"];
	const at = order.indexOf(phase);
	const state = (i: number) => (i < at ? "done" : i === at ? "active" : "pending");

	return (
		<Pane
			title={subject ? `Importing “${subject.title}”` : "Importing…"}
			description="This can take a couple of minutes for big playlists. You can close this — the import keeps going."
			actions={
				<>
					<button type="button" className={cn(textButton, "text-destructive hover:bg-destructive/10")} onClick={cancel} disabled={phase === "saving"}>
						<Square className="fill-current !size-3.5" />
						Stop
					</button>
					<button type="button" className={cn(tonalButton, bigButton)} onClick={closeDialog}>
						Continue in background
					</button>
				</>
			}
		>
			<ol className="space-y-1">
				<StepRow state={state(0)} title="Read from Spotify" detail={<ReadDetail reading={reading} />} />
				<StepRow state={state(1)} title="Match on Deezer" detail={matching.total ? `${fmt(matching.done)} / ${fmt(matching.total)}` : null} />
				<StepRow state={state(2)} title="Create the playlist" />
			</ol>

			<div className="mt-6">
				<p className="type-eyebrow flex items-center gap-2 text-muted-foreground">
					<Equalizer playing={phase === "matching"} className="h-3 text-[#1db954]" />
					Live
				</p>
				<ul className="mt-2 min-h-[4rem]">
					<AnimatePresence initial={false} mode="popLayout">
						{feed.map((t) => (
							<FeedRow key={t.spotifyId} track={t} />
						))}
					</AnimatePresence>
					{feed.length === 0 && <li className="py-3 text-sm text-muted-foreground">Tracks will show up here as they’re matched.</li>}
				</ul>
			</div>
		</Pane>
	);
}

function ReadDetail({ reading }: { reading: ReadProgress | null }) {
	if (!reading || !reading.total) return null;
	if (reading.resumeAt) {
		return (
			<span className="text-amber-600 dark:text-amber-300">
				Spotify asked us to slow down · <Countdown key={reading.resumeAt} until={reading.resumeAt} />
			</span>
		);
	}
	return `${fmt(reading.done)} / ${fmt(reading.total)}`;
}

function StepRow({ state, title, detail }: { state: "done" | "active" | "pending"; title: string; detail?: ReactNode }) {
	return (
		<li className={cn("flex items-center gap-4 rounded-m3-lg px-3 py-2.5 transition-colors", state === "active" && "bg-surface-high")}>
			<span
				className={cn(
					"flex size-9 shrink-0 items-center justify-center rounded-full transition-colors",
					state === "done" && "bg-primary text-primary-foreground",
					state === "active" && "bg-primary-container text-on-primary-container",
					state === "pending" && "border border-outline-variant text-muted-foreground"
				)}
			>
				<AnimatePresence mode="popLayout" initial={false}>
					<motion.span key={state} initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }} transition={M3_SPRING.fastSpatial} className="flex">
						{state === "done" ? <Check className="size-[18px]" strokeWidth={2.6} /> : state === "active" ? <Spinner size={16} /> : <span className="size-1.5 rounded-full bg-current" />}
					</motion.span>
				</AnimatePresence>
			</span>
			<span className={cn("flex-1 text-[15px] font-medium", state === "pending" && "text-muted-foreground")}>{title}</span>
			{detail && <span className="text-[13px] tabular-nums text-muted-foreground">{detail}</span>}
		</li>
	);
}

function FeedRow({ track }: { track: ResolvedTrack }) {
	return (
		<motion.li
			layout
			initial={{ opacity: 0, y: -14, scale: 0.96 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			exit={{ opacity: 0, scale: 0.96 }}
			transition={M3_SPRING.defaultSpatial}
			className="flex items-center gap-3 py-1.5"
		>
			{track.coverUrl ? (
				// eslint-disable-next-line @next/next/no-img-element
				<img src={sizedCover(track.coverUrl, 120)} alt="" className="size-10 shrink-0 rounded-m3-sm object-cover" />
			) : (
				<span className="flex size-10 shrink-0 items-center justify-center rounded-m3-sm bg-surface-highest text-muted-foreground">
					<Music className="size-4" />
				</span>
			)}
			<span className="min-w-0 flex-1">
				<span className={cn("block truncate text-sm font-medium", !track.matched && "text-muted-foreground")}>{track.title}</span>
				<span className="block truncate text-xs text-muted-foreground">{track.artist}</span>
			</span>
			{track.matched ? (
				<span className="flex size-6 items-center justify-center rounded-full bg-[#1db954]/15 text-[#13843c] dark:text-[#1ed760]" title="Matched">
					<Check className="size-3.5" strokeWidth={3} />
				</span>
			) : (
				<span className="flex size-6 items-center justify-center rounded-full bg-surface-highest text-muted-foreground" title="Not found">
					<X className="size-3.5" strokeWidth={3} />
				</span>
			)}
		</motion.li>
	);
}

function Countdown({ until }: { until: number }) {
	const [now, setNow] = useState(() => Date.now());
	useEffect(() => {
		const id = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(id);
	}, []);
	return <span className="tabular-nums">{Math.max(0, Math.ceil((until - now) / 1000))}s</span>;
}

// ─── Report ─────────────────────────────────────────────────────────────────

function ReportPane({ result }: { result: ImportResult }) {
	const { reset, closeDialog } = useSpotifyImportStore();
	const [showAll, setShowAll] = useState(false);
	const { playlist, report } = result;
	const misses = showAll ? report.notFound : report.notFound.slice(0, 6);
	const skipped = Math.max(0, report.totalSpotify - report.processed);

	return (
		<Pane
			title={playlist ? "Your playlist is ready" : "No tracks matched"}
			description={
				playlist ? (
					<>
						Matched <strong className="font-semibold text-foreground tabular-nums">{fmt(report.matched)}</strong> of <strong className="font-semibold text-foreground tabular-nums">{fmt(report.processed)}</strong> tracks on Deezer.
					</>
				) : (
					<>None of the {fmt(report.processed)} tracks were found on Deezer, so nothing was imported.</>
				)
			}
			actions={
				<>
					<button type="button" className={textButton} onClick={reset}>
						<RotateCcw />
						Import another
					</button>
					{playlist ? (
						<Link href={`/my-playlists/${playlist.id}`} onClick={closeDialog} className={cn(filledButton, bigButton)}>
							<ListMusic />
							Open playlist
						</Link>
					) : (
						<button type="button" className={cn(filledButton, bigButton)} onClick={closeDialog}>
							Close
						</button>
					)}
				</>
			}
		>
			<div className="grid grid-cols-3 gap-2">
				<Stat value={report.matched} label="Matched" className="bg-primary-container text-on-primary-container" />
				<Stat value={report.notFound.length} label="Not found" className="bg-tertiary-container text-on-tertiary-container" />
				<Stat value={skipped} label={report.limited ? "Not shared" : "Skipped"} className="bg-surface-highest" />
			</div>

			{(report.limited || report.truncated) && (
				<p className="mt-3 flex gap-3 rounded-m3-lg bg-surface-high p-4 text-[13px] text-muted-foreground">
					<Info className="mt-0.5 size-4 shrink-0 text-foreground" />
					{report.truncated
						? `Only the first ${fmt(report.processed)} of ${fmt(report.totalSpotify)} tracks were imported.`
						: `Spotify only shares the first ${fmt(report.processed)} tracks of a playlist link. To get them all, paste the track links instead (Ctrl+A, Ctrl+C in the Spotify desktop app).`}
				</p>
			)}

			{report.notFound.length > 0 && (
				<div className="mt-6">
					<p className="type-eyebrow text-muted-foreground">Not found · {fmt(report.notFound.length)}</p>
					<ul className="-mx-2 mt-2">
						{misses.map((m, i) => (
							<motion.li
								key={m.spotifyId}
								initial={{ opacity: 0, y: 8 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.3 }}
								className="flex items-center gap-3 rounded-m3-lg px-2 py-1.5 transition-colors hover:bg-surface-high"
							>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-medium">{m.title}</p>
									<p className="truncate text-xs text-muted-foreground">
										<ArtistLink name={m.artist} onClick={closeDialog} className="transition-colors hover:text-foreground" />
										{m.album && (
											<>
												{" — "}
												<AlbumLink title={m.album} artist={m.artist} onClick={closeDialog} className="transition-colors hover:text-foreground" />
											</>
										)}
									</p>
								</div>
								<Link
									href={`/search?term=${encodeURIComponent(`${m.title} ${m.artist}`)}`}
									onClick={closeDialog}
									aria-label={`Search ${m.title}`}
									title="Search"
									className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-[background-color,transform] hover:bg-secondary/80 active:scale-90"
								>
									<Search className="size-4" />
								</Link>
							</motion.li>
						))}
					</ul>
					{report.notFound.length > misses.length && (
						<button type="button" className={cn(textButton, "mt-1 -ml-2")} onClick={() => setShowAll(true)}>
							<ChevronDown />
							Show {fmt(report.notFound.length - misses.length)} more
						</button>
					)}
				</div>
			)}
		</Pane>
	);
}

function Stat({ value, label, className }: { value: number; label: string; className?: string }) {
	return (
		<div className={cn("rounded-m3-lg-plus px-4 py-3.5", className)}>
			<p className="type-display text-[1.75rem] tabular-nums">{fmt(value)}</p>
			<p className="mt-0.5 text-xs font-medium opacity-80">{label}</p>
		</div>
	);
}

// ─── Error ──────────────────────────────────────────────────────────────────

function ErrorPane() {
	const { error, retry, closeDialog } = useSpotifyImportStore();
	return (
		<Pane
			title="Import failed"
			actions={
				<>
					<button type="button" className={textButton} onClick={closeDialog}>
						Close
					</button>
					<button type="button" className={cn(filledButton, bigButton)} onClick={retry}>
						<RotateCcw />
						Try again
					</button>
				</>
			}
		>
			<p role="alert" className="flex gap-3 rounded-m3-lg-plus bg-error-container p-5 text-[15px] text-on-error-container">
				<AlertCircle className="mt-0.5 size-5 shrink-0" />
				{error}
			</p>
		</Pane>
	);
}

// ─── Background ─────────────────────────────────────────────────────────────

/** While the dialog is closed: a live toast for a running import, then its outcome. */
function useBackgroundToasts() {
	useEffect(
		() =>
			useSpotifyImportStore.subscribe((s, prev) => {
				const show = { label: "Show", onClick: () => useSpotifyImportStore.getState().openDialog() };
				if (s.open) {
					if (!prev.open) toast.dismiss(TOAST_ID);
					return;
				}
				if (isRunning(s.phase)) {
					const done = s.phase === "matching" ? `${fmt(s.matching.done)} / ${fmt(s.matching.total)} matched` : s.phase === "saving" ? "Saving…" : "Reading from Spotify…";
					toast.loading(s.subject ? `Importing “${s.subject.title}”` : "Importing from Spotify", { id: TOAST_ID, description: done, action: show, duration: Infinity });
				} else if (s.phase === "done" && prev.phase !== "done" && s.result) {
					const { playlist, report } = s.result;
					if (playlist) {
						toast.success(`Imported ${fmt(report.matched)} of ${fmt(report.processed)} tracks`, {
							id: TOAST_ID,
							description: report.notFound.length ? `${fmt(report.notFound.length)} not found on Deezer.` : undefined,
							action: show,
							duration: 8000,
						});
					} else {
						toast.error("No tracks could be matched on Deezer", { id: TOAST_ID, description: "Nothing was imported.", duration: 8000 });
					}
				} else if (s.phase === "error" && prev.phase !== "error") {
					toast.error("Spotify import failed", { id: TOAST_ID, description: s.error ?? undefined, action: show, duration: 8000 });
				} else if (s.phase === "idle" && isRunning(prev.phase)) {
					toast.dismiss(TOAST_ID);
				}
			}),
		[]
	);
}
