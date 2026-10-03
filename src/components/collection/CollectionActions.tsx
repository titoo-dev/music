"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { ListPlus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DownloadGlyph, DrawCheck, Spinner } from "@/components/motion/icons";
import { TonalIconButton } from "@/components/expressive";
import type { TrackRowTrack } from "@/components/tracks/TrackRow";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCommandStore } from "@/stores/useCommandStore";
import { useDownloadStore } from "@/stores/useDownloadStore";
import { usePlayerStore, type PlayerTrack } from "@/stores/usePlayerStore";

/** Same look as `TonalIconButton`, as a plain element a menu trigger can render. */
const tonalIcon =
	"flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground outline-none transition-[background-color,transform] duration-200 hover:bg-secondary/75 focus-visible:ring-4 focus-visible:ring-ring/40 active:scale-[0.88] disabled:pointer-events-none disabled:opacity-50 data-[popup-open]:bg-primary-container data-[popup-open]:text-on-primary-container [&_svg]:size-5";

export function toPlayerTrack(t: TrackRowTrack): PlayerTrack {
	return { trackId: t.trackId, title: t.title, artist: t.artist, artistId: t.artistId ?? null, album: t.album ?? null, albumId: t.albumId ?? null, cover: t.cover, duration: t.duration ?? null };
}

/** Play / shuffle a whole collection (album, artist top tracks, playlist). */
export function useCollectionPlayback(tracks: TrackRowTrack[]) {
	const playQueue = usePlayerStore((s) => s.playQueue);
	const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);

	const play = useCallback(() => {
		if (!tracks.length) return;
		playQueue(tracks.map(toPlayerTrack), 0);
	}, [tracks, playQueue]);

	const shuffle = useCallback(() => {
		if (!tracks.length) return;
		if (!usePlayerStore.getState().shuffle) toggleShuffle();
		playQueue(tracks.map(toPlayerTrack), Math.floor(Math.random() * tracks.length));
	}, [tracks, playQueue, toggleShuffle]);

	return { play, shuffle, trackIds: tracks.map((t) => t.trackId) };
}

/** Tonal download button: queues every track of the collection. */
export function DownloadCollectionButton({ tracks, group, label = "Download" }: { tracks: TrackRowTrack[]; group: string; label?: string }) {
	const enqueue = useDownloadStore((s) => s.enqueue);
	const openPalette = useCommandStore((s) => s.open);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const [done, setDone] = useState(false);

	const onClick = () => {
		if (!isAuthenticated) {
			toast("Sign in to download");
			return;
		}
		const n = enqueue(tracks, group);
		setDone(true);
		toast.success(n ? `Downloading ${n} tracks` : "Already in your downloads", {
			action: { label: "View", onClick: () => openPalette(undefined, "downloads") },
		});
	};

	return (
		<TonalIconButton label={label} onClick={onClick} disabled={!tracks.length}>
			<DownloadGlyph active={done} />
		</TonalIconButton>
	);
}

interface Playlist {
	id: string;
	title: string;
	_count?: { tracks: number };
}

/**
 * "Add to playlist" for a whole collection: a tonal button opening a menu of
 * the user's playlists (plus "New playlist"). Adds every track in one call.
 */
export function AddTracksToPlaylist({ tracks, label = "Add to playlist" }: { tracks: TrackRowTrack[]; label?: string }) {
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const [playlists, setPlaylists] = useState<Playlist[]>([]);
	const [loading, setLoading] = useState(false);
	const [addedTo, setAddedTo] = useState<Set<string>>(new Set());
	const [busy, setBusy] = useState<string | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [newName, setNewName] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const fetchPlaylists = useCallback(async () => {
		setLoading(true);
		try {
			const res = await fetch("/api/v1/playlists", { credentials: "include" });
			const json = await res.json();
			if (json.success) setPlaylists(json.data as Playlist[]);
		} catch {
			// ignore — the menu shows "No playlists yet"
		}
		setLoading(false);
	}, []);

	const add = async (playlist: Playlist) => {
		setBusy(playlist.id);
		try {
			const res = await fetch(`/api/v1/playlists/${playlist.id}/tracks`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({
					tracks: tracks.map((t) => ({
						trackId: t.trackId,
						title: t.title,
						artist: t.artist,
						album: t.album ?? null,
						albumId: t.albumId ?? null,
						coverUrl: t.cover ?? null,
						duration: t.duration ?? null,
					})),
				}),
			});
			if (!res.ok) throw new Error(String(res.status));
			setAddedTo((prev) => new Set(prev).add(playlist.id));
			toast.success(`Added to “${playlist.title}”`, { description: `${tracks.length} tracks` });
		} catch {
			toast.error("Couldn't add to the playlist");
		}
		setBusy(null);
	};

	const create = async () => {
		const title = newName.trim();
		if (!title) return;
		setSubmitting(true);
		try {
			const res = await fetch("/api/v1/playlists", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ title }),
			});
			const json = await res.json();
			if (json.success) {
				const created = json.data as Playlist;
				setPlaylists((prev) => [created, ...prev]);
				await add(created);
				setNewName("");
				setDialogOpen(false);
			}
		} catch {
			toast.error("Couldn't create the playlist");
		}
		setSubmitting(false);
	};

	if (!isAuthenticated || tracks.length === 0) return null;

	return (
		<>
			<DropdownMenu onOpenChange={(open) => open && fetchPlaylists()}>
				<DropdownMenuTrigger aria-label={label} title={label} className={tonalIcon}>
					<ListPlus />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start" side="bottom" sideOffset={8} className="w-64 rounded-2xl p-1.5">
					<DropdownMenuGroup>
						<DropdownMenuLabel className="type-eyebrow text-primary">{label}</DropdownMenuLabel>
					</DropdownMenuGroup>
					<DropdownMenuSeparator />
					{loading && playlists.length === 0 ? (
						<div className="flex items-center justify-center py-4 text-muted-foreground">
							<Spinner />
						</div>
					) : playlists.length === 0 ? (
						<p className="px-2 py-3 text-center text-xs text-muted-foreground">No playlists yet</p>
					) : (
						<div className="max-h-72 overflow-y-auto">
							{playlists.map((p) => (
								<DropdownMenuItem
									key={p.id}
									closeOnClick={false}
									disabled={busy === p.id}
									onClick={() => !addedTo.has(p.id) && add(p)}
									className="flex items-center justify-between gap-2 rounded-xl py-2"
								>
									<span className="min-w-0">
										<span className="block truncate font-semibold">{p.title}</span>
										{p._count && <span className="block text-xs text-muted-foreground">{p._count.tracks} tracks</span>}
									</span>
									<AnimatePresence mode="popLayout" initial={false}>
										{busy === p.id ? (
											<motion.span key="busy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
												<Spinner className="text-muted-foreground" />
											</motion.span>
										) : addedTo.has(p.id) ? (
											<motion.span key="done" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-primary">
												<DrawCheck className="size-4" />
											</motion.span>
										) : null}
									</AnimatePresence>
								</DropdownMenuItem>
							))}
						</div>
					)}
					<DropdownMenuSeparator />
					<DropdownMenuItem className="gap-2 rounded-xl py-2 font-semibold text-primary" onClick={() => setDialogOpen(true)}>
						<span className="flex size-7 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
							<Plus className="size-4" />
						</span>
						New playlist
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className="rounded-[28px]">
					<DialogHeader className="items-start">
						<motion.span
							initial={{ scale: 0.4, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{ type: "spring", stiffness: 420, damping: 14 }}
							className="bg-brand-gradient mb-2 flex size-14 items-center justify-center rounded-full text-white"
						>
							<ListPlus className="size-6" />
						</motion.span>
						<DialogTitle className="text-2xl font-semibold tracking-tight">New playlist</DialogTitle>
					</DialogHeader>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							void create();
						}}
					>
						<Input autoFocus placeholder="Name" value={newName} onChange={(e) => setNewName(e.target.value)} className="h-12 rounded-2xl" />
						<DialogFooter className="mt-4">
							<Button
								type="button"
								variant="ghost"
								className="rounded-full"
								onClick={() => {
									setDialogOpen(false);
									setNewName("");
								}}
							>
								Cancel
							</Button>
							<Button type="submit" className={cn("rounded-full")} disabled={!newName.trim() || submitting}>
								{submitting && <Spinner size={14} />}
								Create
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</>
	);
}
