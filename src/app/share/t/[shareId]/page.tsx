import { cache } from "react";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock3 } from "lucide-react";
import { SharePlayer } from "./SharePlayer";
import { safeCoverUrl } from "@/lib/share-meta";

interface Props {
	params: Promise<{ shareId: string }>;
}

const getSharedTrack = cache((shareId: string) =>
	prisma.sharedTrack.findUnique({
		where: { shareId },
		select: {
			shareId: true,
			title: true,
			artist: true,
			album: true,
			coverUrl: true,
			duration: true,
			expiresAt: true,
			user: { select: { name: true } },
		},
	})
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { shareId } = await params;
	const shared = await getSharedTrack(shareId);

	if (!shared) {
		return { title: "Track not found — wavelet" };
	}

	if (shared.expiresAt && shared.expiresAt < new Date()) {
		return { title: "This share link has expired — wavelet" };
	}

	const title = `${shared.title} — ${shared.artist}`;

	return {
		title: `${title} | wavelet`,
		description: `Listen to ${shared.title} by ${shared.artist} on wavelet`,
		openGraph: {
			title,
			description: `Listen to ${shared.title} by ${shared.artist}`,
			type: "music.song",
		},
		twitter: {
			card: "summary_large_image",
			title,
			description: `Listen to ${shared.title} by ${shared.artist}`,
		},
	};
}

/** A link past its expiry: say so, rather than a bare 404. */
function ExpiredShare() {
	return (
		<main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-4 text-center">
			<span className="flex size-14 items-center justify-center rounded-full bg-surface-high text-muted-foreground">
				<Clock3 className="size-6" aria-hidden />
			</span>
			<h1 className="type-display text-3xl text-foreground">This link has expired</h1>
			<p className="max-w-[44ch] text-sm text-muted-foreground">
				The person who shared this track set it to stop working after a while. Ask them for a new link.
			</p>
			<Link
				href="/"
				className="mt-2 inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground no-underline transition-[transform,background-color] hover:bg-primary/90 active:scale-95"
			>
				Open wavelet
			</Link>
		</main>
	);
}

export default async function SharePage({ params }: Props) {
	const { shareId } = await params;
	const shared = await getSharedTrack(shareId);

	if (!shared) {
		notFound();
	}

	if (shared.expiresAt && shared.expiresAt < new Date()) {
		return <ExpiredShare />;
	}

	return (
		<SharePlayer
			shareId={shared.shareId}
			title={shared.title}
			artist={shared.artist}
			album={shared.album}
			coverUrl={safeCoverUrl(shared.coverUrl)}
			duration={shared.duration}
			sharedBy={shared.user.name}
		/>
	);
}
