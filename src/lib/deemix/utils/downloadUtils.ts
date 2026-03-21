import type { Tags } from "../types/Settings";
import type Track from "../types/Track";
import type { StorageProvider } from "../storage/StorageProvider";
import { OverwriteOption } from "../settings";
import { tagFLAC, tagID3 } from "../tagger";

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

	// Overwrite only lower bitrates
	if (
		trackAlreadyDownloaded &&
		overwriteFile === OverwriteOption.ONLY_LOWER_BITRATES &&
		extension === ".mp3"
	) {
		const fileSize = await storageProvider.getFileSize(writepath);
		const fileSizeKb = (fileSize * 8) / 1024;
		const bitrateAprox = fileSizeKb / track.duration;
		if (Number(track.bitrate) === 3 && bitrateAprox < 310) {
			return true;
		}
	}

	return !trackAlreadyDownloaded;
};

export const tagTrack = (
	extension: string,
	writepath: string,
	track,
	tags: Tags
) => {
	if (extension === ".mp3") {
		tagID3(writepath, track, tags);
	} else if (extension === ".flac") {
		tagFLAC(writepath, track, tags);
	}
};
