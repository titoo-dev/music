import { create } from "zustand";

interface DownloadError {
	message: string;
	errid?: string;
	data?: { id: string; title: string; artist: string };
	type?: string;
	stack?: string;
}

interface ErrorState {
	errors: DownloadError[];
	downloadInfo: {
		title: string;
		artist: string;
		size: number;
	} | null;

	setErrors: (errors: DownloadError[]) => void;
	addError: (error: DownloadError) => void;
	setDownloadInfo: (info: ErrorState["downloadInfo"]) => void;
	clearErrors: () => void;
}

export const useErrorStore = create<ErrorState>((set) => ({
	errors: [],
	downloadInfo: null,

	setErrors: (errors) => set({ errors }),
	addError: (error) => set((s) => ({ errors: [...s.errors, error] })),
	setDownloadInfo: (downloadInfo) => set({ downloadInfo }),
	clearErrors: () => set({ errors: [], downloadInfo: null }),
}));
