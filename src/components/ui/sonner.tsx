"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * Brutalist-styled Sonner Toaster. Black borders, no rounded corners,
 * matches the rest of the design system.
 */
export function Toaster(props: ToasterProps) {
	return (
		<Sonner
			position="bottom-center"
			offset={{ bottom: "calc(100px + env(safe-area-inset-bottom))" }}
			gap={8}
			toastOptions={{
				classNames: {
					toast:
						"!bg-card !text-foreground !border-[3px] !border-foreground !shadow-[var(--shadow-brutal)] !rounded-none font-mono",
					title: "!font-bold !text-[13px] !tracking-tight",
					description: "!text-[11px] !text-muted-foreground",
					actionButton:
						"!bg-foreground !text-background !rounded-none !font-mono !text-[10px] !font-black !uppercase !tracking-wider !border-2 !border-foreground !px-3 !py-1.5",
					cancelButton:
						"!bg-transparent !text-muted-foreground !rounded-none !font-mono !text-[10px] !font-black !uppercase !tracking-wider !border-2 !border-transparent hover:!border-foreground !px-3 !py-1.5",
					closeButton:
						"!bg-card !text-foreground !border-2 !border-foreground !rounded-none",
					error: "!border-destructive !text-destructive",
					success: "!border-foreground",
				},
			}}
			{...props}
		/>
	);
}
