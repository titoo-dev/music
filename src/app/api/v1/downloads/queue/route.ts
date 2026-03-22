import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleError, requireApp, requireDeezerAndApp } from "../../_lib/helpers";

// GET /api/v1/downloads/queue — Fetch current download queue
export async function GET() {
	try {
		const { app, error } = await requireApp();
		if (error) return error;

		return ok(app.getQueue());
	} catch (e) {
		return handleError(e);
	}
}

// POST /api/v1/downloads/queue — Add URL(s) to download queue
export async function POST(request: NextRequest) {
	try {
		const { userId, dz, app, error } = await requireDeezerAndApp(request);
		if (error) return error;

		const { url, bitrate } = await request.json();

		if (!url) {
			return fail("MISSING_URL", "A URL or array of URLs is required.", 400);
		}

		// Check for already-downloaded tracks (single track URLs only)
		const urls = Array.isArray(url) ? url : [url];
		for (const u of urls) {
			const trackMatch = String(u).match(/deezer\.com\/(?:\w+\/)?track\/(\d+)/);
			if (trackMatch) {
				const trackId = trackMatch[1];
				const existing = await prisma.downloadHistory.findUnique({
					where: { userId_trackId: { userId, trackId } },
				});
				if (existing) {
					return fail(
						"ALREADY_DOWNLOADED",
						`Track "${existing.title}" by ${existing.artist} was already downloaded on ${existing.downloadedAt.toLocaleDateString()}.`,
						409
					);
				}
			}
		}

		const effectiveBitrate = bitrate ?? app.settings.maxBitrate;

		const result = await app.addToQueue(dz, urls, effectiveBitrate, false, userId);
		return ok(result);
	} catch (e) {
		return handleError(e);
	}
}
