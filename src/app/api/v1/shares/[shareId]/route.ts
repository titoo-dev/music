import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleError, requireUser } from "../../_lib/helpers";

// GET /api/v1/shares/[shareId] — Get shared track metadata (public, no auth required)
export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ shareId: string }> }
) {
	try {
		const { shareId } = await params;

		const shared = await prisma.sharedTrack.findUnique({
			where: { shareId },
			select: {
				shareId: true,
				title: true,
				artist: true,
				album: true,
				coverUrl: true,
				duration: true,
				plays: true,
				createdAt: true,
				expiresAt: true,
				user: { select: { name: true, image: true } },
			},
		});

		if (!shared) {
			return fail("NOT_FOUND", "Shared track not found.", 404);
		}

		if (shared.expiresAt && shared.expiresAt < new Date()) {
			return fail("EXPIRED", "This share link has expired.", 410);
		}

		return ok(shared);
	} catch {
		return fail("INTERNAL_ERROR", "An unexpected error occurred.", 500);
	}
}

// DELETE /api/v1/shares/[shareId] — Revoke a share link (requires auth, owner only)
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ shareId: string }> }
) {
	try {
		const userResult = await requireUser(request);
		if (userResult.error) return userResult.error;

		const { shareId } = await params;

		const shared = await prisma.sharedTrack.findUnique({
			where: { shareId },
		});

		if (!shared) {
			return fail("NOT_FOUND", "Shared track not found.", 404);
		}

		if (shared.userId !== userResult.userId) {
			return fail("FORBIDDEN", "You can only revoke your own share links.", 403);
		}

		await prisma.sharedTrack.delete({ where: { shareId } });

		return ok({ deleted: true });
	} catch (e: unknown) {
		return handleError(e);
	}
}
