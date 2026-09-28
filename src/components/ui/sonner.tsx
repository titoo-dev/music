"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * Minimal Sonner Toaster — hairline border, soft float shadow, sits just
 * above the floating player pill.
 */
export function Toaster(props: ToasterProps) {
	return (
		<Sonner
			position="bottom-center"
			offset={{ bottom: "calc(var(--player-h) + var(--player-offset) + 12px)" }}
			gap={8}
			toastOptions={{
				classNames: {
					toast:
						"!bg-popover !text-popover-foreground !border !border-border !shadow-float !rounded-xl font-sans",
					title: "!font-medium !text-[13px] !tracking-tight",
					description: "!text-xs !text-muted-foreground",
					actionButton:
						"!bg-primary !text-primary-foreground !rounded-md !text-xs !font-medium !px-2.5 !py-1 !h-7",
					cancelButton:
						"!bg-transparent !text-muted-foreground hover:!bg-accent hover:!text-foreground !rounded-md !text-xs !font-medium !px-2.5 !py-1 !h-7",
					closeButton:
						"!bg-popover !text-muted-foreground hover:!text-foreground !border !border-border !rounded-full",
					error: "[&_[data-icon]]:!text-destructive",
					success: "[&_[data-icon]]:!text-success",
				},
			}}
			{...props}
		/>
	);
}
