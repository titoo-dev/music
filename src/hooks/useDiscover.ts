"use client";

import { useEffect, useState } from "react";
import { fetchData } from "@/utils/api";
import { explorePictures, parseExploreSections, parseNewReleases, type AlbumSummary, type HomeSection } from "@/lib/discover";

interface Discover {
	releases: AlbumSummary[];
	sections: HomeSection[];
	/** Artwork for decorative walls (releases, topped up from explore). */
	showcase: string[];
	loading: boolean;
}

let cached: Omit<Discover, "loading"> | null = null;

/** New releases + explore sections, fetched once per session. Never throws. */
export function useDiscover(): Discover {
	const [state, setState] = useState<Discover>(() => (cached ? { ...cached, loading: false } : { releases: [], sections: [], showcase: [], loading: true }));

	useEffect(() => {
		if (cached) return;
		let live = true;
		Promise.all([fetchData("content/new-releases").catch(() => null), fetchData("content/home").catch(() => null)]).then(([releasesRaw, homeRaw]) => {
			const releases = parseNewReleases(releasesRaw);
			const sections = parseExploreSections(homeRaw);
			const showcase = [...new Set([...releases.map((a) => a.cover).filter((c): c is string => !!c), ...explorePictures(homeRaw)])].slice(0, 48);
			const next = { releases, sections, showcase };
			if (releases.length || sections.length) cached = next;
			if (live) setState({ ...next, loading: false });
		});
		return () => {
			live = false;
		};
	}, []);

	return state;
}
