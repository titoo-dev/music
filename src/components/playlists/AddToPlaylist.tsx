"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuGroup,
	DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { ListMusic, ListPlus, Plus } from "lucide-react";
import { DrawCheck, Spinner } from "@/components/motion/icons";
import { useAuthStore } from "@/stores/useAuthStore";
import { PlaylistEditDialog } from "./PlaylistDialogs";
import { plural } from "./format";

export interface TrackInfo {
	trackId: string;
	title: string;
	artist: string;
	album?: string | null;
	albumId?: string | null;
	coverUrl?: string | null;
	duration?: number | null;
}

interface Playlist {
	id: string;
	title: string;
	_count?: { tracks: number };
}

export function AddToPlaylist({
	track,
	className,
}: {
	track: TrackInfo;
	className?: string;
}) {
	const [playlists, setPlaylists] = useState<Playlist[]>([]);
	const [loading, setLoading] = useState(false);
	const [addedTo, setAddedTo] = useState<Set<string>>(new Set());
	const [dialogOpen, setDialogOpen] = useState(false);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

	const fetchPlaylists = useCallback(async () => {
		if (!isAuthenticated) return;
		setLoading(true);
		try {
			const res = await fetch("/api/v1/playlists", { credentials: "include" });
			const json = await res.json();
			if (json.success) {
				setPlaylists(json.data as Playlist[]);
			}
		} catch {
			// ignore
		}
		setLoading(false);
	}, [isAuthenticated]);

	const handleAdd = async (playlistId: string) => {
		try {
			const res = await fetch(`/api/v1/playlists/${playlistId}/tracks`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({
					tracks: [
						{
							trackId: track.trackId,
							title: track.title,
							artist: track.artist,
							album: track.album || null,
							albumId: track.albumId || null,
							coverUrl: track.coverUrl || null,
							duration: track.duration || null,
						},
					],
				}),
			});
			if (res.ok) {
				setAddedTo((prev) => new Set(prev).add(playlistId));
			}
		} catch {
			// ignore
		}
	};

	const handleCreate = async ({ title, description }: { title: string; description: string | null }) => {
		const res = await fetch("/api/v1/playlists", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ title, description }),
		});
		const json = await res.json();
		if (!json.success) throw new Error(json.error?.message || "Couldn't create the playlist");
		const newPlaylist = json.data as Playlist;
		setPlaylists((prev) => [newPlaylist, ...prev]);
		await handleAdd(newPlaylist.id);
	};

	return (
		<>
			<DropdownMenu onOpenChange={(open) => open && fetchPlaylists()}>
				<DropdownMenuTrigger
					render={
						<Button
							variant="ghost"
							size="icon"
							className={className}
							title="Add to playlist"
						/>
					}
				>
					<ListPlus className="size-3.5" />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" side="bottom" sideOffset={6} className="w-64 rounded-2xl p-1.5">
					<DropdownMenuGroup>
						<DropdownMenuLabel className="type-eyebrow px-2.5 pb-1.5 pt-2 text-primary">Add to playlist</DropdownMenuLabel>
					</DropdownMenuGroup>
					<DropdownMenuSeparator />
					{loading ? (
						<div className="flex items-center justify-center py-3">
							<Spinner className="text-muted-foreground" />
						</div>
					) : playlists.length === 0 ? (
						<div className="px-2 py-4 text-center text-xs text-muted-foreground">No playlists yet</div>
					) : (
						playlists.map((p) => (
							<DropdownMenuItem
								key={p.id}
								className="flex items-center justify-between gap-2 rounded-xl py-2"
								onClick={() => !addedTo.has(p.id) && handleAdd(p.id)}
							>
								<span className="flex min-w-0 items-center gap-2.5">
									<span className="bg-tonal-gradient flex size-8 shrink-0 items-center justify-center rounded-lg text-on-primary-container">
										<ListMusic className="size-4" />
									</span>
									<span className="min-w-0">
										<span className="block truncate font-medium">{p.title}</span>
										{p._count && <span className="block text-xs text-muted-foreground">{plural(p._count.tracks, "track")}</span>}
									</span>
								</span>
								{addedTo.has(p.id) && (
									<DrawCheck className="size-4 text-success shrink-0" />
								)}
							</DropdownMenuItem>
						))
					)}
					<DropdownMenuSeparator />
					<DropdownMenuItem className="gap-2.5 rounded-xl py-2 font-semibold text-primary" onClick={() => setDialogOpen(true)}>
						<span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
							<Plus className="size-4" />
						</span>
						New playlist
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<PlaylistEditDialog open={dialogOpen} onOpenChange={setDialogOpen} mode="create" submitLabel="Create & add" onSubmit={handleCreate} />
		</>
	);
}
