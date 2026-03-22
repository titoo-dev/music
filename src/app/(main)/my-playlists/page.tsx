"use client";

import { useEffect, useState } from "react";
import { fetchData, postToServer } from "@/utils/api";
import { useAuthStore } from "@/stores/useAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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

interface PlaylistItem {
	id: string;
	title: string;
	description: string | null;
	createdAt: string;
	updatedAt: string;
	_count: { tracks: number };
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
					<h1 className="text-2xl font-semibold tracking-tight">My Playlists</h1>
					<p className="text-sm text-muted-foreground mt-1">
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
					<p className="text-sm text-muted-foreground">No playlists yet</p>
					<p className="text-xs text-muted-foreground">
						Create your first playlist to start organizing your music.
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{playlists.map((pl) => (
						<Card key={pl.id} className="group relative">
							<Link href={`/my-playlists/${pl.id}`} className="no-underline">
								<CardHeader className="pb-2">
									<CardTitle className="text-base truncate">{pl.title}</CardTitle>
									<CardDescription>
										{pl._count.tracks} track{pl._count.tracks !== 1 ? "s" : ""}
									</CardDescription>
								</CardHeader>
								<CardContent>
									<p className="text-xs text-muted-foreground">
										Updated {new Date(pl.updatedAt).toLocaleDateString()}
									</p>
								</CardContent>
							</Link>
							{pl.title !== "Downloads" && <Button
								variant="ghost"
								size="icon"
								className="absolute top-2 right-2 text-muted-foreground hover:text-red-500"
								onClick={(e) => {
									e.preventDefault();
									setDeleteTarget(pl);
								}}
							>
								<Trash2 className="size-4" />
							</Button>}
						</Card>
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
