"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { isValidURL } from "@/utils/helpers";
import { postToServer } from "@/utils/api";
import { useLoginStore } from "@/stores/useLoginStore";

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

	return (
		<header
			className="sticky top-0 z-10 px-6 py-3 flex items-center"
			style={{ background: "var(--bg-main)", borderBottom: "1px solid var(--border)" }}
		>
			<form onSubmit={handleSubmit} className="flex-1 max-w-xl">
				<input
					ref={inputRef}
					type="text"
					value={term}
					onChange={(e) => setTerm(e.target.value)}
					placeholder="Search or paste a link..."
					className="input"
				/>
			</form>
		</header>
	);
}
