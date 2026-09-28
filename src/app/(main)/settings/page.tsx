"use client";

import { motion } from "motion/react";
import { AudioCacheManager } from "@/components/audio/AudioCacheManager";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { cn } from "@/lib/utils";

const CROSSFADE_OPTIONS = [0, 2, 4, 6, 8, 10];

function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<section className="mb-10">
			<h2 className="mb-3 text-sm font-medium">{title}</h2>
			<div className="rounded-xl border border-border bg-card divide-y divide-border">
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
		<div className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:gap-6">
			<div className="flex-1 min-w-0">
				<p className="text-sm font-medium">{label}</p>
				{hint && (
					<p className="text-sm text-muted-foreground mt-0.5">{hint}</p>
				)}
			</div>
			<div className="shrink-0 self-end md:self-auto">{children}</div>
		</div>
	);
}

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={on}
			onClick={onChange}
			// 44×44 hit area via before:; visual track stays w-9 h-5.
			className={cn(
				"relative inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
				"before:absolute before:-inset-y-3 before:-inset-x-1 before:content-['']",
				on ? "bg-primary" : "bg-input"
			)}
		>
			<motion.span
				initial={false}
				animate={{ x: on ? 16 : 0 }}
				transition={{ type: "spring", stiffness: 600, damping: 36 }}
				className="block size-4 rounded-full bg-background shadow-sm"
			/>
		</button>
	);
}

function Segmented<T extends string | number>({
	id,
	value,
	options,
	onChange,
	format,
}: {
	id: string;
	value: T;
	options: readonly T[];
	onChange: (v: T) => void;
	format?: (v: T) => string;
}) {
	return (
		<div className="inline-flex max-w-full overflow-x-auto scrollbar-hide rounded-lg border border-border bg-muted/50 p-0.5">
			{options.map((opt) => {
				const active = value === opt;
				return (
					<button
						key={String(opt)}
						type="button"
						aria-pressed={active}
						onClick={() => onChange(opt)}
						className={cn(
							"relative h-9 md:h-7 shrink-0 rounded-md px-3 text-sm tabular-nums cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
							active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
						)}
					>
						{active && (
							<motion.span
								layoutId={`${id}-indicator`}
								className="absolute inset-0 rounded-md bg-background shadow-sm"
								transition={{ type: "spring", stiffness: 500, damping: 38 }}
							/>
						)}
						<span className="relative">{format ? format(opt) : String(opt)}</span>
					</button>
				);
			})}
		</div>
	);
}

function StatusBadge({ ok, children }: { ok: boolean; children: React.ReactNode }) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
				ok
					? "border-border bg-background text-foreground"
					: "border-destructive/30 bg-destructive/10 text-destructive"
			)}
		>
			<span
				aria-hidden
				className={cn("size-1.5 rounded-full", ok ? "bg-success" : "bg-destructive")}
			/>
			{children}
		</span>
	);
}

export default function SettingsPage() {
	const normalizationEnabled = usePlayerStore((s) => s.normalizationEnabled);
	const toggleNormalization = usePlayerStore((s) => s.toggleNormalization);
	const crossfadeDuration = usePlayerStore((s) => s.crossfadeDuration);
	const setCrossfadeDuration = usePlayerStore((s) => s.setCrossfadeDuration);

	const user = useAuthStore((s) => s.user);
	const deezerUser = useAuthStore((s) => s.deezerUser);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const { prefs, updatePrefs } = useUserPreferences();
	const preCacheSaved = !!prefs.preCacheSaved;

	return (
		<motion.div
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3, ease: "easeOut" }}
			className="mx-auto max-w-2xl pt-2"
		>
			{/* Page header */}
			<div className="mb-10">
				<h1 className="text-2xl sm:text-3xl font-semibold tracking-tight m-0">Settings</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Playback, account and cache preferences.
				</p>
			</div>

			<SettingsGroup title="Playback">
				<SettingRow
					label="Volume normalization"
					hint="Automatically adjust track volume for consistent playback levels."
				>
					<Toggle on={normalizationEnabled} onChange={toggleNormalization} />
				</SettingRow>

				{isAuthenticated && (
					<SettingRow
						label="Pre-cache saved tracks"
						hint="Saving a track or album also fetches the audio file in the background so the first play is instant. Off by default — files are fetched on demand."
					>
						<Toggle
							on={preCacheSaved}
							onChange={() => updatePrefs({ preCacheSaved: !preCacheSaved })}
						/>
					</SettingRow>
				)}

				<SettingRow
					label="Crossfade"
					hint={crossfadeDuration === 0 ? "Disabled — sharp transitions" : `${crossfadeDuration}s overlap between tracks`}
				>
					<Segmented
						id="crossfade"
						value={crossfadeDuration}
						options={CROSSFADE_OPTIONS}
						onChange={setCrossfadeDuration}
						format={(s) => (s === 0 ? "Off" : `${s}s`)}
					/>
				</SettingRow>
			</SettingsGroup>

			{/* Account */}
			{isAuthenticated && (
				<SettingsGroup title="Account">
					<SettingRow
						label="Google"
						hint={user?.email ? `Linked to ${user.email}` : "Signed in with Google"}
					>
						<StatusBadge ok>Connected</StatusBadge>
					</SettingRow>
					<SettingRow
						label="Deezer account"
						hint={deezerUser?.name ? `Linked to ${deezerUser.name}` : "Required to download tracks"}
					>
						<StatusBadge ok={!!deezerUser}>
							{deezerUser ? "Connected" : "Not linked"}
						</StatusBadge>
					</SettingRow>
				</SettingsGroup>
			)}

			{/* Cache */}
			<section className="mb-10">
				<h2 className="mb-3 text-sm font-medium">Cache</h2>
				<div className="rounded-xl border border-border bg-card overflow-hidden">
					<AudioCacheManager />
				</div>
			</section>

			{/* Build footer */}
			<p className="mt-12 mb-6 text-xs text-muted-foreground">
				deemix-next <span className="font-mono tabular-nums">v0.1.0</span>
			</p>
		</motion.div>
	);
}
