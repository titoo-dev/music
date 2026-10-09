"use client";

import { Fragment, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { albumHref, artistHref } from "@/lib/entity-links";
import { leaveOverlays, useOverlayStack } from "@/lib/overlay-history";

type Id = string | number | null | undefined;

interface EntityLinkProps {
	className?: string;
	/** Runs after navigation starts (e.g. close the sheet / panel the link sits in). Skipped for new-tab clicks. */
	onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
	children?: ReactNode;
}

/** A plain left click (Ctrl / ⌘ / Shift / middle clicks open a new tab or window and leave this one as it is). */
export function isPlainClick(e: MouseEvent) {
	return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}

/**
 * A link that may sit in an overlay owning a history entry (Now Playing, ⌘K…):
 * it replaces that entry rather than pushing past it, and the overlay closes
 * without going Back (which would race the navigation).
 */
export function useOverlayLink(onClick?: (e: MouseEvent<HTMLAnchorElement>) => void) {
	const inOverlay = useOverlayStack((s) => s.ids.length > 0);
	return {
		replace: inOverlay,
		onClick: (e: MouseEvent<HTMLAnchorElement>) => {
			if (!isPlainClick(e)) return;
			if (inOverlay) leaveOverlays(() => onClick?.(e));
			else onClick?.(e);
		},
	};
}

function EntityLink({ href, label, className, onClick, children }: EntityLinkProps & { href: string | null; label: string }) {
	const link = useOverlayLink(onClick);
	if (!href) return <span className={className}>{children ?? label}</span>;
	return (
		<Link
			href={href}
			replace={link.replace}
			// Rows and tiles around these names play / open on click — keep the name's own target.
			onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && e.stopPropagation()}
			onClick={(e) => {
				e.stopPropagation();
				link.onClick(e);
			}}
			className={cn("no-underline decoration-from-font underline-offset-2 hover:underline focus-visible:underline", className)}
		>
			{children ?? label}
		</Link>
	);
}

/** An artist name that opens the artist page (by Deezer id, else by name). */
export function ArtistLink({ id, name, ...rest }: EntityLinkProps & { id?: Id; name: string }) {
	return <EntityLink href={artistHref(id, name)} label={name} {...rest} />;
}

/** An album title that opens the album page (by Deezer id, else by title + artist). */
export function AlbumLink({ id, title, artist, ...rest }: EntityLinkProps & { id?: Id; title: string; artist?: string | null }) {
	return <EntityLink href={albumHref(id, title, artist)} label={title} {...rest} />;
}

/** A credit line of several artists, each one its own link. */
export function ArtistLinks({ artists, separator = ", ", className, onClick }: { artists: Array<{ id?: Id; name: string }>; separator?: string; className?: string; onClick?: EntityLinkProps["onClick"] }) {
	return (
		<>
			{artists.map((a, i) => (
				<Fragment key={`${a.id ?? a.name}-${i}`}>
					{i > 0 && separator}
					<ArtistLink id={a.id} name={a.name} className={className} onClick={onClick} />
				</Fragment>
			))}
		</>
	);
}
