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
import { Loader2, Plus, Music, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { CoverImage } from "@/components/ui/cover-image";

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
			<div className="aspect-square bg-muted flex items-center justify-center border-b-[2px] border-foreground">
				<Music className="size-8 text-muted-foreground/40" />
			</div>
		);
	}

	if (imgs.length < 4) {
		return (
			<CoverImage
				src={imgs[0]}
				alt={title}
				className="aspect-square w-full border-0 border-b-[2px] border-foreground"
			/>
		);
	}

	return (
		<div className="aspect-square grid grid-cols-2 grid-rows-2 border-b-[2px] border-foreground overflow-hidden">
			{imgs.map((src, i) => (
				<CoverImage
					key={i}
					src={src}
					alt=""
					className="w-full h-full border-0"
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
			<div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
				<p className="text-sm text-muted-foreground">Sign in to manage your playlists.</p>
				<Link href="/login">
					<Button>Sign in</Button>
				</Link>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[50vh]">
				<Loader2 className="size-5 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-brutal-lg">My Playlists</h1>
					<p className="text-sm text-muted-foreground mt-1 uppercase tracking-wider font-bold">
						{playlists.length} playlist{playlists.length !== 1 ? "s" : ""}
					</p>
				</div>

				<Dialog>
					<DialogTrigger
						render={
							<Button size="sm" className="gap-1.5">
								<Plus className="size-4" />
								New Playlist
							</Button>
						}
					/>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Create Playlist</DialogTitle>
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
								{creating ? <Loader2 className="size-4 animate-spin" /> : "Create"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			{playlists.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-24 gap-2">
					<Music className="size-8 text-muted-foreground/50" />
					<p className="text-sm text-muted-foreground font-bold uppercase">No playlists yet</p>
					<p className="text-xs text-muted-foreground font-bold uppercase">
						Create your first playlist to start organizing your music.
					</p>
				</div>
			) : (
				<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
					{playlists.map((pl) => (
						<div
							key={pl.id}
							className="group relative border-2 sm:border-[3px] border-foreground shadow-[var(--shadow-brutal)] hover:shadow-[var(--shadow-brutal-hover)] hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all bg-card overflow-hidden"
						>
							<Link href={`/my-playlists/${pl.id}`} className="no-underline">
								<PlaylistCover covers={pl.covers} title={pl.title} />
								<div className="px-2 py-2">
									<p className="text-sm font-bold truncate">{pl.title}</p>
									<p className="text-[11px] text-muted-foreground font-mono truncate">
										{pl._count.tracks} track{pl._count.tracks !== 1 ? "s" : ""}
									</p>
								</div>
							</Link>
							{pl.title !== "Downloads" && (
								<Button
									variant="ghost"
									size="icon-xs"
									className="absolute top-1.5 right-1.5 bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
									onClick={(e) => {
										e.preventDefault();
										setDeleteTarget(pl);
									}}
								>
									<Trash2 className="size-3" />
								</Button>
							)}
						</div>
					))}
				</div>
			)}

			<Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
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
						<Button variant="outline" onClick={() => setDeleteTarget(null)}>
							Cancel
						</Button>
						<Button variant="destructive" onClick={handleDelete} disabled={deleting}>
							{deleting && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
