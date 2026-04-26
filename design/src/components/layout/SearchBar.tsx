"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isValidURL } from "@/utils/helpers";
import { useDownload } from "@/hooks/useDownload";
import { useAuthStore } from "@/stores/useAuthStore";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function SearchBar() {
	const searchParams = useSearchParams();
	const [term, setTerm] = useState(searchParams.get("term") ?? "");
	const router = useRouter();

	useEffect(() => {
		setTerm(searchParams.get("term") ?? "");
	}, [searchParams]);
	const inputRef = useRef<HTMLInputElement>(null);
	const loggedIn = useAuthStore((s) => s.isDeezerConnected);
	const { download } = useDownload();

	const handleSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			if (!term.trim()) return;

			if (isValidURL(term)) {
				if (loggedIn) {
					download(term);
					setTerm("");
				}
				return;
			}

			router.push(`/search?term=${encodeURIComponent(term.trim())}`);
		},
		[term, router, loggedIn, download]
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
