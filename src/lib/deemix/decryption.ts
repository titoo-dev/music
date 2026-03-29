import got, { ReadError, TimeoutError } from "got";
import fs from "fs";
import {
	_md5,
	_ecbCrypt,
	_ecbDecrypt,
	generateBlowfishKey,
	decryptChunk,
} from "./utils/crypto";
import { DownloadCanceled, DownloadEmpty, DownloadFailed } from "./errors";
import type { StorageProvider } from "./storage/StorageProvider";

import { USER_AGENT_HEADER, pipeline } from "./utils/index";

export function generateStreamPath(sngID, md5, mediaVersion, format) {
	let urlPart = md5 + "\xA4" + format + "\xA4" + sngID + "\xA4" + mediaVersion;
	const md5val = _md5(urlPart);
	let step2 = md5val + "\xA4" + urlPart + "\xA4";
	step2 += ".".repeat(16 - (step2.length % 16));
	urlPart = _ecbCrypt("jo6aey6haid2Teih", step2);
	return urlPart;
}

export function reverseStreamPath(urlPart) {
	const step2 = _ecbDecrypt("jo6aey6haid2Teih", urlPart);
	const [, md5, format, sngID, mediaVersion] = step2.split("\xA4");
	return [sngID, md5, mediaVersion, format];
}

export function generateCryptedStreamURL(sngID, md5, mediaVersion, format) {
	const urlPart = generateStreamPath(sngID, md5, mediaVersion, format);
	return "https://e-cdns-proxy-" + md5[0] + ".dzcdn.net/mobile/1/" + urlPart;
}

export function generateStreamURL(sngID, md5, mediaVersion, format) {
	const urlPart = generateStreamPath(sngID, md5, mediaVersion, format);
	return "https://cdns-proxy-" + md5[0] + ".dzcdn.net/api/1/" + urlPart;
}

export function reverseStreamURL(url) {
	const urlPart = url.slice(url.indexOf("/1/") + 3);
	return reverseStreamPath(urlPart);
}

const MAX_STREAM_RETRIES = 5;

export async function streamTrack(writepath, track, downloadObject, listener, storageProvider?: StorageProvider, _retryCount = 0) {
	if (downloadObject && downloadObject.isCanceled) throw new DownloadCanceled();
	const partPath = writepath + ".part";
	const headers = { "User-Agent": USER_AGENT_HEADER };
	let chunkLength = 0;
	let complete = 0;
	const isCryptedStream =
		track.downloadURL.includes("/mobile/") ||
		track.downloadURL.includes("/media/");
	let blowfishKey;
	const outputStream = storageProvider
		? storageProvider.createWriteStream(partPath)
		: fs.createWriteStream(partPath);
	let timeout = null;

	const itemData = {
		id: track.id,
		title: track.title,
		artist: track.mainArtist.name,
	};
	let error = "";

	if (isCryptedStream) blowfishKey = generateBlowfishKey(String(track.id));

	async function* decrypter(source) {
		let modifiedStream = Buffer.alloc(0);
		for await (const chunk of source) {
			if (!isCryptedStream) {
				yield chunk;
			} else {
				modifiedStream = Buffer.concat([modifiedStream, chunk]);
				while (modifiedStream.length >= 2048 * 3) {
					let decryptedChunks = Buffer.alloc(0);
					const decryptingChunks = modifiedStream.slice(0, 2048 * 3);
					modifiedStream = modifiedStream.slice(2048 * 3);
					if (decryptingChunks.length >= 2048) {
						decryptedChunks = decryptChunk(
							decryptingChunks.slice(0, 2048),
							blowfishKey
						);
						decryptedChunks = Buffer.concat([
							decryptedChunks,
							decryptingChunks.slice(2048),
						]);
					}
					yield decryptedChunks;
				}
			}
		}
		if (isCryptedStream) {
			let decryptedChunks = Buffer.alloc(0);
			if (modifiedStream.length >= 2048) {
				decryptedChunks = decryptChunk(
					modifiedStream.slice(0, 2048),
					blowfishKey
				);
				decryptedChunks = Buffer.concat([
					decryptedChunks,
					modifiedStream.slice(2048),
				]);
				yield decryptedChunks;
			} else {
				yield modifiedStream;
			}
		}
	}

	async function* depadder(source) {
		let isStart = true;
		for await (let chunk of source) {
			if (
				isStart &&
				chunk[0] === 0 &&
				chunk.slice(4, 8).toString() !== "ftyp"
			) {
				let i;
				for (i = 0; i < chunk.length; i++) {
					const byte = chunk[i];
					if (byte !== 0) break;
				}
				chunk = chunk.slice(i);
			}
			isStart = false;
			yield chunk;
		}
	}

	const request = got
		.stream(track.downloadURL, {
			headers,
			https: { rejectUnauthorized: false },
		})
		.on("response", (response) => {
			clearTimeout(timeout);
			complete = parseInt(response.headers["content-length"]);
			if (complete === 0) {
				error = "DownloadEmpty";
				request.destroy();
			}
		})
		.on("data", function (chunk) {
			if (downloadObject.isCanceled) {
				error = "DownloadCanceled";
				request.destroy();
			}
			chunkLength += chunk.length;

			if (downloadObject) {
				downloadObject.progressNext +=
					(chunk.length / complete / downloadObject.size) * 100;
				downloadObject.updateProgress(listener);
			}
			clearTimeout(timeout);
			timeout = setTimeout(() => {
				error = "DownloadTimeout";
				request.destroy();
			}, 5000);
		});

	timeout = setTimeout(() => {
		error = "DownloadTimeout";
		request.destroy();
	}, 5000);

	try {
		await pipeline(request, decrypter, depadder, outputStream);
	} catch (e) {
		if (storageProvider) {
			await storageProvider.deleteFile(partPath);
		} else if (fs.existsSync(partPath)) {
			fs.unlinkSync(partPath);
		}
		if (
			e instanceof ReadError ||
			e instanceof TimeoutError ||
			[
				"ESOCKETTIMEDOUT",
				"ERR_STREAM_PREMATURE_CLOSE",
				"ETIMEDOUT",
				"ECONNRESET",
			].includes(e.code) ||
			(request.destroyed && error === "DownloadTimeout")
		) {
			if (downloadObject && chunkLength !== 0) {
				downloadObject.progressNext -=
					(chunkLength / complete / downloadObject.size) * 100;
				downloadObject.updateProgress(listener);
			}
			if (_retryCount >= MAX_STREAM_RETRIES) {
				throw new DownloadCanceled();
			}
			if (listener) {
				listener.send("downloadInfo", {
					uuid: downloadObject.uuid,
					title: downloadObject.title,
					data: itemData,
					state: "downloadTimeout",
				});
			}
			return await streamTrack(writepath, track, downloadObject, listener, storageProvider, _retryCount + 1);
		} else if (request.destroyed) {
			switch (error) {
				case "DownloadEmpty":
					throw new DownloadEmpty();
				case "DownloadCanceled":
					throw new DownloadCanceled();
				default:
					throw e;
			}
		} else {
			console.trace(e);
			throw e;
		}
	}

	// Verify downloaded size matches expected content-length
	if (complete > 0 && chunkLength !== complete) {
		if (storageProvider) {
			await storageProvider.deleteFile(partPath);
		} else if (fs.existsSync(partPath)) {
			fs.unlinkSync(partPath);
		}
		if (_retryCount >= MAX_STREAM_RETRIES) {
			throw new DownloadFailed("notAvailable", track);
		}
		return await streamTrack(writepath, track, downloadObject, listener, storageProvider, _retryCount + 1);
	}

	// Atomic rename: .part → final path
	// For StorageProvider (S3), remap the temp file reference so finalizeStream/getLocalPath use the right key
	if (storageProvider) {
		await storageProvider.rename(partPath, writepath);
	} else {
		fs.renameSync(partPath, writepath);
	}
}
