"use client";

import * as React from "react";
import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "lucide-react";

const Collapsible = CollapsiblePrimitive.Root;

function CollapsibleTrigger({
	className,
	children,
	...props
}: CollapsiblePrimitive.Trigger.Props) {
	return (
		<CollapsiblePrimitive.Trigger
			data-slot="collapsible-trigger"
			className={cn(
				"flex w-full items-center justify-between text-sm font-medium transition-colors hover:text-foreground [&[data-panel-open]>svg]:rotate-180",
				className
			)}
			{...props}
		>
			{children}
			<ChevronDownIcon className="size-4 shrink-0 text-muted-foreground transition-transform duration-200" />
		</CollapsiblePrimitive.Trigger>
	);
}

function CollapsibleContent({
	className,
	...props
}: CollapsiblePrimitive.Panel.Props) {
	return (
		<CollapsiblePrimitive.Panel
			data-slot="collapsible-content"
			className={cn(
				"overflow-hidden transition-all data-[ending-style]:h-0 data-[starting-style]:h-0",
				className
			)}
			{...props}
		/>
	);
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
