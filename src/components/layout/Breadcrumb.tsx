"use client";

import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";

const ROOT = "Home";

const SEGMENT_LABELS: Record<string, string> = {
	library: "Library",
	"my-playlists": "Playlists",
	settings: "Settings",
	about: "About",
	search: "Search",
	album: "Album",
	artist: "Artist",
	playlist: "Playlist",
	errors: "Errors",
};

export function Breadcrumb() {
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const crumbs = useMemo(() => {
		if (!pathname || pathname === "/") return [];

		const parts = pathname.split("/").filter(Boolean);
		const result: { label: string; href: string }[] = [];

		let acc = "";
		for (const part of parts) {
			acc += `/${part}`;
			const label = SEGMENT_LABELS[part] || part;
			result.push({ label, href: acc });
		}

		// Append ?id=... for query-based routes (album, artist, playlist, search)
		const id = searchParams.get("id");
		const term = searchParams.get("term");
		const tail = id || term;
		if (tail && result.length > 0) {
			result.push({
				label: String(tail).slice(0, 24),
				href: pathname + "?" + searchParams.toString(),
			});
		}

		return result;
	}, [pathname, searchParams]);

	return (
		<nav
			aria-label="Breadcrumb"
			className="flex min-w-0 items-center gap-1.5 overflow-hidden text-sm text-muted-foreground"
		>
			<Link
				href="/"
				className="shrink-0 no-underline transition-colors hover:text-foreground"
			>
				{ROOT}
			</Link>
			{crumbs.map((c, i) => {
				const isLast = i === crumbs.length - 1;
				return (
					<span key={c.href} className="flex min-w-0 shrink-0 items-center gap-1.5 last:min-w-0 last:shrink">
						<span aria-hidden className="text-muted-foreground/50">/</span>
						{isLast ? (
							<span aria-current="page" className="max-w-[16ch] truncate text-foreground sm:max-w-[24ch]">
								{c.label}
							</span>
						) : (
							<Link
								href={c.href}
								className="max-w-[12ch] truncate no-underline transition-colors hover:text-foreground"
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
