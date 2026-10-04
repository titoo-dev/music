"use client";

import { DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";

/**
 * The gapless toggle of the player menus. Crossfade overlaps tracks instead,
 * so gapless waits while one is set — said under the label.
 */
export function GaplessMenuItem({ on, crossfade, onToggle }: { on: boolean; crossfade: boolean; onToggle: () => void }) {
	return (
		<DropdownMenuCheckboxItem checked={on} onClick={onToggle} className="rounded-xl py-2">
			<span className="flex flex-col gap-0.5">
				<span>Gapless playback</span>
				{on && crossfade && <span className="text-[11px] font-normal text-muted-foreground">Paused while crossfade is on</span>}
			</span>
		</DropdownMenuCheckboxItem>
	);
}
