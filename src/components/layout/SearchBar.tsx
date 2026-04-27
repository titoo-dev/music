"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

function parseDeezerLink(url: string): { type: string; id: string } | null {
	const trackMatch = url.match(/\/track\/(\d+)/);
	if (trackMatch) return { type: "track", id: trackMatch[1] };
	const albumMatch = url.match(/\/album\/(\d+)/);
	if (albumMatch) return { type: "album", id: albumMatch[1] };
	const playlistMatch = url.match(/\/playlist\/(\d+)/);
	if (playlistMatch) return { type: "playlist", id: playlistMatch[1] };
	const artistMatch = url.match(/\/artist\/(\d+)/);
	if (artistMatch) return { type: "artist", id: artistMatch[1] };
	return null;
}

export function SearchBar() {
	const searchParams = useSearchParams();
	const [term, setTerm] = useState(searchParams.get("term") ?? "");
	const router = useRouter();

	useEffect(() => {
		setTerm(searchParams.get("term") ?? "");
	}, [searchParams]);
	const inputRef = useRef<HTMLInputElement>(null);

	const handleSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			const v = term.trim();
			if (!v) return;

			const link = parseDeezerLink(v);
			if (link) {
				router.push(`/${link.type}?id=${link.id}`);
				setTerm("");
				return;
			}
			router.push(`/search?term=${encodeURIComponent(v)}`);
		},
		[term, router]
	);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "f") {
				e.preventDefault();
				inputRef.current?.focus();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	return (
		<form onSubmit={handleSubmit} className="relative w-full max-w-sm">
			<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				ref={inputRef}
				type="text"
				value={term}
				onChange={(e) => setTerm(e.target.value)}
				placeholder="Search or paste a link..."
				className="h-9 w-full pl-9 pr-16 text-sm"
				autoComplete="off"
				autoCorrect="off"
				autoCapitalize="off"
				spellCheck={false}
			/>
			<kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 select-none items-center gap-0.5 border-[2px] border-foreground bg-muted px-1.5 py-0.5 text-[10px] font-bold text-foreground font-mono sm:flex">
				Ctrl+F
			</kbd>
		</form>
	);
}
