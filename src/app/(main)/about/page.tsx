"use client";

import { useSyncExternalStore } from "react";
import { motion } from "motion/react";
import { AudioLines, BadgeCheck, Database, Layers, Rocket, Server, Sparkles, Tag } from "lucide-react";
import { useAppStore } from "@/stores/useAppStore";
import { useDiscover } from "@/hooks/useDiscover";
import { LogoMark } from "@/components/motion/icons";
import { GlassPill, HeroBanner, entrance } from "@/components/expressive";
import { SettingsSection, SettingsTile, StatusPill } from "../settings/_components/SettingsTiles";

/** Fallback when the registry check hasn't reported a build (package.json version). */
const APP_VERSION = "0.1.0";

const STACK = [
	{ icon: Rocket, k: "Runtime", v: "Next.js 16" },
	{ icon: Database, k: "Database", v: "Postgres · Prisma 7" },
	{ icon: Layers, k: "UI", v: "React 19 · Tailwind 4" },
];

const noop = () => () => {};

function Value({ children }: { children: React.ReactNode }) {
	return <span className="shrink-0 rounded-full bg-surface-high px-3 py-1 font-mono text-xs font-semibold tabular-nums text-foreground">{children}</span>;
}

export default function AboutPage() {
	const { currentVersion, latestVersion, updateAvailable } = useAppStore();
	const { showcase } = useDiscover();
	const origin = useSyncExternalStore(noop, () => window.location.origin, () => "");
	const version = currentVersion || APP_VERSION;

	return (
		<div className="mx-auto max-w-5xl pb-6 pt-2">
			<motion.div {...entrance(0)}>
				<HeroBanner covers={showcase} minCovers={8} contentClassName="flex min-h-[300px] flex-col justify-end p-6 pt-8 sm:min-h-[360px] sm:p-10">
					<motion.div initial={{ scale: 0.6, opacity: 0, rotate: -8 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 240, damping: 16 }}>
						<LogoMark animated className="size-[72px] drop-shadow-[0_10px_24px_rgb(129_140_248/0.45)]" />
					</motion.div>
					<motion.h1 {...entrance(1, 12)} className="type-display mt-6 text-5xl text-white sm:text-6xl lg:text-7xl">
						wavelet
					</motion.h1>
					<motion.p {...entrance(2, 8)} className="mt-2 max-w-lg text-base text-white/80 sm:text-lg">
						A Material 3 music client for your own server.
					</motion.p>
					<div className="mt-5 flex flex-wrap gap-2">
						<motion.span {...entrance(3, 8)}>
							<GlassPill icon={BadgeCheck} value={version} label="version" />
						</motion.span>
						<motion.span {...entrance(4, 8)}>
							<GlassPill icon={AudioLines} label="Lossless ready" />
						</motion.span>
						{updateAvailable && (
							<motion.span {...entrance(5, 8)}>
								<GlassPill icon={Sparkles} label="Update available" />
							</motion.span>
						)}
					</div>
				</HeroBanner>
			</motion.div>

			<div className="grid items-start gap-x-6 lg:grid-cols-2">
				<SettingsSection title="Details" index={1}>
					<SettingsTile icon={Tag} title="Current build" subtitle="The version of wavelet you’re running." trailing={<Value>{version}</Value>} />
					{latestVersion && <SettingsTile icon={BadgeCheck} title="Latest release" subtitle="Most recent published version." tone="tertiary" trailing={<Value>{latestVersion}</Value>} />}
					{updateAvailable && (
						<SettingsTile icon={Sparkles} title="Update available" subtitle="A newer build is published. Pull to refresh." tone="tertiary" trailing={<StatusPill label="New" tone="tertiary" />} />
					)}
					<SettingsTile
						icon={Server}
						title="Server"
						subtitle={<span className="block truncate">{origin || "—"}</span>}
						tone="secondary"
					/>
				</SettingsSection>

				<SettingsSection title="Built with" index={2}>
					{STACK.map((s) => (
						<SettingsTile key={s.k} icon={s.icon} title={s.k} subtitle={s.v} tone="muted" />
					))}
				</SettingsSection>
			</div>

			<motion.p {...entrance(3)} className="mx-auto mt-10 max-w-md px-6 text-center text-xs leading-relaxed text-muted-foreground">
				wavelet is not affiliated with Deezer. Music is streamed through your own Deezer account.
			</motion.p>
		</div>
	);
}
