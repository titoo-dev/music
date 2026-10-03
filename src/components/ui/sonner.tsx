"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * Toasts as M3 snackbars: inverse surface (onSurface fill, surface ink),
 * rounded-2xl, bold action in the inverse-primary (primaryContainer) tone.
 * Sits just above the floating player pill.
 */
export function Toaster(props: ToasterProps) {
	return (
		<Sonner
			position="bottom-center"
			offset={{ bottom: "calc(var(--player-h) + var(--player-offset) + 12px)" }}
			mobileOffset={{ bottom: "calc(var(--player-h) + var(--player-offset) + 10px)" }}
			gap={8}
			toastOptions={{
				classNames: {
					toast:
						"!bg-foreground !text-background !border-0 !rounded-2xl !shadow-[0_12px_32px_-8px_rgb(0_0_0/0.45)] !px-4 !py-3.5 !gap-3 font-sans",
					title: "!font-semibold !text-sm !tracking-[-0.005em]",
					description: "!text-[13px] !text-background/70",
					icon: "!text-[color:var(--m3-primary-container)]",
					actionButton:
						"!bg-transparent !text-[color:var(--m3-primary-container)] !rounded-full !text-sm !font-bold !px-3 !h-9 hover:!bg-background/10",
					cancelButton:
						"!bg-transparent !text-background/70 hover:!bg-background/10 hover:!text-background !rounded-full !text-sm !font-semibold !px-3 !h-9",
					closeButton:
						"!bg-foreground !text-background/70 hover:!text-background !border-0 !rounded-full",
					error: "[&_[data-icon]]:!text-[#ffb4ab] dark:[&_[data-icon]]:!text-[#ba1a1a]",
					success: "[&_[data-icon]]:!text-[color:var(--m3-primary-container)]",
				},
			}}
			{...props}
		/>
	);
}
