import { NextRequest } from "next/server";
import { requireUser, ok, fail, handleError } from "../../_lib/helpers";
import {
	enqueueSeparation,
	getJobStatus,
	type StemMode,
} from "@/lib/queue/stems";
import {
	getSeparationWithFiles,
	getSeparation,
	upsertPendingSeparation,
} from "@/lib/repositories/stems";
import { findHighestStored } from "@/lib/repositories/storedTracks";

const VALID_MODES: ReadonlyArray<StemMode> = ["two_stems", "six_stems"];

// GET /api/v1/stems/[trackId] — return separation status + ready files.
// Returns 404 when the user has never requested this track.
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ trackId: string }> },
) {
	try {
		const userResult = await requireUser(request);
		if (userResult.error) return userResult.error;

		const { trackId } = await params;

		const separation = await getSeparationWithFiles(trackId);

		if (!separation) {
			return fail("NOT_FOUND", "No separation requested for this track.", 404);
		}

		// Live progress trumps stored progress while the worker is running:
		// the DB only gets bumped at major milestones, BullMQ has the fine grain.
		let progress = separation.progress;
		if (separation.status === "processing") {
			const jobStatus = await getJobStatus(trackId);
			if (jobStatus && jobStatus.progress > progress) {
				progress = jobStatus.progress;
			}
		}

		return ok({
			trackId: separation.trackId,
			status: separation.status,
			mode: separation.mode,
			progress,
			errorMessage: separation.errorMessage,
			files: separation.files.map((f) => ({
				stemName: f.stemName,
				fileSize: f.fileSize,
			})),
		});
	} catch (e) {
		return handleError(e);
	}
}

// POST /api/v1/stems/[trackId] — enqueue separation for a track.
// Body: { mode: "two_stems" | "six_stems" }
//
// Idempotent: if a separation already exists in a non-failed state, return it
// untouched. If it failed previously, retrying re-enqueues from scratch.
export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ trackId: string }> },
) {
	try {
		const userResult = await requireUser(request);
		if (userResult.error) return userResult.error;

		const { trackId } = await params;
		const body = await request.json().catch(() => null);
		const mode = body?.mode as StemMode | undefined;

		if (!mode || !VALID_MODES.includes(mode)) {
			return fail(
				"INVALID_BODY",
				`mode must be one of: ${VALID_MODES.join(", ")}`,
				400,
			);
		}

		// Track must exist in the cache before we can separate it. Without this
		// check the worker would pull a job it can't fulfill and fail noisily.
		const stored = await findHighestStored(trackId);
		if (!stored) {
			return fail(
				"TRACK_NOT_CACHED",
				"This track has not been streamed yet. Play it once to cache it before requesting stems.",
				409,
			);
		}

		const existing = await getSeparation(trackId);

		// Already done or in progress — return current state without re-queueing.
		if (existing && existing.status !== "failed") {
			return ok(
				{
					trackId,
					status: existing.status,
					mode: existing.mode,
					progress: existing.progress,
				},
				existing.status === "completed" ? 200 : 202,
			);
		}

		const separation = await upsertPendingSeparation(trackId, mode);

		await enqueueSeparation(trackId, mode);

		return ok(
			{
				trackId: separation.trackId,
				status: separation.status,
				mode: separation.mode,
				progress: separation.progress,
			},
			202,
		);
	} catch (e) {
		return handleError(e);
	}
}
