import { NextRequest } from "next/server";
import { requireUser, ok, handleError } from "../../../_lib/helpers";
import { unsaveTrack, isTrackSaved } from "@/lib/library";

// GET /api/v1/library/tracks/[trackId] — is this track saved?
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ trackId: string }> }
) {
	try {
		const userResult = await requireUser(request);
		if (userResult.error) return userResult.error;

		const { trackId } = await params;
		const saved = await isTrackSaved(userResult.userId, trackId);
		return ok({ saved });
	} catch (e) {
		return handleError(e);
	}
}

// DELETE /api/v1/library/tracks/[trackId] — remove from library + cleanup
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ trackId: string }> }
) {
	try {
		const userResult = await requireUser(request);
		if (userResult.error) return userResult.error;

		const { trackId } = await params;
		await unsaveTrack(userResult.userId, trackId);
		return ok({ unsaved: true });
	} catch (e) {
		return handleError(e);
	}
}
