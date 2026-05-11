import { NextRequest } from "next/server";
import { requireUser, ok, fail, handleError } from "../../_lib/helpers";
import { followArtist, listFollowedArtists } from "@/lib/library";

// GET /api/v1/library/artists — list the user's followed artists.
export async function GET(request: NextRequest) {
	try {
		const userResult = await requireUser(request);
		if (userResult.error) return userResult.error;

		const items = await listFollowedArtists(userResult.userId);
		return ok({ items });
	} catch (e) {
		return handleError(e);
	}
}

// POST /api/v1/library/artists — follow an artist (upsert by deezerArtistId).
export async function POST(request: NextRequest) {
	try {
		const userResult = await requireUser(request);
		if (userResult.error) return userResult.error;

		const body = await request.json().catch(() => null);
		if (
			!body ||
			typeof body.deezerArtistId !== "string" ||
			!body.deezerArtistId ||
			typeof body.name !== "string"
		) {
			return fail(
				"INVALID_BODY",
				"deezerArtistId and name are required.",
				400
			);
		}

		const followed = await followArtist(userResult.userId, {
			deezerArtistId: body.deezerArtistId,
			name: body.name,
			pictureUrl: body.pictureUrl ?? null,
		});
		return ok({ followed });
	} catch (e) {
		return handleError(e);
	}
}
