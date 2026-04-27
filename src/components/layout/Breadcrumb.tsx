"use client";

import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";

const ROOT = "~/DEEMIX";

const SEGMENT_LABELS: Record<string, string> = {
	library: "LIBRARY",
	"my-playlists": "PLAYLISTS",
	settings: "SETTINGS",
	about: "ABOUT",
	search: "SEARCH",
	album: "ALBUM",
	artist: "ARTIST",
	playlist: "PLAYLIST",
	errors: "ERRORS",
};

export function Breadcrumb() {
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const crumbs = useMemo(() => {
		if (!pathname || pathname === "/") return [{ label: "HOME", href: "/" }];

		const parts = pathname.split("/").filter(Boolean);
		const result: { label: string; href: string }[] = [];

		let acc = "";
		for (const part of parts) {
			acc += `/${part}`;
			const label = SEGMENT_LABELS[part] || part.toUpperCase();
			result.push({ label, href: acc });
		}

		// Append ?id=... for query-based routes (album, artist, playlist, search)
		const id = searchParams.get("id");
		const term = searchParams.get("term");
		const tail = id || term;
		if (tail && result.length > 0) {
			result[result.length - 1] = {
				...result[result.length - 1],
				label: result[result.length - 1].label,
			};
			result.push({
				label: String(tail).toUpperCase().slice(0, 24),
				href: pathname + "?" + searchParams.toString(),
			});
		}

		return result;
	}, [pathname, searchParams]);

	return (
		<nav
			aria-label="Breadcrumb"
			className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground flex items-center gap-1.5 overflow-hidden min-w-0"
		>
			<Link
				href="/"
				className="font-bold hover:text-foreground transition-colors no-underline shrink-0"
			>
				{ROOT}
			</Link>
			{crumbs.map((c, i) => {
				const isLast = i === crumbs.length - 1;
				return (
					<span key={c.href} className="flex items-center gap-1.5 min-w-0 shrink-0 last:shrink last:min-w-0">
						<span aria-hidden className="opacity-60">/</span>
						{isLast ? (
							<span className="font-bold text-foreground truncate max-w-[16ch] sm:max-w-[24ch]">
								{c.label}
							</span>
						) : (
							<Link
								href={c.href}
								className="font-bold hover:text-foreground transition-colors no-underline truncate max-w-[12ch]"
							>
								{c.label}
							</Link>
						)}
					</span>
				);
			})}
		</nav>
	);
}
