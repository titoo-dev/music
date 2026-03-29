import { execFile } from "child_process";
import {
	Deezer,
	TrackFormats,
	utils,
	type APIAlbum,
	type APITrack,
} from "@/lib/deezer";
import { mkdirSync } from "fs";
import { HTTPError } from "got";
import { tmpdir } from "os";
import { streamTrack } from "./decryption";
import { Collection } from "./download-objects/Collection";
import { DownloadObject } from "./download-objects/DownloadObject";
import { Single } from "./download-objects/Single";
import { DownloadCanceled, DownloadFailed, ErrorMessages } from "./errors";
import { DEFAULT_SETTINGS, OverwriteOption } from "./settings";
import type { StorageProvider } from "./storage/StorageProvider";
import { LocalStorageProvider } from "./storage/LocalStorageProvider";
import { Album } from "./types/Album";
import type { Listener } from "./types/listener";
import { StaticPicture } from "./types/Picture";
import { Playlist } from "./types/Playlist";
import type { Settings } from "./types/Settings";
import Track, { formatsName } from "./types/Track";
import { shellEscape } from "./utils/core";
import { downloadImage } from "./utils/downloadImage";
import { checkShouldDownload, tagTrack } from "./utils/downloadUtils";
import { getPreferredBitrate } from "./utils/getPreferredBitrate";
import {
	generateAlbumName,
	generateArtistName,
	generateDownloadObjectName,
	generatePath,
} from "./utils/pathtemplates";

const { mapGwTrackToDeezer: map_track } = utils;

const extensions = {
	[TrackFormats.FLAC]: ".flac",
	[TrackFormats.LOCAL]: ".mp3",
	[TrackFormats.MP3_320]: ".mp3",
	[TrackFormats.MP3_128]: ".mp3",
	[TrackFormats.DEFAULT]: ".mp3",
	[TrackFormats.MP4_RA3]: ".mp4",
	[TrackFormats.MP4_RA2]: ".mp4",
	[TrackFormats.MP4_RA1]: ".mp4",
} as const;

const TEMPDIR = tmpdir() + "/deemix-imgs";
mkdirSync(TEMPDIR, { recursive: true });

export class Downloader {
	dz: Deezer;
	downloadObject: DownloadObject;
	settings: Settings;
	bitrate: number;
	listener: Listener;
	storageProvider: StorageProvider;
	playlistCovername?: string;
	playlistURLs: { url: string; ext: string }[];
	coverQueue: Record<string, string>;

	constructor(
		dz: Deezer,
		downloadObject: DownloadObject,
		settings: Settings,
		listener: Listener,
		storageProvider?: StorageProvider
	) {
		this.dz = dz;
		this.downloadObject = downloadObject;
		this.settings = settings || DEFAULT_SETTINGS;
		this.bitrate = downloadObject.bitrate;
		this.listener = listener;
		this.storageProvider = storageProvider || new LocalStorageProvider();

		this.playlistURLs = [];

		this.coverQueue = {};
	}

	log(data: any, state: string) {
		if (this.listener) {
			this.listener.send("downloadInfo", {
				uuid: this.downloadObject.uuid,
				title: this.downloadObject.title,
				data,
				state,
			});
		}
	}

	warn(data: any, state: string, solution: string) {
		this.listener.send("downloadWarn", {
			uuid: this.downloadObject.uuid,
			data,
			state,
			solution,
		});
	}

	async start() {
		if (this.downloadObject instanceof Single) {
			const track = await this.downloadWrapper({
				trackAPI: this.downloadObject.single.trackAPI,
				albumAPI: this.downloadObject.single.albumAPI,
			});
			if (track) await this.afterDownloadSingle(track);
		} else if (this.downloadObject instanceof Collection) {
			const tracks: any[] = [];

			const concurrency = this.settings.queueConcurrency;
			const trackList = this.downloadObject.collection.tracks;

			if (trackList.length) {
				// Process tracks with concurrency using native Promise
				let index = 0;
				const runNext = async (): Promise<void> => {
					while (index < trackList.length) {
						const pos = index++;
						const track = trackList[pos];
						if (this.downloadObject instanceof Collection) {
							tracks[pos] = await this.downloadWrapper({
								trackAPI: track,
								albumAPI: this.downloadObject.collection.albumAPI,
								playlistAPI: this.downloadObject.collection.playlistAPI,
							});
						}
					}
				};

				const workers = Array.from(
					{ length: Math.min(concurrency, trackList.length) },
					() => runNext()
				);
				await Promise.all(workers);
			}
			await this.afterDownloadCollection(tracks);
		}

		if (this.downloadObject.isCanceled) {
			this.listener.send("currentItemCancelled", {
				uuid: this.downloadObject.uuid,
				title: this.downloadObject.title,
			});
			this.listener.send("removedFromQueue", {
				uuid: this.downloadObject.uuid,
				title: this.downloadObject.title,
			});
		}

		this.listener.send("finishDownload", {
			uuid: this.downloadObject.uuid,
			title: this.downloadObject.title,
		});
	}

	// --- download() broken into focused steps ---

	private async enrichTrack(
		trackAPI: APITrack,
		albumAPI?: APIAlbum,
		playlistAPI?: any,
		existingTrack?: Track
	): Promise<Track> {
		const track = existingTrack || new Track();
		if (!existingTrack) {
			track.parseTrack(trackAPI);
			if (albumAPI) {
				track.album = new Album(albumAPI.id, albumAPI.title);
				track.album.parseAlbum(albumAPI);
			}
			if (playlistAPI) {
				track.playlist = new Playlist(playlistAPI);
			}
		}

		try {
			await track.parseData(this.dz, trackAPI.id, trackAPI, albumAPI, playlistAPI);
		} catch (e: any) {
			if (e.name === "AlbumDoesntExists") throw new DownloadFailed("albumDoesntExists");
			if (e.name === "MD5NotFound") throw new DownloadFailed("notLoggedIn");
			throw e;
		}
		return track;
	}

	private async resolveFormat(track: Track) {
		if (track.MD5 === 0) throw new DownloadFailed("notEncoded", track);
		try {
			return await getPreferredBitrate(
				this.dz,
				track,
				this.bitrate,
				this.settings.fallbackBitrate,
				this.settings.feelingLucky,
				this.downloadObject.uuid,
				this.listener
			);
		} catch (e: any) {
			if (e.name === "WrongLicense") throw new DownloadFailed("wrongLicense");
			if (e.name === "WrongGeolocation") throw new DownloadFailed("wrongGeolocation", track);
			if (e.name === "PreferredBitrateNotFound") throw new DownloadFailed("wrongBitrate", track);
			if (e.name === "TrackNot360") throw new DownloadFailed("no360RA");
			console.error(e);
			throw e;
		}
	}

	private async prepareCoverArt(track: Track) {
		let embeddedImageFormat = `jpg-${this.settings.jpegImageQuality}`;
		if (this.settings.embeddedArtworkPNG) embeddedImageFormat = "png";

		track.album.embeddedCoverURL = track.album.pic.getURL(
			this.settings.embeddedArtworkSize,
			embeddedImageFormat
		);
		let ext = track.album.embeddedCoverURL.slice(-4);
		if (ext.charAt(0) !== ".") ext = ".jpg";
		track.album.embeddedCoverPath = `${TEMPDIR}/${
			track.album.isPlaylist ? "pl" + track.playlist.id : "alb" + track.album.id
		}_${this.settings.embeddedArtworkSize}${ext}`;

		if (!this.coverQueue[track.album.embeddedCoverPath]) {
			this.coverQueue[track.album.embeddedCoverPath] = await downloadImage(
				track.album.embeddedCoverURL,
				track.album.embeddedCoverPath
			);
		}
		track.album.embeddedCoverPath = this.coverQueue[track.album.embeddedCoverPath];
		if (this.coverQueue[track.album.embeddedCoverPath])
			delete this.coverQueue[track.album.embeddedCoverPath];
	}

	private collectArtworkURLs(track: Track, returnData: any, coverPath?: string, artistPath?: string) {
		if (coverPath) {
			returnData.albumURLs = [];
			this.settings.localArtworkFormat.split(",").forEach((picFormat) => {
				if (["png", "jpg"].includes(picFormat)) {
					let extendedFormat = picFormat;
					if (extendedFormat === "jpg")
						extendedFormat += `-${this.settings.jpegImageQuality}`;
					const url = track.album.pic.getURL(this.settings.localArtworkSize, extendedFormat);
					if (track.album.pic instanceof StaticPicture && picFormat !== "jpg") return;
					returnData.albumURLs.push({ url, ext: picFormat });
				}
			});
			returnData.albumPath = coverPath;
			returnData.albumFilename = generateAlbumName(
				this.settings.coverImageTemplate,
				track.album,
				this.settings,
				track.playlist
			);
		}

		if (artistPath) {
			returnData.artistURLs = [];
			this.settings.localArtworkFormat.split(",").forEach((picFormat) => {
				if (picFormat === "jpg") {
					const extendedFormat = `${picFormat}-${this.settings.jpegImageQuality}`;
					const url = track.album.mainArtist.pic.getURL(this.settings.localArtworkSize, extendedFormat);
					if (track.album.mainArtist.pic.md5 === "") return;
					returnData.artistURLs.push({ url, ext: picFormat });
				}
			});
			returnData.artistPath = artistPath;
			returnData.artistFilename = generateArtistName(
				this.settings.artistImageTemplate,
				track.album.mainArtist,
				this.settings,
				track.album.rootArtist
			);
		}

		if (track.playlist) {
			if (this.playlistURLs.length === 0) {
				this.settings.localArtworkFormat.split(",").forEach((picFormat) => {
					if (["png", "jpg"].includes(picFormat)) {
						let extendedFormat = picFormat;
						if (extendedFormat === "jpg")
							extendedFormat += `-${this.settings.jpegImageQuality}`;
						const url = track.playlist.pic.getURL(this.settings.localArtworkSize, extendedFormat);
						if (track.playlist.pic instanceof StaticPicture && picFormat !== "jpg") return;
						this.playlistURLs.push({ url, ext: picFormat });
					}
				});
			}
			if (!this.playlistCovername) {
				track.playlist.bitrate = track.bitrate;
				track.playlist.dateString = track.playlist.date.format(this.settings.dateFormat);
				this.playlistCovername = generateAlbumName(
					this.settings.coverImageTemplate,
					track.playlist,
					this.settings,
					track.playlist
				);
			}
		}
	}

	private async saveLyrics(track: Track, filepath: string, filename: string) {
		if (this.settings.syncedLyrics && track.lyrics?.sync) {
			if (
				!(await this.storageProvider.exists(`${filepath}/${filename}.lrc`)) ||
				[OverwriteOption.OVERWRITE, OverwriteOption.ONLY_TAGS].includes(this.settings.overwriteFile)
			) {
				const lrcHeader = track.lyrics.generateLrcHeader(track);
				await this.storageProvider.writeFile(`${filepath}/${filename}.lrc`, lrcHeader + track.lyrics.sync);
			}
		}
	}

	private async downloadAndTag(track: Track, writepath: string, extension: string) {
		track.downloadURL = track.urls[formatsName[track.bitrate]];
		if (!track.downloadURL) throw new DownloadFailed("notAvailable", track);
		try {
			await streamTrack(writepath, track, this.downloadObject, this.listener, this.storageProvider);
		} catch (e) {
			if (e instanceof HTTPError) throw new DownloadFailed("notAvailable", track);
			throw e;
		}

		if (!track.local) {
			const localPath = this.storageProvider.getLocalPath(writepath);
			await tagTrack(extension, localPath, track, this.settings.tags);
		}

		await this.storageProvider.finalizeStream(writepath);
	}

	async download(
		extraData: { trackAPI: APITrack; albumAPI?: APIAlbum; playlistAPI?: any },
		track?: Track
	) {
		const returnData = {} as any;
		const { trackAPI, albumAPI, playlistAPI } = extraData;

		if (this.downloadObject.isCanceled) throw new DownloadCanceled();
		if (trackAPI.id === 0) throw new DownloadFailed("notOnDeezer");

		trackAPI.size = this.downloadObject.size;

		let itemData: any = {
			id: trackAPI.id,
			title: trackAPI.title,
			artist: trackAPI.artist.name,
		};

		// Step 1: Enrich track
		track = await this.enrichTrack(trackAPI, albumAPI, playlistAPI, track);
		if (this.downloadObject.isCanceled) throw new DownloadCanceled();

		// Step 2: Resolve format/bitrate
		const selectedFormat = await this.resolveFormat(track);
		track.bitrate = selectedFormat as typeof track.bitrate;
		track.album.bitrate = selectedFormat;
		track.applySettings(this.settings);

		// Step 3: Generate paths
		const { filename, filepath, artistPath, coverPath, extrasPath } =
			generatePath(track, this.downloadObject.type, this.settings);

		await this.storageProvider.ensureDir(filepath);
		const extension = extensions[track.bitrate];
		let writepath = `${filepath}/${filename}${extension}`;

		// Step 4: Check if should download
		const shouldDownload = await checkShouldDownload(
			filename, filepath, extension, writepath,
			this.settings.overwriteFile, track, this.storageProvider
		);

		if (
			!shouldDownload &&
			[OverwriteOption.ONLY_TAGS, OverwriteOption.OVERWRITE].includes(this.settings.overwriteFile)
		) {
			await tagTrack(extension, writepath, track, this.settings.tags);
		}

		if (!shouldDownload) {
			this.downloadObject.files.push(returnData);
			if (this.downloadObject instanceof Single || this.downloadObject instanceof Collection) {
				this.downloadObject.completeTrackProgress(this.listener);
			}
			this.downloadObject.downloaded += 1;
			if (this.listener) {
				this.listener.send("updateQueue", {
					uuid: this.downloadObject.uuid,
					alreadyDownloaded: true,
					downloaded: this.downloadObject.downloaded,
					downloadPath: writepath,
					extrasPath: this.downloadObject.extrasPath,
				});
			}
			returnData.filename = writepath.slice(extrasPath.length + 1);
			returnData.data = itemData;
			returnData.path = String(writepath);
			return returnData;
		}

		if (this.downloadObject.isCanceled) throw new DownloadCanceled();

		if (this.settings.overwriteFile === OverwriteOption.KEEP_BOTH) {
			const originalFilename = `${filepath}/${filename}`;
			let c = 0;
			let currentFilename = originalFilename;
			while (await this.storageProvider.exists(currentFilename + extension)) {
				c++;
				currentFilename = `${originalFilename} (${c})`;
			}
			writepath = currentFilename + extension;
		}

		itemData = {
			id: track.id,
			title: track.title,
			artist: track.mainArtist.name,
			duration: track.duration,
		};

		if (extrasPath && !this.downloadObject.extrasPath) {
			this.downloadObject.extrasPath = extrasPath;
		}

		// Step 5: Prepare cover art
		await this.prepareCoverArt(track);

		// Step 6: Collect artwork URLs
		this.collectArtworkURLs(track, returnData, coverPath, artistPath);

		// Step 7: Save lyrics
		await this.saveLyrics(track, filepath, filename);

		// Step 8: Download + tag + finalize
		await this.downloadAndTag(track, writepath, extension);

		if (track.searched) returnData.searched = true;
		this.downloadObject.downloaded += 1;

		if (this.listener) {
			this.listener.send("updateQueue", {
				uuid: this.downloadObject.uuid,
				downloaded: this.downloadObject.downloaded,
				downloadPath: String(writepath),
				extrasPath: String(this.downloadObject.extrasPath),
			});
		}
		returnData.filename = writepath.slice(extrasPath.length + 1);
		returnData.data = itemData;
		returnData.path = String(writepath);
		this.downloadObject.files.push(returnData);
		return returnData;
	}

	async downloadWrapper(
		extraData: { trackAPI: APITrack; albumAPI?: APIAlbum; playlistAPI?: any },
		track?: Track
	) {
		const { trackAPI } = extraData;

		const itemData = {
			id: trackAPI.id,
			title: trackAPI.title,
			artist: trackAPI.artist.name,
		};

		let result: any;
		try {
			result = await this.download(extraData, track);
		} catch (e: any) {
			if (e instanceof DownloadFailed) {
				if (e.track) {
					const track = e.track;
					if (track.fallbackID !== 0) {
						this.warn(itemData, e.errid, "fallback");
						const gwTrack = await this.dz.gw.get_track_with_fallback(track.fallbackID);
						track.parseEssentialData(map_track(gwTrack));
						return await this.downloadWrapper(extraData, track);
					}
					if (track.albumsFallback.length && this.settings.fallbackISRC) {
						const newAlbumID = track.albumsFallback.pop();
						const newAlbum = await this.dz.gw.get_album_page(newAlbumID);
						let fallbackID = 0;
						for (const newTrack of newAlbum.SONGS.data) {
							if (newTrack.ISRC === track.ISRC) {
								fallbackID = newTrack.SNG_ID;
								break;
							}
						}
						if (fallbackID !== 0) {
							this.warn(itemData, e.errid, "fallback");
							const gwTrack = await this.dz.gw.get_track_with_fallback(fallbackID);
							track.parseEssentialData(map_track(gwTrack));
							return await this.downloadWrapper(extraData, track);
						}
					}
					if (!track.searched && this.settings.fallbackSearch) {
						this.warn(itemData, e.errid, "search");
						const searchedID = await this.dz.api.get_track_id_from_metadata(
							track.mainArtist.name, track.title, track.album.title
						);
						if (searchedID !== "0") {
							const gwTrack = await this.dz.gw.get_track_with_fallback(searchedID);
							track.parseEssentialData(map_track(gwTrack));
							track.searched = true;
							this.log(itemData, "searchFallback");
							return await this.downloadWrapper(extraData, track);
						}
					}
					e.errid += "NoAlternative";
					e.message = ErrorMessages[e.errid];
				}
				result = {
					error: { message: e.message, errid: e.errid, data: itemData, type: "track" },
				};
			} else if (e instanceof DownloadCanceled) {
				return;
			} else {
				result = {
					error: { message: e.message, data: itemData, stack: String(e.stack), type: "track" },
				};
			}
		}

		if (result.error) {
			if (this.downloadObject instanceof Single || this.downloadObject instanceof Collection) {
				this.downloadObject.completeTrackProgress(this.listener);
			}
			this.downloadObject.failed += 1;
			this.downloadObject.errors.push(result.error);
			if (this.listener) {
				const error = result.error;
				this.listener.send("updateQueue", {
					uuid: this.downloadObject.uuid,
					title: this.downloadObject.title,
					failed: true,
					data: error.data,
					error: error.message,
					errid: error.errid || null,
					stack: error.stack || null,
					type: error.type,
				});
			}
		}
		return result;
	}

	afterDownloadErrorReport(position: string, error: any, itemData: any = {}) {
		this.downloadObject.errors.push({
			message: error.message,
			stack: String(error.stack),
			data: { position, ...itemData },
			type: "post",
		});
		if (this.listener) {
			this.listener.send("updateQueue", {
				uuid: this.downloadObject.uuid,
				postFailed: true,
				error: error.message,
				data: { position, ...itemData },
				stack: error.stack,
				type: "post",
			});
		}
	}

	// --- Shared post-download helpers ---

	private async saveTrackArtwork(track: any, itemData?: any) {
		try {
			if (this.settings.saveArtwork && track.albumPath) {
				await Promise.all(
					(track.albumURLs || []).map((image: any) =>
						downloadImage(
							image.url,
							`${track.albumPath}/${track.albumFilename}.${image.ext}`,
							this.settings.overwriteFile,
							this.storageProvider
						)
					)
				);
			}
		} catch (e) {
			this.afterDownloadErrorReport("SaveLocalAlbumArt", e, itemData);
		}

		try {
			if (this.settings.saveArtworkArtist && track.artistPath) {
				await Promise.all(
					(track.artistURLs || []).map((image: any) =>
						downloadImage(
							image.url,
							`${track.artistPath}/${track.artistFilename}.${image.ext}`,
							this.settings.overwriteFile,
							this.storageProvider
						)
					)
				);
			}
		} catch (e) {
			this.afterDownloadErrorReport("SaveLocalArtistArt", e, itemData);
		}
	}

	async afterDownloadSingle(track: any) {
		if (!track) return;
		if (!this.downloadObject.extrasPath) {
			this.downloadObject.extrasPath = this.settings.downloadLocation;
		}

		await this.saveTrackArtwork(track);

		// Create searched logfile (append mode for single)
		try {
			if (this.settings.logSearched && track.searched) {
				const filename = `${track.data.artist} - ${track.data.title}`;
				let searchedFile;
				try {
					searchedFile = (await this.storageProvider.readFile(
						`${this.downloadObject.extrasPath}/searched.txt`
					)).toString();
				} catch {
					searchedFile = "";
				}
				if (searchedFile.indexOf(filename) === -1) {
					if (searchedFile !== "") searchedFile += "\r\n";
					searchedFile += filename + "\r\n";
					await this.storageProvider.writeFile(
						`${this.downloadObject.extrasPath}/searched.txt`,
						searchedFile
					);
				}
			}
		} catch (e) {
			this.afterDownloadErrorReport("CreateSearchedLog", e);
		}

		// Execute command after download
		try {
			if (this.settings.executeCommand !== "") {
				await this.executePostCommand(this.downloadObject.extrasPath, track.filename);
			}
		} catch (e) {
			this.afterDownloadErrorReport("ExecuteCommand", e);
		}
	}

	private async executePostCommand(folder: string, filename = "") {
		const command = this.settings.executeCommand
			.replaceAll("%folder%", shellEscape(folder))
			.replaceAll("%filename%", shellEscape(filename));

		return new Promise<void>((resolve) => {
			const child = execFile(
				process.platform === "win32" ? "cmd" : "/bin/sh",
				process.platform === "win32" ? ["/c", command] : ["-c", command],
				{ env: { ...process.env, DEEMIX_FOLDER: folder, DEEMIX_FILENAME: filename } },
				(error, stdout, stderr) => {
					if (error) this.afterDownloadErrorReport("ExecuteCommand", error);
					const itemData = { stderr, stdout };
					if (stderr) this.log(itemData, "stderr");
					if (stdout) this.log(itemData, "stdout");
				}
			);
			child.on("close", resolve);
		});
	}

	async afterDownloadCollection(tracks: any[]) {
		if (!this.downloadObject.extrasPath) {
			this.downloadObject.extrasPath = this.settings.downloadLocation;
		}

		const playlist: { filename: string; duration?: number; artist?: string; title?: string }[] = [];
		let errors = "";
		let searched = "";

		for (let i = 0; i < tracks.length; i++) {
			const track = tracks[i];
			if (!track) continue;

			if (track.error) {
				if (!track.error.data)
					track.error.data = { id: "0", title: "Unknown", artist: "Unknown" };
				errors += `${track.error.data.id} | ${track.error.data.artist} - ${track.error.data.title} | ${track.error.message}\r\n`;
			}

			if (track.searched)
				searched += `${track.data.artist} - ${track.data.title}\r\n`;

			await this.saveTrackArtwork(track, track.data);

			playlist[i] = {
				filename: track.filename || "",
				duration: track.data?.duration,
				artist: track.data?.artist,
				title: track.data?.title,
			};
		}

		// Create errors logfile
		try {
			if (this.settings.logErrors && errors !== "") {
				await this.storageProvider.writeFile(`${this.downloadObject.extrasPath}/errors.txt`, errors);
			}
		} catch (e) {
			this.afterDownloadErrorReport("CreateErrorLog", e);
		}

		// Create searched logfile
		try {
			if (this.settings.logSearched && searched !== "") {
				await this.storageProvider.writeFile(
					`${this.downloadObject.extrasPath}/searched.txt`,
					searched
				);
			}
		} catch (e) {
			this.afterDownloadErrorReport("CreateSearchedLog", e);
		}

		// Save Playlist Artwork
		try {
			if (
				this.settings.saveArtwork &&
				this.playlistCovername &&
				!this.settings.tags.savePlaylistAsCompilation
			) {
				await Promise.all(
					this.playlistURLs.map((image) =>
						downloadImage(
							image.url,
							`${this.downloadObject.extrasPath}/${this.playlistCovername}.${image.ext}`,
							this.settings.overwriteFile,
							this.storageProvider
						)
					)
				);
			}
		} catch (e) {
			this.afterDownloadErrorReport("SavePlaylistArt", e);
		}

		// Create M3U8 File
		try {
			if (this.settings.createM3U8File) {
				const filename =
					generateDownloadObjectName(
						this.settings.playlistFilenameTemplate,
						this.downloadObject,
						this.settings
					) || "playlist";
				const m3u8Lines = ["#EXTM3U"];
				for (const entry of playlist) {
					if (!entry || !entry.filename) continue;
					const duration = entry.duration || -1;
					const display = entry.artist && entry.title
						? `${entry.artist} - ${entry.title}`
						: entry.filename;
					m3u8Lines.push(`#EXTINF:${duration},${display}`);
					m3u8Lines.push(entry.filename);
				}
				await this.storageProvider.writeFile(
					`${this.downloadObject.extrasPath}/${filename}.m3u8`,
					m3u8Lines.join("\n")
				);
			}
		} catch (e) {
			this.afterDownloadErrorReport("CreatePlaylistFile", e);
		}

		// Execute command after download
		try {
			if (this.settings.executeCommand !== "") {
				await this.executePostCommand(this.downloadObject.extrasPath);
			}
		} catch (e) {
			this.afterDownloadErrorReport("ExecuteCommand", e);
		}
	}
}
