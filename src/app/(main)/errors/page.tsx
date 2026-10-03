"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { CircleCheck, Disc3, ListX, Search, Trash2, TriangleAlert } from "lucide-react";
import { useErrorStore } from "@/stores/useErrorStore";
import { cn } from "@/lib/utils";
import { GlassIconBadge, GlassPill, HeroBanner, HeroEyebrow, HeroTitle, Medallion, entrance, heroGlassButton, swap } from "@/components/expressive";
import { SettingsSection, StatusPill } from "../settings/_components/SettingsTiles";
import { ArtistLink } from "@/components/links/EntityLink";

export default function ErrorsPage() {
	const { errors, downloadInfo, clearErrors } = useErrorStore();
	const n = errors.length;

	return (
		<div className="mx-auto max-w-4xl pb-6 pt-2">
			<motion.div {...entrance(0)}>
				<HeroBanner contentClassName="p-6 sm:p-8 lg:p-10">
					<div className="flex items-start justify-between gap-4">
						<GlassIconBadge icon={n ? TriangleAlert : CircleCheck} size={52} />
						<AnimatePresence>
							{n > 0 && (
								<motion.button key="clear" type="button" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} whileTap={{ scale: 0.95 }} onClick={clearErrors} className={heroGlassButton}>
									<Trash2 />
									Clear all
								</motion.button>
							)}
						</AnimatePresence>
					</div>
					<HeroEyebrow className="mt-6">Downloads</HeroEyebrow>
					<HeroTitle first="Errors" second={n ? `${n} failed.` : "All clean."} className="mt-2" />
					<p className="mt-3 max-w-md text-base text-white/80">{n ? "Tracks that couldn’t be fetched in your last download. The reason is on each row." : "Nothing failed. Every download completed cleanly."}</p>
					<div className="mt-5 flex flex-wrap gap-2">
						<GlassPill icon={ListX} value={n} label={n === 1 ? "failed track" : "failed tracks"} />
						{downloadInfo && <GlassPill icon={Disc3} value={downloadInfo.size} label="in source" />}
					</div>
				</HeroBanner>
			</motion.div>

			{downloadInfo && (
				<SettingsSection title="Source" index={1}>
					<div className="flex items-center gap-4 px-4 py-3.5">
						<span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
							<Disc3 className="size-[22px]" />
						</span>
						<div className="min-w-0 flex-1">
							<p className="truncate text-base font-semibold text-foreground">{downloadInfo.title}</p>
							<p className="truncate text-sm tabular-nums text-muted-foreground">
								<ArtistLink name={downloadInfo.artist} className="transition-colors hover:text-foreground" /> · {downloadInfo.size} tracks
							</p>
						</div>
					</div>
				</SettingsSection>
			)}

			<AnimatePresence mode="wait" initial={false}>
				{n === 0 ? (
					<motion.div key="empty" variants={swap} initial="initial" animate="animate" exit="exit">
						<Medallion
							icon={CircleCheck}
							title="No errors"
							message="All downloads completed cleanly."
							action={
								<Link href="/search" className="inline-flex h-11 items-center gap-2 rounded-full bg-secondary px-5 text-sm font-semibold text-secondary-foreground no-underline transition-transform active:scale-95">
									<Search className="size-[18px]" />
									Find music
								</Link>
							}
						/>
					</motion.div>
				) : (
					<motion.div key="list" variants={swap} initial="initial" animate="animate" exit="exit">
						<SettingsSection title={`Failed · ${n}`} index={2}>
							{errors.map((error, idx) => (
								<motion.div
									key={idx}
									{...entrance(idx, 8)}
									className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-start gap-4 px-4 py-3.5 transition-colors hover:bg-surface-high"
								>
									<span className="flex size-10 items-center justify-center rounded-xl bg-destructive/15 font-mono text-sm font-semibold tabular-nums text-destructive">{String(idx + 1).padStart(2, "0")}</span>
									<div className="min-w-0 pt-0.5">
										<p className="text-base font-semibold leading-snug text-foreground">{error.message}</p>
										{error.data && (
											<p className="mt-0.5 truncate text-sm text-muted-foreground">
												<ArtistLink name={error.data.artist} className="transition-colors hover:text-foreground" /> · {error.data.title} · <span className="font-mono text-xs">ID {error.data.id}</span>
											</p>
										)}
									</div>
									<span className={cn("pt-2", !error.errid && "text-xs text-muted-foreground")}>{error.errid ? <StatusPill label={error.errid} tone="error" className="font-mono" /> : "—"}</span>
								</motion.div>
							))}
						</SettingsSection>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
