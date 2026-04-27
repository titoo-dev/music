"use client";

import { create } from "zustand";
import { useEffect, useMemo } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Library status store — client-side cache of saved track/album IDs.
// Backed by /api/v1/library/status (batch lookup) and updated optimistically
// on save/unsave actions.
// ─────────────────────────────────────────────────────────────────────────────

interface LibraryState {
	savedTracks: Set<string>;
	savedAlbums: Set<string>;
	hydrated: boolean;
	pendingTracks: string[];
	pendingAlbums: string[];

	addTrack: (trackId: string) => void;
	removeTrack: (trackId: string) => void;
	addAlbum: (albumId: string) => void;
	removeAlbum: (albumId: string) => void;
	requestStatus: (trackIds: string[], albumIds: string[]) => void;
	setHydrated: (
		tracks: Iterable<string>,
		albums: Iterable<string>
	) => void;
	clear: () => void;
}

const useLibraryState = create<LibraryState>((set, get) => ({
	savedTracks: new Set(),
	savedAlbums: new Set(),
	hydrated: false,
	pendingTracks: [],
	pendingAlbums: [],

	addTrack: (trackId) =>
		set((s) => ({ savedTracks: new Set(s.savedTracks).add(trackId) })),
	removeTrack: (trackId) =>
		set((s) => {
			const next = new Set(s.savedTracks);
			next.delete(trackId);
			return { savedTracks: next };
		}),
	addAlbum: (albumId) =>
		set((s) => ({ savedAlbums: new Set(s.savedAlbums).add(albumId) })),
	removeAlbum: (albumId) =>
		set((s) => {
			const next = new Set(s.savedAlbums);
			next.delete(albumId);
			return { savedAlbums: next };
		}),
	requestStatus: (trackIds, albumIds) => {
		const s = get();
		const newTracks = trackIds.filter(
			(id) => !s.savedTracks.has(id) && !s.pendingTracks.includes(id)
		);
		const newAlbums = albumIds.filter(
			(id) => !s.savedAlbums.has(id) && !s.pendingAlbums.includes(id)
		);
		if (newTracks.length === 0 && newAlbums.length === 0) return;
		set({
			pendingTracks: [...s.pendingTracks, ...newTracks],
			pendingAlbums: [...s.pendingAlbums, ...newAlbums],
		});
		void flushBatch();
	},
	setHydrated: (tracks, albums) =>
		set({
			savedTracks: new Set(tracks),
			savedAlbums: new Set(albums),
			hydrated: true,
		}),
	clear: () =>
		set({
			savedTracks: new Set(),
			savedAlbums: new Set(),
			hydrated: false,
			pendingTracks: [],
			pendingAlbums: [],
		}),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Batched status lookup — debounce + dedup in-flight requests
// ─────────────────────────────────────────────────────────────────────────────

let flushTimer: ReturnType<typeof setTimeout> | null = null;

async function flushBatch() {
	if (flushTimer) return;
	flushTimer = setTimeout(async () => {
		flushTimer = null;
		const state = useLibraryState.getState();
		const trackIds = state.pendingTracks;
		const albumIds = state.pendingAlbums;
		if (trackIds.length === 0 && albumIds.length === 0) return;
		useLibraryState.setState({ pendingTracks: [], pendingAlbums: [] });

		try {
			const res = await fetch("/api/v1/library/status", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ trackIds, albumIds }),
			});
			if (!res.ok) return;
			const json = await res.json();
			if (!json.success) return;

			const data = json.data as { tracks: string[]; albums: string[] };
			useLibraryState.setState((s) => {
				const nextT = new Set(s.savedTracks);
				for (const id of data.tracks) nextT.add(id);
				const nextA = new Set(s.savedAlbums);
				for (const id of data.albums) nextA.add(id);
				return { savedTracks: nextT, savedAlbums: nextA };
			});
		} catch {
			// Non-fatal — UI stays in unknown state
		}
	}, 60);
}

// ─────────────────────────────────────────────────────────────────────────────
// Public hooks
// ─────────────────────────────────────────────────────────────────────────────

export interface SaveTrackInput {
	trackId: string;
	title: string;
	artist: string;
	album?: string | null;
	albumId?: string | null;
	coverUrl?: string | null;
	duration?: number | null;
}

export interface SaveAlbumInput {
	deezerAlbumId: string;
	title: string;
	artist: string;
	coverUrl?: string | null;
	tracks: Array<{
		trackId: string;
		title: string;
		artist: string;
		coverUrl?: string | null;
		duration?: number | null;
		trackNumber?: number | null;
	}>;
}

/**
 * Track-level save state. Pass an array of trackIds and the hook batch-loads
 * their saved status from the server. Returns a Set + save/unsave callbacks.
 */
export function useSavedTracks(trackIds: string[] = []) {
	const savedTracks = useLibraryState((s) => s.savedTracks);
	const requestStatus = useLibraryState((s) => s.requestStatus);

	const stableIds = useMemo(() => trackIds.filter(Boolean), [trackIds]);

	useEffect(() => {
		if (stableIds.length > 0) requestStatus(stableIds, []);
	}, [stableIds, requestStatus]);

	const save = async (input: SaveTrackInput) => {
		useLibraryState.getState().addTrack(input.trackId);
		try {
			const res = await fetch("/api/v1/library/tracks", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify(input),
			});
			if (!res.ok) throw new Error("save failed");
		} catch (e) {
			useLibraryState.getState().removeTrack(input.trackId);
			throw e;
		}
	};

	const unsave = async (trackId: string) => {
		useLibraryState.getState().removeTrack(trackId);
		try {
			const res = await fetch(`/api/v1/library/tracks/${trackId}`, {
				method: "DELETE",
				credentials: "include",
			});
			if (!res.ok) throw new Error("unsave failed");
		} catch (e) {
			useLibraryState.getState().addTrack(trackId);
			throw e;
		}
	};

	const isSaved = (trackId: string) => savedTracks.has(trackId);

	return { saved: savedTracks, isSaved, save, unsave };
}

/**
 * Album-level save state — batch-loads, plus save/unsave for whole albums.
 */
export function useSavedAlbums(deezerAlbumIds: string[] = []) {
	const savedAlbums = useLibraryState((s) => s.savedAlbums);
	const requestStatus = useLibraryState((s) => s.requestStatus);

	const stableIds = useMemo(
		() => deezerAlbumIds.filter(Boolean),
		[deezerAlbumIds]
	);

	useEffect(() => {
		if (stableIds.length > 0) requestStatus([], stableIds);
	}, [stableIds, requestStatus]);

	const save = async (input: SaveAlbumInput) => {
		useLibraryState.getState().addAlbum(input.deezerAlbumId);
		try {
			const res = await fetch("/api/v1/library/albums", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify(input),
			});
			if (!res.ok) {
				const text = await res.text().catch(() => "");
				throw new Error(`save album ${res.status}: ${text}`);
			}
		} catch (e) {
			useLibraryState.getState().removeAlbum(input.deezerAlbumId);
			throw e;
		}
	};

	const unsave = async (libraryAlbumId: string, deezerAlbumId: string) => {
		useLibraryState.getState().removeAlbum(deezerAlbumId);
		try {
			const res = await fetch(`/api/v1/library/albums/${libraryAlbumId}`, {
				method: "DELETE",
				credentials: "include",
			});
			if (!res.ok) throw new Error("unsave failed");
		} catch (e) {
			useLibraryState.getState().addAlbum(deezerAlbumId);
			throw e;
		}
	};

	const isSaved = (deezerAlbumId: string) => savedAlbums.has(deezerAlbumId);

	return { saved: savedAlbums, isSaved, save, unsave };
}

/** Reset library cache on logout. */
export function clearLibraryCache() {
	useLibraryState.getState().clear();
}
