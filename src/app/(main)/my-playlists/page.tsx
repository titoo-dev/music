"use client";

import { useEffect, useState } from "react";
import { fetchData, postToServer } from "@/utils/api";
import { useAuthStore } from "@/stores/useAuthStore";
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
import { Plus, Music, Trash2, Download } from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";
import { EmptyState, Spinner } from "@/components/motion/icons";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { CoverImage } from "@/components/ui/cover-image";
import { ImportSpotifyDialog } from "@/components/playlists/ImportSpotifyDialog";

interface PlaylistItem {
	id: string;
	title: string;
	description: string | null;
	createdAt: string;
	updatedAt: string;
	_count: { tracks: number };
	covers?: string[];
}

function PlaylistCover({ covers, title }: { covers?: string[]; title: string }) {
	const imgs = covers?.slice(0, 4) || [];

	if (imgs.length === 0) {
		return (
			<div className="aspect-square w-full rounded-lg bg-muted flex items-center justify-center">
				<Music className="size-8 text-muted-foreground/40" />
			</div>
		);
	}

	if (imgs.length < 4) {
		return (
			<CoverImage
				src={imgs[0]}
				alt={title}
				className="aspect-square w-full rounded-lg transition-transform duration-300 group-hover:scale-[1.02]"
			/>
		);
	}

	return (
		<div className="aspect-square w-full grid grid-cols-2 grid-rows-2 overflow-hidden rounded-lg transition-transform duration-300 group-hover:scale-[1.02]">
			{imgs.map((src, i) => (
				<CoverImage
					key={i}
					src={src}
					alt=""
					className="w-full h-full rounded-none"
				/>
			))}
		</div>
	);
}

export default function MyPlaylistsPage() {
	const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [newTitle, setNewTitle] = useState("");
	const [creating, setCreating] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<PlaylistItem | null>(null);
	const [deleting, setDeleting] = useState(false);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const currentPlayerTrack = usePlayerStore((s) => s.currentTrack);
	const stopPlayer = usePlayerStore((s) => s.stop);

	const loadPlaylists = async () => {
		try {
			const data = await fetchData("playlists");
			setPlaylists(data || []);
		} catch {
			// ignore
		}
		setLoading(false);
	};

	useEffect(() => {
		if (isAuthenticated) loadPlaylists();
		else setLoading(false);
	}, [isAuthenticated]);

	const handleCreate = async () => {
		if (!newTitle.trim()) return;
		setCreating(true);
		try {
			await postToServer("playlists", { title: newTitle.trim() });
			setNewTitle("");
			await loadPlaylists();
		} catch {
			// ignore
		}
		setCreating(false);
	};

	const handleDelete = async () => {
		if (!deleteTarget) return;
		// Stop player in case it's playing a track from this playlist
		if (currentPlayerTrack) {
			stopPlayer();
		}
		setDeleting(true);
		try {
			await fetch(`/api/v1/playlists/${deleteTarget.id}`, { method: "DELETE" });
			setPlaylists((prev) => prev.filter((p) => p.id !== deleteTarget.id));
			setDeleteTarget(null);
		} catch {
			// ignore
		}
		setDeleting(false);
	};

	if (!isAuthenticated) {
		return (
			<EmptyState
				className="mt-8"
				title="Sign in to manage your playlists"
				description="Your playlists sync across devices once you're signed in."
				action={
					<Link href="/login">
						<Button>Sign in</Button>
					</Link>
				}
			/>
		);
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[50vh] text-muted-foreground">
				<Spinner size={20} />
			</div>
		);
	}

	return (
		<div className="space-y-8 pt-2">
			<motion.div
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3, ease: "easeOut" }}
				className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
			>
				<div>
					<h1 className="text-2xl sm:text-3xl font-semibold tracking-tight m-0">My playlists</h1>
					<p className="text-sm text-muted-foreground mt-1 tabular-nums">
						{playlists.length} playlist{playlists.length !== 1 ? "s" : ""}
					</p>
				</div>

				<div className="flex items-center gap-2 flex-wrap">
					<ImportSpotifyDialog
						trigger={
							<Button size="sm" variant="outline" className="min-h-11 sm:min-h-8">
								<Download aria-hidden />
								Import from Spotify
							</Button>
						}
						onImported={loadPlaylists}
					/>

					<Dialog>
						<DialogTrigger
							render={
								<Button size="sm" className="min-h-11 sm:min-h-8">
									<Plus aria-hidden />
									New playlist
								</Button>
							}
						/>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Create playlist</DialogTitle>
								<DialogDescription>
									Give your playlist a name to get started.
								</DialogDescription>
							</DialogHeader>
							<Input
								value={newTitle}
								onChange={(e) => setNewTitle(e.target.value)}
								placeholder="Playlist name..."
								onKeyDown={(e) => e.key === "Enter" && handleCreate()}
							/>
							<DialogFooter>
								<DialogClose render={<Button variant="outline">Cancel</Button>} />
								<Button onClick={handleCreate} disabled={creating || !newTitle.trim()}>
									{creating ? <Spinner /> : "Create"}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			</motion.div>

			{playlists.length === 0 ? (
				<EmptyState
					title="No playlists yet"
					description="Create your first playlist to start organizing your music."
				/>
			) : (
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-6">
					{playlists.map((pl, i) => (
						<motion.div
							key={pl.id}
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.25, delay: Math.min(i, 12) * 0.03, ease: "easeOut" }}
							className="group relative min-w-0"
						>
							<Link href={`/my-playlists/${pl.id}`} className="block no-underline">
								<div className="overflow-hidden rounded-lg ring-1 ring-border">
									<PlaylistCover covers={pl.covers} title={pl.title} />
								</div>
								<div className="mt-2 min-w-0">
									<p className="text-sm font-medium truncate text-foreground">{pl.title}</p>
									<p className="text-xs text-muted-foreground truncate tabular-nums">
										{pl._count.tracks} track{pl._count.tracks !== 1 ? "s" : ""}
									</p>
								</div>
							</Link>
							<Button
								variant="outline"
								size="icon-touch"
								aria-label={`Delete ${pl.title}`}
								className="absolute top-2 right-2 rounded-full bg-background/90 backdrop-blur-sm text-muted-foreground hover:text-destructive md:opacity-0 md:[@media(hover:hover)]:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
								onClick={(e) => {
									e.preventDefault();
									setDeleteTarget(pl);
								}}
							>
								<Trash2 className="size-3.5" aria-hidden />
							</Button>
						</motion.div>
					))}
				</div>
			)}

			<Dialog open={!!deleteTarget} onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete playlist</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete &ldquo;{deleteTarget?.title}&rdquo;?
							{deleteTarget && deleteTarget._count.tracks > 0 && (
								<> It contains {deleteTarget._count.tracks} track{deleteTarget._count.tracks !== 1 ? "s" : ""}. This action cannot be undone.</>
							)}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
							Cancel
						</Button>
						<Button variant="destructive" onClick={handleDelete} disabled={deleting}>
							{deleting && <Spinner size={14} />}
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
