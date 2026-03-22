import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleError, requireUser } from "../../_lib/helpers";

// POST /api/v1/downloads/check-batch — Check multiple tracks at once
export async function POST(request: NextRequest) {
	try {
		const userResult = await requireUser(request);
		if (userResult.error) return userResult.error;

		const { trackIds } = await request.json();
		if (!Array.isArray(trackIds) || trackIds.length === 0) {
			return fail("MISSING_TRACK_IDS", "trackIds array is required.", 400);
		}

		// Limit batch size
		const ids = trackIds.slice(0, 500).map(String);

		const downloaded = await prisma.downloadHistory.findMany({
			where: {
				userId: userResult.userId,
				trackId: { in: ids },
			},
			select: { trackId: true, downloadedAt: true },
		});

		const downloadedMap: Record<string, string> = {};
		for (const d of downloaded) {
			downloadedMap[d.trackId] = d.downloadedAt.toISOString();
		}

		return ok({ downloaded: downloadedMap });
	} catch (e) {
		return handleError(e);
	}
}
