import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleError, requireUser } from "../../_lib/helpers";

// GET /api/v1/downloads/check?trackId=123 — Check if a track has been downloaded
export async function GET(request: NextRequest) {
	try {
		const userResult = await requireUser(request);
		if (userResult.error) return userResult.error;

		const trackId = new URL(request.url).searchParams.get("trackId");
		if (!trackId) {
			return fail("MISSING_TRACK_ID", "trackId query parameter is required.", 400);
		}

		const existing = await prisma.downloadHistory.findUnique({
			where: {
				userId_trackId: {
					userId: userResult.userId,
					trackId,
				},
			},
		});

		return ok({
			downloaded: !!existing,
			downloadedAt: existing?.downloadedAt ?? null,
		});
	} catch (e) {
		return handleError(e);
	}
}
