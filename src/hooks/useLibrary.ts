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
	// Negative cache — trackIds/albumIds we've already checked and know are
	// NOT saved. Without this we'd re-query the server every time a row for
	// an unsaved track scrolls into view.
	checkedTracks: Set<string>;
	checkedAlbums: Set<string>;
	hydrated: boolean;
	pendingTracks: string[];
	pendingAlbums: string[];

	addTrack: (trackId: string) => void;
	removeTrack: (trackId: string) => void;
	addAlbum: (albumId: string) => void;
	removeAlbum: (albumId: string) => void;
	requestStatus: (trackIds: string[], albumIds: string[]) => void;
	markChecked: (trackIds: string[], albumIds: string[]) => void;
	setHydrated: (
		tracks: Iterable<string>,
		albums: Iterable<string>
	) => void;
	clear: () => void;
}

const useLibraryState = create<LibraryState>((set, get) => ({
	savedTracks: new Set(),
	savedAlbums: new Set(),
	checkedTracks: new Set(),
	checkedAlbums: new Set(),
	hydrated: false,
	pendingTracks: [],
	pendingAlbums: [],

	addTrack: (trackId) =>
		set((s) => {
			const tracks = new Set(s.savedTracks).add(trackId);
			const checked = new Set(s.checkedTracks).add(trackId);
			return { savedTracks: tracks, checkedTracks: checked };
		}),
	removeTrack: (trackId) =>
		set((s) => {
			const next = new Set(s.savedTracks);
			next.delete(trackId);
			// Track is now known-not-saved (still "checked")
			const checked = new Set(s.checkedTracks).add(trackId);
			return { savedTracks: next, checkedTracks: checked };
		}),
	addAlbum: (albumId) =>
		set((s) => {
			const albums = new Set(s.savedAlbums).add(albumId);
			const checked = new Set(s.checkedAlbums).add(albumId);
			return { savedAlbums: albums, checkedAlbums: checked };
		}),
	removeAlbum: (albumId) =>
		set((s) => {
			const next = new Set(s.savedAlbums);
			next.delete(albumId);
			const checked = new Set(s.checkedAlbums).add(albumId);
			return { savedAlbums: next, checkedAlbums: checked };
		}),
	requestStatus: (trackIds, albumIds) => {
		const s = get();
		const newTracks = trackIds.filter(
			(id) =>
				!s.checkedTracks.has(id) &&
				!s.savedTracks.has(id) &&
				!s.pendingTracks.includes(id)
		);
		const newAlbums = albumIds.filter(
			(id) =>
				!s.checkedAlbums.has(id) &&
				!s.savedAlbums.has(id) &&
				!s.pendingAlbums.includes(id)
		);
		if (newTracks.length === 0 && newAlbums.length === 0) return;
		set({
			pendingTracks: [...s.pendingTracks, ...newTracks],
			pendingAlbums: [...s.pendingAlbums, ...newAlbums],
		});
		void flushBatch();
	},
	markChecked: (trackIds, albumIds) =>
		set((s) => ({
			checkedTracks: new Set([...s.checkedTracks, ...trackIds]),
			checkedAlbums: new Set([...s.checkedAlbums, ...albumIds]),
		})),
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
			checkedTracks: new Set(),
			checkedAlbums: new Set(),
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
				// Mark every queried id as checked — positive AND negative —
				// so subsequent renders of the same row don't re-query.
				const checkedT = new Set(s.checkedTracks);
				for (const id of trackIds) checkedT.add(id);
				const checkedA = new Set(s.checkedAlbums);
				for (const id of albumIds) checkedA.add(id);
				return {
					savedTracks: nextT,
					savedAlbums: nextA,
					checkedTracks: checkedT,
					checkedAlbums: checkedA,
				};
			});
		} catch {
			// Non-fatal — UI stays in unknown state
		}
	}, 150);
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
