import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─────────────────────────────────────────────────────────────────────────────
// useStemsStore — mixer state for the stem-playback UI. Foundation for the
// future multi-track player: once we wire stems into AudioEngine, the mixer
// reads volumes from here and the UI writes to it.
//
// Volumes are stored per *stem name* (vocals, drums, ...) globally rather
// than per track. The expectation is that a user who turns vocals down to
// 0 wants every karaoke session to start that way; per-track overrides can
// be layered on top later if anyone asks for it.
// ─────────────────────────────────────────────────────────────────────────────

export type StemName =
	| "vocals"
	| "no_vocals"
	| "drums"
	| "bass"
	| "guitar"
	| "piano"
	| "other";

export type PlaybackMode = "off" | "karaoke" | "custom";

interface StemsState {
	/** Current playback mode. "off" = play original, "karaoke" = mute vocals. */
	mode: PlaybackMode;
	/** Volume per stem in [0, 100]. Defaults to 100 unless overridden. */
	volumes: Partial<Record<StemName, number>>;
	/** Explicitly muted stems. Independent from volume so the user can
	 *  flip a mute on/off without losing their dialed-in level. */
	muted: Partial<Record<StemName, boolean>>;

	setMode: (mode: PlaybackMode) => void;
	setVolume: (stem: StemName, value: number) => void;
	toggleMute: (stem: StemName) => void;
	resetMixer: () => void;

	/** Effective volume for a stem after mode + mute is applied. */
	effectiveVolume: (stem: StemName) => number;
}

const DEFAULT_VOLUME = 100;

function clampVolume(v: number): number {
	if (!Number.isFinite(v)) return DEFAULT_VOLUME;
	return Math.max(0, Math.min(100, Math.round(v)));
}

export const useStemsStore = create<StemsState>()(
	persist(
		(set, get) => ({
			mode: "off",
			volumes: {},
			muted: {},

			setMode: (mode) => set({ mode }),

			setVolume: (stem, value) =>
				set((s) => ({
					volumes: { ...s.volumes, [stem]: clampVolume(value) },
				})),

			toggleMute: (stem) =>
				set((s) => ({
					muted: { ...s.muted, [stem]: !s.muted[stem] },
				})),

			resetMixer: () => set({ volumes: {}, muted: {}, mode: "off" }),

			effectiveVolume: (stem) => {
				const { mode, volumes, muted } = get();
				if (muted[stem]) return 0;
				// Karaoke mode hard-mutes vocals regardless of slider position so
				// users get the expected behavior with one click; flipping back
				// to "custom" preserves whatever level they had set before.
				if (mode === "karaoke" && stem === "vocals") return 0;
				return volumes[stem] ?? DEFAULT_VOLUME;
			},
		}),
		{
			name: "deemix-stems-mixer",
			partialize: (s) => ({
				mode: s.mode,
				volumes: s.volumes,
				muted: s.muted,
			}),
		},
	),
);
