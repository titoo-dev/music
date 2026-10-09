import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, ok, fail, handleError } from "../_lib/helpers";
import { shareTrack } from "@/lib/library";
import { sanitizeShareMeta, type ShareMeta } from "@/lib/share-meta";
import { restoreUserDz } from "@/lib/deezer-session";

/** Longest share link lifetime: a year. */
const MAX_EXPIRY_HOURS = 24 * 365;

/**
 * The track's metadata as Deezer has it, read with the sharer's session.
 * Null without a session or when Deezer doesn't know the id (uploads,
 * API down): the client's metadata is used then.
 */
async function deezerShareMeta(userId: string, trackId: string): Promise<ShareMeta | null> {
	try {
		const restored = await restoreUserDz(userId);
		if (restored.status !== "ok") return null;
		const t = await restored.dz.api.getTrack(trackId);
		const meta = sanitizeShareMeta({
			title: t?.title,
			artist: t?.artist?.name,
			album: t?.album?.title,
			coverUrl: t?.album?.cover_medium,
			duration: t?.duration,
		});
		return meta.title && meta.artist ? meta : null;
	} catch {
		return null;
	}
}

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

		// Hours until expiry; null / absent = permanent link.
		const expiresIn = body?.expiresIn ?? null;
		if (expiresIn !== null && !(typeof expiresIn === "number" && expiresIn > 0 && expiresIn <= MAX_EXPIRY_HOURS)) {
			return fail("INVALID_EXPIRY", `expiresIn must be a number of hours between 0 and ${MAX_EXPIRY_HOURS}, or null.`, 400);
		}

		// Shown on a public page and fetched by the OG renderer: taken from
		// Deezer when it knows the track, else the client's, trimmed, capped
		// and with the cover limited to Deezer artwork.
		const meta = (await deezerShareMeta(userResult.userId, trackId)) ?? sanitizeShareMeta(body);
		if (!meta.title || !meta.artist) {
			return fail("MISSING_METADATA", "title and artist are required.", 400);
		}

		// Reuse this user's live share for the same track; expired ones are
		// dropped (they would otherwise come back as a dead link forever and
		// keep anchoring the cached file).
		const now = new Date();
		const findLive = () =>
			prisma.sharedTrack.findFirst({
				where: {
					userId: userResult.userId,
					trackId,
					OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
				},
			});
		const existing = await findLive();
		if (existing) return ok(existing);
		await prisma.sharedTrack.deleteMany({
			where: { userId: userResult.userId, trackId, expiresAt: { lte: now } },
		});

		const expiresAt = expiresIn === null ? null : new Date(Date.now() + expiresIn * 60 * 60 * 1000);

		let shared;
		try {
			shared = await shareTrack(userResult.userId, { trackId, ...meta }, { expiresAt });
		} catch (e) {
			// (userId, trackId) is unique: a concurrent request (double tap,
			// two devices) created the link first — answer that one.
			const winner = (e as { code?: string })?.code === "P2002" ? await findLive() : null;
			if (winner) return ok(winner);
			throw e;
		}

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
