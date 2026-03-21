"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isValidURL } from "@/utils/helpers";
import { postToServer } from "@/utils/api";
import { useLoginStore } from "@/stores/useLoginStore";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function SearchBar() {
	const [term, setTerm] = useState("");
	const router = useRouter();
	const inputRef = useRef<HTMLInputElement>(null);
	const loggedIn = useLoginStore((s) => s.loggedIn);

	const handleSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			if (!term.trim()) return;

			// If it's a URL, add to queue directly
			if (isValidURL(term)) {
				if (loggedIn) {
					postToServer("add-to-queue", { url: term, bitrate: null }).catch(() => {});
					setTerm("");
				}
				return;
			}

			// Otherwise, navigate to search
			router.push(`/search?term=${encodeURIComponent(term.trim())}`);
		},
		[term, router, loggedIn]
	);

	// CTRL+F keyboard shortcut to focus search
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
			<Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				ref={inputRef}
				type="text"
				value={term}
				onChange={(e) => setTerm(e.target.value)}
				placeholder="Search or paste a link..."
				className="h-8 w-full rounded-lg border-input bg-muted/40 pl-8 pr-16 text-sm placeholder:text-muted-foreground/70 focus-visible:bg-background"
			/>
			<kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 select-none items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:flex">
				Ctrl+F
			</kbd>
		</form>
	);
}
