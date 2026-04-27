"use client";

import { useEffect, useState } from "react";
import { usePlayerStore } from "@/stores/usePlayerStore";

/**
 * Visually-hidden live region that announces track changes to screen readers.
 * Mounts once at the layout level. Aria-live="polite" so announcements don't
 * interrupt the user but are queued as the focus settles.
 */
export function TrackAnnouncer() {
	const currentTrack = usePlayerStore((s) => s.currentTrack);
	const [message, setMessage] = useState("");

	useEffect(() => {
		// Slight delay so screen readers don't speak over a click event
		const id = setTimeout(() => {
			if (!currentTrack) {
				setMessage("");
				return;
			}
			setMessage(`Now playing: ${currentTrack.title} by ${currentTrack.artist}`);
		}, 250);
		return () => clearTimeout(id);
	}, [currentTrack]);

	return (
		<div
			role="status"
			aria-live="polite"
			aria-atomic="true"
			className="sr-only"
		>
			{message}
		</div>
	);
}
