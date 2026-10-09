"use client";

import { RotateCw, WifiOff } from "lucide-react";
import { Medallion } from "@/components/expressive";
import { tonalButton } from "@/components/playlists/PlaylistDialogs";

/** A page that couldn't load (network, server) — not the same as "not found": offer to try again. */
export function LoadFailed({ what, onRetry }: { what: string; onRetry: () => void }) {
	return (
		<Medallion
			icon={WifiOff}
			title={`Couldn't load this ${what}`}
			message="Check your connection and try again."
			className="mt-10"
			action={
				<button type="button" onClick={onRetry} className={tonalButton}>
					<RotateCw />
					Try again
				</button>
			}
		/>
	);
}
