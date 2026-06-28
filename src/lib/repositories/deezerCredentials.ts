// Repository deezerCredential — Convex (Postgres supprimé, Phase 6).

import { getConvexClient } from "@/lib/convex/server";
import { api } from "@convex/_generated/api";

export interface DeezerCredentialInput {
	arl: string;
	deezerUserId?: number | null;
	deezerUserName?: string | null;
	deezerPicture?: string | null;
	canStreamHq?: boolean;
	canStreamLossless?: boolean;
}

export async function getDeezerCredential(userId: string) {
	return getConvexClient().query(api.deezerCredentials.get, { userId });
}

export async function upsertDeezerCredential(
	userId: string,
	input: DeezerCredentialInput,
): Promise<void> {
	await getConvexClient().mutation(api.deezerCredentials.upsert, {
		userId,
		arl: input.arl,
		deezerUserId: input.deezerUserId ?? null,
		deezerUserName: input.deezerUserName ?? null,
		deezerPicture: input.deezerPicture ?? null,
		canStreamHq: input.canStreamHq ?? false,
		canStreamLossless: input.canStreamLossless ?? false,
	});
}
