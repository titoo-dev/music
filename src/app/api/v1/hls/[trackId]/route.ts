import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, fail, handleError } from "../../_lib/helpers";
import { headObject } from "@/lib/s3-stream";

// Target segment duration in seconds
const TARGET_SEGMENT_DURATION = 10;

// GET /api/v1/hls/[trackId] — HLS manifest (.m3u8) with byte-range segments
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ trackId: string }> }
) {
	try {
		const userResult = await requireUser(request);
		if (userResult.error) return userResult.error;

		const { trackId } = await params;

		const download = await prisma.downloadHistory.findUnique({
			where: { userId_trackId: { userId: userResult.userId, trackId } },
			include: { storedTrack: true },
		});

		if (!download) {
			return fail("NOT_FOUND", "Track not found in your downloads.", 404);
		}

		const storagePath = download.storedTrack?.storagePath ?? download.storagePath;
		const storageType = download.storedTrack?.storageType ?? download.storageType;

		if (!storagePath) {
			return fail("NO_FILE", "No file path recorded for this track.", 404);
		}

		if (storageType !== "s3") {
			return fail("UNSUPPORTED_STORAGE", "Only S3 storage is supported.", 400);
		}

		// Duration from query param (provided by client from Zustand store)
		const url = new URL(request.url);
		const durationParam = url.searchParams.get("duration");

		// File size: prefer DB value, fall back to S3 HEAD
		const dbFileSize = download.storedTrack?.fileSize ?? download.fileSize;
		let fileSize = dbFileSize ?? 0;
		let contentType = "audio/mpeg";

		if (!fileSize) {
			const head = await headObject(storagePath);
			fileSize = head.contentLength;
			contentType = head.contentType;
		} else {
			// Infer content type from path
			const ext = storagePath.split(".").pop()?.toLowerCase();
			if (ext === "flac") contentType = "audio/flac";
			else if (ext === "mp4") contentType = "audio/mp4";
		}

		if (!fileSize) {
			return fail("UNKNOWN_SIZE", "Cannot determine file size.", 500);
		}

		// Duration estimation: prefer explicit param, else derive from bitrate
		const bitrate = download.storedTrack?.bitrate ?? download.bitrate; // kbps
		let totalDuration: number;

		if (durationParam) {
			totalDuration = parseFloat(durationParam);
		} else if (bitrate > 0) {
			// bytes / (kbps * 125) = seconds
			totalDuration = fileSize / (bitrate * 125);
		} else {
			// Fallback: assume 4 minutes
			totalDuration = 240;
		}

		// Calculate segment count and sizes
		const segmentCount = Math.max(1, Math.round(totalDuration / TARGET_SEGMENT_DURATION));
		const bytesPerSegment = Math.ceil(fileSize / segmentCount);
		const durationPerSegment = totalDuration / segmentCount;

		// Stream URL (existing route supports byte-range requests)
		const streamUrl = `/api/v1/stream/${trackId}`;

		const lines: string[] = [
			"#EXTM3U",
			"#EXT-X-VERSION:4",
			`#EXT-X-TARGETDURATION:${Math.ceil(durationPerSegment)}`,
			"#EXT-X-MEDIA-SEQUENCE:0",
			`#EXT-X-PLAYLIST-TYPE:VOD`,
		];

		for (let i = 0; i < segmentCount; i++) {
			const offset = i * bytesPerSegment;
			const isLast = i === segmentCount - 1;
			const length = isLast ? fileSize - offset : bytesPerSegment;
			const segDuration = isLast
				? totalDuration - i * durationPerSegment
				: durationPerSegment;

			lines.push(`#EXTINF:${segDuration.toFixed(3)},`);
			lines.push(`#EXT-X-BYTERANGE:${length}@${offset}`);
			lines.push(streamUrl);
		}

		lines.push("#EXT-X-ENDLIST");

		return new Response(lines.join("\n"), {
			status: 200,
			headers: {
				"Content-Type": "application/vnd.apple.mpegurl",
				"Cache-Control": "private, max-age=300",
				"Access-Control-Allow-Origin": "*",
			},
		});
	} catch (e) {
		return handleError(e);
	}
}
