import { NextRequest } from "next/server";
import { ok, fail, handleError, requireUser } from "../../_lib/helpers";
import { getSharePublicMeta, deleteShare } from "@/lib/repositories/shares";

// GET /api/v1/shares/[shareId] — Get shared track metadata (public, no auth required)
export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ shareId: string }> }
) {
	try {
		const { shareId } = await params;

		const shared = await getSharePublicMeta(shareId);

		if (!shared) {
			return fail("NOT_FOUND", "Shared track not found.", 404);
		}

		if (shared.expiresAt && shared.expiresAt < Date.now()) {
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

		const deleted = await deleteShare(userResult.userId, shareId);
		if (!deleted) {
			return fail("NOT_FOUND", "Shared track not found.", 404);
		}

		return ok({ deleted: true });
	} catch (e: unknown) {
		return handleError(e);
	}
}
