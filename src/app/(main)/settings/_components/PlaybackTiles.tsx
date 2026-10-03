"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, AudioLines, Blend, Check, Eye, EyeOff, Gauge, Gem, Info, KeyRound, Link2, Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { postToServer, fetchData } from "@/utils/api";
import { cn } from "@/lib/utils";
import { DUR, SlidingSegments } from "@/components/expressive";
import { toast } from "sonner";
import { Notice, OptionCard, SettingsTile, StatusPill, TilePanel } from "./SettingsTiles";

// ─── Deezer account ────────────────────────────────────────────────────────

/** Deezer link status, with an inline ARL connect form (existing `auth/login-arl`). */
export function DeezerAccountTile() {
	const deezerUser = useAuthStore((s) => s.deezerUser);
	const setDeezerUser = useAuthStore((s) => s.setDeezerUser);
	const linked = !!deezerUser;
	const [open, setOpen] = useState(false);
	const [arl, setArl] = useState("");
	const [reveal, setReveal] = useState(false);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showForm, setShowForm] = useState(false);

	const formVisible = !linked || showForm;
	const picture = deezerUser?.picture ? `https://e-cdns-images.dzcdn.net/images/user/${deezerUser.picture}/112x112-000000-80-0-0.jpg` : null;

	const connect = async () => {
		const token = arl.trim();
		if (!token || busy) return;
		setBusy(true);
		setError(null);
		try {
			// Cookie values may be URL-encoded when copied from devtools.
			const data = await postToServer("auth/login-arl", { arl: decodeURIComponent(token) });
			if (data?.user) setDeezerUser(data.user);
			setArl("");
			setShowForm(false);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Couldn’t connect. Check the ARL and try again.");
		} finally {
			setBusy(false);
		}
	};

	return (
		<SettingsTile
			icon={AudioLines}
			title="Deezer account"
			subtitle={linked ? `Linked to ${deezerUser?.name ?? "Deezer"}` : "Required to stream full tracks"}
			tone={linked ? "primary" : "error"}
			trailing={<StatusPill label={linked ? "Linked" : "Connect"} icon={linked ? Check : Link2} tone={linked ? "primary" : "error"} className="hidden min-[400px]:inline-flex" />}
			chevron
			expanded={open}
			onClick={() => setOpen((o) => !o)}
		>
			<TilePanel open={open} className="space-y-3">
				{linked && (
					<div className="flex items-center gap-3 rounded-[20px] bg-surface-high p-3">
						<span className="bg-brand-gradient shrink-0 rounded-full p-[2px]">
							{picture ? (
								// eslint-disable-next-line @next/next/no-img-element
								<img src={picture} alt="" className="size-11 rounded-full border-2 border-surface-high object-cover" />
							) : (
								<span className="flex size-11 items-center justify-center rounded-full border-2 border-surface-high bg-primary-container font-semibold text-on-primary-container">
									{deezerUser?.name?.charAt(0).toUpperCase() ?? "D"}
								</span>
							)}
						</span>
						<div className="min-w-0 flex-1">
							<p className="truncate font-semibold text-foreground">{deezerUser?.name ?? "Deezer"}</p>
							<div className="mt-1 flex flex-wrap gap-1.5">
								{deezerUser?.can_stream_lossless ? (
									<StatusPill label="Lossless" icon={Gem} tone="tertiary" />
								) : deezerUser?.can_stream_hq ? (
									<StatusPill label="High quality" icon={AudioLines} tone="tertiary" />
								) : (
									<StatusPill label="Free plan" tone="muted" />
								)}
							</div>
						</div>
						<motion.button
							type="button"
							whileTap={{ scale: 0.95 }}
							onClick={() => setShowForm((v) => !v)}
							className="h-9 shrink-0 rounded-full px-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
						>
							{showForm ? "Cancel" : "Change"}
						</motion.button>
					</div>
				)}
				<AnimatePresence initial={false}>
					{formVisible && (
						<motion.form
							key="form"
							initial={{ height: 0, opacity: 0 }}
							animate={{ height: "auto", opacity: 1 }}
							exit={{ height: 0, opacity: 0 }}
							transition={{ duration: DUR.medium }}
							className="overflow-hidden"
							onSubmit={(e) => {
								e.preventDefault();
								connect();
							}}
						>
							<label htmlFor="deezer-arl" className="type-eyebrow mb-2 block px-1 text-muted-foreground">
								ARL cookie
							</label>
							<div className="relative">
								<KeyRound className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
								<input
									id="deezer-arl"
									type={reveal ? "text" : "password"}
									autoComplete="off"
									spellCheck={false}
									value={arl}
									disabled={busy}
									onChange={(e) => setArl(e.target.value)}
									placeholder="Paste your Deezer arl"
									className="h-14 w-full rounded-2xl border-2 border-transparent bg-surface-highest pl-12 pr-12 font-mono text-sm text-foreground outline-none transition-colors placeholder:font-sans placeholder:text-muted-foreground focus:border-primary"
								/>
								<button
									type="button"
									aria-label={reveal ? "Hide" : "Show"}
									onClick={() => setReveal((r) => !r)}
									className="absolute right-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-high hover:text-foreground"
								>
									{reveal ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
								</button>
							</div>
							<p className="mt-2 px-1 text-xs leading-relaxed text-muted-foreground">Value of the arl cookie from deezer.com. It stays on your server and is used to stream full tracks.</p>
							<AnimatePresence initial={false}>
								{error && (
									<motion.div key={error} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
										<div className="pt-3">
											<Notice icon={AlertCircle} tone="error" onClose={() => setError(null)}>
												{error}
											</Notice>
										</div>
									</motion.div>
								)}
							</AnimatePresence>
							<motion.button
								type="submit"
								whileTap={{ scale: 0.97 }}
								disabled={busy || !arl.trim()}
								className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-[background-color,opacity] hover:bg-primary/90 disabled:opacity-50 sm:w-auto"
							>
								{busy ? <Loader2 className="size-[18px] animate-spin" /> : <Link2 className="size-[18px]" />}
								{busy ? "Connecting…" : linked ? "Switch account" : "Connect Deezer"}
							</motion.button>
						</motion.form>
					)}
				</AnimatePresence>
			</TilePanel>
		</SettingsTile>
	);
}

// ─── Streaming quality ─────────────────────────────────────────────────────

export const BITRATE_OPTIONS = [
	{ value: 1, label: "Data saver", detail: "MP3 · 128 kbps", icon: Gauge },
	{ value: 3, label: "High", detail: "MP3 · 320 kbps", icon: AudioLines },
	{ value: 9, label: "Lossless", detail: "FLAC · up to 1411 kbps", icon: Gem },
] as const;

/**
 * Streaming quality: the server's `maxBitrate`, one value for every listener
 * (`settings/quality`). Picking a card saves it optimistically and rolls back on error.
 */
export function QualityTile() {
	const deezerUser = useAuthStore((s) => s.deezerUser);
	const [bitrate, setBitrate] = useState<number | null>(null);
	const [loading, setLoading] = useState(true);
	const [open, setOpen] = useState(false);

	useEffect(() => {
		let live = true;
		fetchData("settings/quality")
			.then((d) => {
				const v = Number(d?.maxBitrate);
				if (live && Number.isFinite(v)) setBitrate(v);
			})
			.catch(() => {})
			.finally(() => live && setLoading(false));
		return () => {
			live = false;
		};
	}, []);

	const current = BITRATE_OPTIONS.find((o) => o.value === bitrate);
	const Icon = current?.icon ?? AudioLines;

	const choose = async (value: number) => {
		if (value === bitrate) return;
		const before = bitrate;
		setBitrate(value);
		try {
			await postToServer("settings/quality", { maxBitrate: value });
		} catch (e) {
			setBitrate(before);
			toast.error(e instanceof Error ? e.message : "Couldn’t change the streaming quality");
		}
	};

	return (
		<SettingsTile
			icon={Icon}
			title="Streaming quality"
			subtitle={
				<AnimatePresence mode="popLayout" initial={false}>
					<motion.span key={current?.value ?? String(loading)} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="block">
						{current ? `${current.label} · ${current.detail}` : loading ? "Loading…" : "Default"}
					</motion.span>
				</AnimatePresence>
			}
			expanded={open}
			onClick={() => setOpen((o) => !o)}
		>
			<TilePanel open={open} className="space-y-2">
				<div role="radiogroup" aria-label="Streaming quality" className="space-y-2">
					{BITRATE_OPTIONS.map((o, i) => (
						<OptionCard
							key={o.value}
							index={i}
							icon={o.icon}
							title={o.label}
							selected={o.value === bitrate}
							onClick={() => choose(o.value)}
							detail={o.value === 9 && deezerUser && !deezerUser.can_stream_lossless ? `${o.detail} · your Deezer plan may fall back to MP3` : o.detail}
						/>
					))}
				</div>
				<div className="pt-1">
					<Notice icon={Info}>Applies to every listener on this server. Tracks already cached keep the quality they were saved in.</Notice>
				</div>
			</TilePanel>
		</SettingsTile>
	);
}

// ─── Crossfade ─────────────────────────────────────────────────────────────

const CROSSFADE_OPTIONS = [0, 2, 4, 6, 8, 10];

/** Crossfade length: live value pill + segmented steps. */
export function CrossfadeTile({ seconds, onChange }: { seconds: number; onChange: (s: number) => void }) {
	const on = seconds > 0;
	return (
		<SettingsTile
			icon={Blend}
			title="Crossfade"
			tone={on ? "primary" : "muted"}
			subtitle={on ? `${seconds}s overlap between tracks` : "Disabled — sharp transitions"}
			trailing={
				<span className={cn("inline-flex h-8 min-w-12 items-center justify-center rounded-full px-3 text-sm font-semibold tabular-nums transition-colors duration-300", on ? "bg-tertiary-container text-on-tertiary-container" : "bg-surface-highest text-muted-foreground")}>
					<AnimatePresence mode="popLayout" initial={false}>
						<motion.span key={seconds} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ duration: DUR.short }}>
							{on ? `${seconds} s` : "Off"}
						</motion.span>
					</AnimatePresence>
				</span>
			}
		>
			<div className="px-4 pb-4">
				<SlidingSegments
					id="crossfade"
					size="sm"
					value={String(seconds)}
					onChange={(v) => onChange(Number(v))}
					items={CROSSFADE_OPTIONS.map((s) => ({ value: String(s), label: s === 0 ? "Off" : `${s}s` }))}
				/>
			</div>
		</SettingsTile>
	);
}
