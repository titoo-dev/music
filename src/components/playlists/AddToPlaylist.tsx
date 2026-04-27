"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuGroup,
	DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { ListPlus, Plus, Loader2, Check } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";

export interface TrackInfo {
	trackId: string;
	title: string;
	artist: string;
	album?: string | null;
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
	const [newName, setNewName] = useState("");
	const [submitting, setSubmitting] = useState(false);
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

	const handleCreate = async () => {
		const name = newName.trim();
		if (!name) return;
		setSubmitting(true);
		try {
			const res = await fetch("/api/v1/playlists", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ title: name }),
			});
			const json = await res.json();
			if (json.success) {
				const newPlaylist = json.data as Playlist;
				setPlaylists((prev) => [newPlaylist, ...prev]);
				await handleAdd(newPlaylist.id);
				setNewName("");
				setDialogOpen(false);
			}
		} catch {
			// ignore
		}
		setSubmitting(false);
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
				<DropdownMenuContent align="end" side="bottom" sideOffset={4} className="w-56">
					<DropdownMenuGroup>
						<DropdownMenuLabel>Add to playlist</DropdownMenuLabel>
					</DropdownMenuGroup>
					<DropdownMenuSeparator />
					{loading ? (
						<div className="flex items-center justify-center py-3">
							<Loader2 className="size-4 animate-spin text-muted-foreground" />
						</div>
					) : playlists.length === 0 ? (
						<div className="px-2 py-3 text-xs text-muted-foreground text-center">
							No playlists yet
						</div>
					) : (
						playlists.map((p) => (
							<DropdownMenuItem
								key={p.id}
								className="flex items-center justify-between gap-2"
								onClick={() => !addedTo.has(p.id) && handleAdd(p.id)}
							>
								<span className="truncate">{p.title}</span>
								{addedTo.has(p.id) && (
									<Check className="size-3.5 text-foreground shrink-0" />
								)}
							</DropdownMenuItem>
						))
					)}
					<DropdownMenuSeparator />
					<DropdownMenuItem
						className="gap-1.5 text-muted-foreground"
						onClick={() => setDialogOpen(true)}
					>
						<Plus className="size-3.5" />
						New playlist
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>New playlist</DialogTitle>
					</DialogHeader>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							handleCreate();
						}}
					>
						<Input
							autoFocus
							placeholder="Playlist name"
							value={newName}
							onChange={(e) => setNewName(e.target.value)}
						/>
						<DialogFooter className="mt-4">
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									setDialogOpen(false);
									setNewName("");
								}}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={!newName.trim() || submitting}>
								{submitting && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
								Create & add
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</>
	);
}
