"use client";

import { create } from "zustand";

export interface BetterAuthUser {
	id: string;
	name: string;
	email: string;
	image: string | null;
}

export interface DeezerUser {
	id?: number;
	name?: string;
	picture?: string;
	can_stream_lossless?: boolean;
	can_stream_hq?: boolean;
}

interface AuthState {
	// Better-auth (Google identity)
	user: BetterAuthUser | null;
	isAuthenticated: boolean;

	// Deezer connection
	deezerUser: DeezerUser | null;
	isDeezerConnected: boolean;

	// Deezer child accounts
	childs: DeezerUser[];
	currentChild: number;

	// Spotify
	spotifyUser: string;

	// Loading
	isLoading: boolean;

	// Actions
	setUser: (user: BetterAuthUser | null) => void;
	setDeezerUser: (user: DeezerUser | null) => void;
	setChilds: (childs: DeezerUser[]) => void;
	setCurrentChild: (n: number) => void;
	setSpotifyUser: (v: string) => void;
	setLoading: (v: boolean) => void;
	logout: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
	user: null,
	isAuthenticated: false,
	deezerUser: null,
	isDeezerConnected: false,
	childs: [],
	currentChild: 0,
	spotifyUser: "",
	isLoading: true,

	setUser: (user) =>
		set({ user, isAuthenticated: !!user }),

	setDeezerUser: (deezerUser) =>
		set({ deezerUser, isDeezerConnected: !!deezerUser }),

	setChilds: (childs) => set({ childs }),
	setCurrentChild: (currentChild) => set({ currentChild }),
	setSpotifyUser: (spotifyUser) => set({ spotifyUser }),
	setLoading: (isLoading) => set({ isLoading }),

	logout: () =>
		set({
			user: null,
			isAuthenticated: false,
			deezerUser: null,
			isDeezerConnected: false,
			childs: [],
			currentChild: 0,
		}),
}));
