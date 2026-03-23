import { cache } from "react";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { SharePlayer } from "./SharePlayer";

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
		return { title: "Track not found — deemix" };
	}

	if (shared.expiresAt && shared.expiresAt < new Date()) {
		return { title: "This share link has expired — deemix" };
	}

	const title = `${shared.title} — ${shared.artist}`;

	return {
		title: `${title} | deemix`,
		description: `Listen to ${shared.title} by ${shared.artist} on deemix`,
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

export default async function SharePage({ params }: Props) {
	const { shareId } = await params;
	const shared = await getSharedTrack(shareId);

	if (!shared) {
		notFound();
	}

	if (shared.expiresAt && shared.expiresAt < new Date()) {
		notFound();
	}

	return (
		<SharePlayer
			shareId={shared.shareId}
			title={shared.title}
			artist={shared.artist}
			album={shared.album}
			coverUrl={shared.coverUrl}
			duration={shared.duration}
			sharedBy={shared.user.name}
		/>
	);
}
