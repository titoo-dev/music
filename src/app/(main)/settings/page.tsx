"use client";

import { AudioCacheManager } from "@/components/audio/AudioCacheManager";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUserPreferences } from "@/hooks/useUserPreferences";

const PLAYBACK_RATES = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
const CROSSFADE_OPTIONS = [0, 2, 4, 6, 8, 10];

function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<section className="mb-8">
			<div className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] pb-2 border-b-[2px] border-foreground">
				{title}
			</div>
			<div className="border-l-[2px] border-r-[2px] border-b-[2px] border-foreground bg-card divide-y-[1px] divide-foreground/15">
				{children}
			</div>
		</section>
	);
}

function SettingRow({
	label,
	hint,
	children,
}: {
	label: string;
	hint?: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex items-center gap-5 px-4 py-3.5">
			<div className="flex-1 min-w-0">
				<p className="text-[13px] font-bold tracking-[0.02em]">{label}</p>
				{hint && (
					<p className="text-[11px] text-muted-foreground font-medium mt-0.5">{hint}</p>
				)}
			</div>
			<div className="shrink-0">{children}</div>
		</div>
	);
}

function BrutalToggle({ on, onChange }: { on: boolean; onChange: () => void }) {
	return (
		<button
			role="switch"
			aria-checked={on}
			onClick={onChange}
			className={`relative w-11 h-6 border-[2px] border-foreground transition-colors ${
				on ? "bg-primary" : "bg-card"
			}`}
		>
			<div
				className={`absolute top-0 w-5 h-5 transition-[left] duration-150 ${
					on ? "left-5 bg-white" : "left-0 bg-foreground"
				}`}
			/>
		</button>
	);
}

function PillGroup<T extends string | number>({
	value,
	options,
	onChange,
	format,
}: {
	value: T;
	options: readonly T[];
	onChange: (v: T) => void;
	format?: (v: T) => string;
}) {
	return (
		<div className="flex">
			{options.map((opt, i) => {
				const active = value === opt;
				return (
					<button
						key={String(opt)}
						onClick={() => onChange(opt)}
						className={`px-3 py-1.5 border-[2px] border-foreground font-mono text-[11px] font-bold tracking-[0.05em] uppercase cursor-pointer transition-colors ${
							i > 0 ? "-ml-[2px]" : ""
						} ${
							active
								? "bg-foreground text-background z-10 relative"
								: "bg-card text-foreground hover:bg-accent/40"
						}`}
					>
						{format ? format(opt) : String(opt)}
					</button>
				);
			})}
		</div>
	);
}

export default function SettingsPage() {
	const normalizationEnabled = usePlayerStore((s) => s.normalizationEnabled);
	const toggleNormalization = usePlayerStore((s) => s.toggleNormalization);
	const playbackRate = usePlayerStore((s) => s.playbackRate);
	const setPlaybackRate = usePlayerStore((s) => s.setPlaybackRate);
	const crossfadeDuration = usePlayerStore((s) => s.crossfadeDuration);
	const setCrossfadeDuration = usePlayerStore((s) => s.setCrossfadeDuration);

	const user = useAuthStore((s) => s.user);
	const deezerUser = useAuthStore((s) => s.deezerUser);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const { prefs, updatePrefs } = useUserPreferences();
	const preCacheSaved = !!prefs.preCacheSaved;

	return (
		<div className="mx-auto max-w-2xl">
			{/* Page header */}
			<div className="mb-9">
				<p className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-muted-foreground mb-3">
					SETTINGS · V0.1.0
				</p>
				<h1 className="text-brutal-xl m-0">
					CONFIG<span className="text-primary">.</span>
				</h1>
			</div>

			<SettingsGroup title="PLAYBACK">
				<SettingRow
					label="VOLUME NORMALIZATION"
					hint="Automatically adjust track volume for consistent playback levels."
				>
					<BrutalToggle on={normalizationEnabled} onChange={toggleNormalization} />
				</SettingRow>

				{isAuthenticated && (
					<SettingRow
						label="PRE-CACHE SAVED TRACKS"
						hint="Saving a track or album also fetches the audio file in the background so the first play is instant. Off by default — files are fetched on demand."
					>
						<BrutalToggle
							on={preCacheSaved}
							onChange={() => updatePrefs({ preCacheSaved: !preCacheSaved })}
						/>
					</SettingRow>
				)}

				<SettingRow
					label="PLAYBACK SPEED"
					hint={playbackRate === 1 ? "Normal speed" : `Currently playing at ${playbackRate}× speed`}
				>
					<PillGroup
						value={playbackRate}
						options={PLAYBACK_RATES}
						onChange={setPlaybackRate}
						format={(r) => (r === 1 ? "1×" : `${r}×`)}
					/>
				</SettingRow>

				<SettingRow
					label="CROSSFADE"
					hint={crossfadeDuration === 0 ? "Disabled — sharp transitions" : `${crossfadeDuration}s overlap between tracks`}
				>
					<PillGroup
						value={crossfadeDuration}
						options={CROSSFADE_OPTIONS}
						onChange={setCrossfadeDuration}
						format={(s) => (s === 0 ? "OFF" : `${s}s`)}
					/>
				</SettingRow>
			</SettingsGroup>

			{/* Account */}
			{isAuthenticated && (
				<SettingsGroup title="ACCOUNT">
					<SettingRow
						label="GOOGLE AUTH"
						hint={user?.email ? `Linked to ${user.email}` : "Signed in with Google"}
					>
						<span className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] border-[2px] border-foreground bg-accent text-foreground px-2 py-1">
							CONNECTED
						</span>
					</SettingRow>
					<SettingRow
						label="DEEZER ACCOUNT"
						hint={deezerUser?.name ? `Linked to ${deezerUser.name}` : "Required to download tracks"}
					>
						<span
							className={`font-mono text-[10px] font-bold uppercase tracking-[0.1em] border-[2px] border-foreground px-2 py-1 ${
								deezerUser ? "bg-accent text-foreground" : "bg-destructive text-white"
							}`}
						>
							{deezerUser ? "CONNECTED" : "NOT LINKED"}
						</span>
					</SettingRow>
				</SettingsGroup>
			)}

			{/* Cache */}
			<section className="mb-8">
				<div className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] pb-2 border-b-[2px] border-foreground">
					CACHE
				</div>
				<div className="border-l-[2px] border-r-[2px] border-b-[2px] border-foreground bg-card">
					<AudioCacheManager />
				</div>
			</section>

			{/* Build footer */}
			<div className="mt-10 mb-6 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
				DEEMIX-NEXT · v0.1.0 · BRUTALIST EDITION
			</div>
		</div>
	);
}
