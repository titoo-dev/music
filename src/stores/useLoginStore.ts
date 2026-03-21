import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
	id?: number;
	name?: string;
	picture?: string;
	can_stream_lossless?: boolean;
	can_stream_hq?: boolean;
}

interface LoginState {
	arl: string;
	accessToken: string;
	user: User | null;
	childs: User[];
	currentChild: number;
	loggedIn: boolean;
	spotifyUser: string;

	setArl: (arl: string) => void;
	setAccessToken: (token: string) => void;
	setUser: (user: User | null) => void;
	setChilds: (childs: User[]) => void;
	setCurrentChild: (n: number) => void;
	setLoggedIn: (v: boolean) => void;
	setSpotifyUser: (v: string) => void;
	logout: () => void;
}

export const useLoginStore = create<LoginState>()(
	persist(
		(set) => ({
			arl: "",
			accessToken: "",
			user: null,
			childs: [],
			currentChild: 0,
			loggedIn: false,
			spotifyUser: "",

			setArl: (arl) => set({ arl }),
			setAccessToken: (accessToken) => set({ accessToken }),
			setUser: (user) => set({ user, loggedIn: !!user }),
			setChilds: (childs) => set({ childs }),
			setCurrentChild: (currentChild) => set({ currentChild }),
			setLoggedIn: (loggedIn) => set({ loggedIn }),
			setSpotifyUser: (spotifyUser) => set({ spotifyUser }),
			logout: () => set({ user: null, loggedIn: false, arl: "" }),
		}),
		{ name: "deemix-login" }
	)
);
