import type { Tags } from "../types/Settings";
import type Track from "../types/Track";
import type { StorageProvider } from "../storage/StorageProvider";
import { OverwriteOption } from "../settings";
import { TrackFormats } from "@/lib/deezer";
import { tagFLAC, tagID3 } from "../tagger";

// Numeric quality rank for bitrate comparison (higher = better)
const BITRATE_RANK: Record<number, number> = {
	[TrackFormats.MP3_128]: 1,
	[TrackFormats.MP3_320]: 2,
	[TrackFormats.FLAC]: 3,
	[TrackFormats.MP4_RA1]: 4,
	[TrackFormats.MP4_RA2]: 5,
	[TrackFormats.MP4_RA3]: 6,
};

function estimateBitrateFromFile(fileSize: number, duration: number): number {
	if (duration <= 0) return 0;
	return (fileSize * 8) / 1024 / duration; // kbps
}

function guessFormatRank(extension: string, fileSize: number, duration: number): number {
	if (extension === ".flac") return BITRATE_RANK[TrackFormats.FLAC];
	if (extension === ".mp4" || extension === ".m4a") return BITRATE_RANK[TrackFormats.MP4_RA1];
	// MP3 — estimate bitrate to distinguish 128 vs 320
	const kbps = estimateBitrateFromFile(fileSize, duration);
	if (kbps >= 310) return BITRATE_RANK[TrackFormats.MP3_320];
	return BITRATE_RANK[TrackFormats.MP3_128];
}

export const checkShouldDownload = async (
	filename: string,
	filepath: string,
	extension: string,
	writepath: string,
	overwriteFile: string,
	track: Track,
	storageProvider: StorageProvider
) => {
	if (
		overwriteFile === OverwriteOption.OVERWRITE ||
		overwriteFile === OverwriteOption.KEEP_BOTH
	)
		return true;

	const trackAlreadyDownloaded = await storageProvider.exists(writepath);

	if (
		trackAlreadyDownloaded &&
		overwriteFile === OverwriteOption.DONT_OVERWRITE
	)
		return false;

	// Don't overwrite and don't mind extension
	if (
		!trackAlreadyDownloaded &&
		overwriteFile === OverwriteOption.DONT_CHECK_EXT
	) {
		const extensions = [".mp3", ".flac", ".opus", ".m4a"];
		const baseFilename = `${filepath}/${filename}`;

		for (const ext of extensions) {
			if (await storageProvider.exists(baseFilename + ext)) return false;
		}
	}

	// Overwrite only lower bitrates — check all possible existing formats
	if (overwriteFile === OverwriteOption.ONLY_LOWER_BITRATES) {
		const requestedRank = BITRATE_RANK[Number(track.bitrate)] || 0;
		const baseFilename = `${filepath}/${filename}`;
		const extensionsToCheck = [".mp3", ".flac", ".m4a", ".mp4"];

		for (const ext of extensionsToCheck) {
			const existingPath = baseFilename + ext;
			if (await storageProvider.exists(existingPath)) {
				const fileSize = await storageProvider.getFileSize(existingPath);
				const existingRank = guessFormatRank(ext, fileSize, track.duration);
				if (requestedRank > existingRank) {
					return true; // New format is higher quality — overwrite
				}
				return false; // Existing is same or better — skip
			}
		}
	}

	return !trackAlreadyDownloaded;
};

export const tagTrack = async (
	extension: string,
	writepath: string,
	track: Track,
	tags: Tags
) => {
	if (extension === ".mp3") {
		await tagID3(writepath, track, tags);
	} else if (extension === ".flac") {
		await tagFLAC(writepath, track, tags);
	}
};
