"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Album, AudioLines, Heart, LogIn, LogOut, Unlink } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/motion/icons";
import { GlassPill, HERO_NIGHT, HeroBanner, HeroTitle, entrance, heroGlassButton, heroPrimaryButton } from "@/components/expressive";

/** Signed-in hero: ring avatar, name, email and glass stat pills. */
export function ProfileHero({
	name,
	email,
	avatarUrls,
	deezer,
	liked,
	albums,
	covers,
	onSignOut,
}: {
	name: string;
	email?: string | null;
	/** Tried in order; the initial shows when none loads. */
	avatarUrls: string[];
	/** "lossless" | "linked" | null (not linked). */
	deezer: "lossless" | "linked" | null;
	liked: number | null;
	albums: number | null;
	covers: string[];
	onSignOut: () => void;
}) {
	const [tried, setTried] = useState(0);
	const avatarUrl = avatarUrls[tried];
	return (
		<HeroBanner covers={covers} minCovers={8} contentClassName="p-6 sm:p-8 lg:p-10">
			<div className="flex items-start justify-between gap-4">
				<motion.span
					initial={{ scale: 0.7, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					transition={{ type: "spring", stiffness: 260, damping: 18 }}
					className="bg-brand-gradient shrink-0 rounded-full p-[3px] shadow-[0_8px_24px_-6px_rgb(129_140_248/0.6)]"
				>
					<span className="flex size-[68px] items-center justify-center overflow-hidden rounded-full sm:size-20 lg:size-24" style={{ backgroundColor: HERO_NIGHT.base }}>
						{avatarUrl ? (
							// eslint-disable-next-line @next/next/no-img-element
							<img src={avatarUrl} alt="" className="size-full object-cover" referrerPolicy="no-referrer" key={avatarUrl} onError={() => setTried((n) => n + 1)} />
						) : (
							<span className="text-2xl font-semibold text-white sm:text-3xl">{name.charAt(0).toUpperCase() || "?"}</span>
						)}
					</span>
				</motion.span>
				<motion.button type="button" whileTap={{ scale: 0.95 }} onClick={onSignOut} className={heroGlassButton}>
					<LogOut />
					Sign out
				</motion.button>
			</div>

			<motion.div {...entrance(1, 12)} className="mt-5 min-w-0">
				<h2 className="type-display truncate text-[1.75rem] text-white sm:text-4xl lg:text-5xl">{name}</h2>
				{email && <p className="mt-1 truncate text-sm text-white/75 sm:text-base">{email}</p>}
			</motion.div>

			<div className="mt-5 flex flex-wrap gap-2">
				<motion.span {...entrance(2, 8)}>
					<GlassPill icon={deezer ? AudioLines : Unlink} label={deezer === "lossless" ? "Lossless" : deezer ? "Deezer" : "No Deezer"} />
				</motion.span>
				{liked != null && (
					<motion.span {...entrance(3, 8)}>
						<GlassPill icon={Heart} value={liked} label="liked" />
					</motion.span>
				)}
				{albums != null && (
					<motion.span {...entrance(4, 8)}>
						<GlassPill icon={Album} value={albums} label="albums" />
					</motion.span>
				)}
			</div>
		</HeroBanner>
	);
}

/** Guest hero: logo, "Browsing / as a guest." and a Sign in call to action. */
export function GuestHero({ covers }: { covers: string[] }) {
	return (
		<HeroBanner covers={covers} minCovers={8} contentClassName="flex min-h-[300px] flex-col justify-end p-6 sm:min-h-[340px] sm:p-8 lg:p-10">
			<motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18 }}>
				<LogoMark animated className="size-[52px]" />
			</motion.div>
			<motion.div {...entrance(1, 12)}>
				<HeroTitle as="h2" first="Browsing" second="as a guest." className="mt-5 text-[2.5rem] sm:text-5xl lg:text-6xl" />
			</motion.div>
			<motion.p {...entrance(2, 8)} className="mt-2 max-w-md text-base text-white/80">
				Sign in to stream full tracks and keep a library in sync.
			</motion.p>
			<motion.div {...entrance(3, 8)} className="mt-5">
				<Link href="/login" className={cn(heroPrimaryButton, "no-underline")}>
					<LogIn />
					Sign in
				</Link>
			</motion.div>
		</HeroBanner>
	);
}
