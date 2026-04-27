import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, ok, fail, handleError } from "../_lib/helpers";
import { shareTrack } from "@/lib/library";

// POST /api/v1/shares — create a public share link for a track.
// No download requirement: the share creates with storedTrackId=null when
// the file isn't yet persisted. The public stream route lazily re-fetches
// via the progressive engine using the share creator's stored ARL.
export async function POST(request: NextRequest) {
	try {
		const userResult = await requireUser(request);
		if (userResult.error) return userResult.error;

		const body = await request.json().catch(() => null);
		const trackId = body?.trackId ? String(body.trackId) : "";
		if (!trackId) {
			return fail("MISSING_TRACK_ID", "trackId is required.", 400);
		}

		// Reuse an existing share by this user for the same track if any
		const existing = await prisma.sharedTrack.findFirst({
			where: { userId: userResult.userId, trackId },
		});
		if (existing) return ok(existing);

		const expiresAt = body?.expiresIn
			? new Date(Date.now() + Number(body.expiresIn) * 60 * 60 * 1000)
			: null;

		const shared = await shareTrack(
			userResult.userId,
			{
				trackId,
				title: String(body?.title || ""),
				artist: String(body?.artist || ""),
				album: body?.album ?? null,
				coverUrl: body?.coverUrl ?? null,
				duration: body?.duration ?? null,
			},
			{ expiresAt }
		);

		return ok(shared, 201);
	} catch (e) {
		return handleError(e);
	}
}

// GET /api/v1/shares — list user's share links
export async function GET(request: NextRequest) {
	try {
		const userResult = await requireUser(request);
		if (userResult.error) return userResult.error;

		const shares = await prisma.sharedTrack.findMany({
			where: { userId: userResult.userId },
			orderBy: { createdAt: "desc" },
		});
		return ok(shares);
	} catch (e) {
		return handleError(e);
	}
}
