// Port of the DeemixApp class from webui/src/server/deemixApp.ts
// This is the core server-side app state manager

import type { Listener } from "@/lib/deemix/types/listener";
import type { Settings } from "@/lib/deemix/types/Settings";
import type { ConfigStore } from "@/lib/deemix/config-store/ConfigStore";

import type { StorageProvider } from "@/lib/deemix/storage/StorageProvider";

// These will be dynamically imported to avoid build issues
let Deezer: any;
let Downloader: any;
let generateDownloadObject: any;
let loadSettings: any;
let saveSettings: any;
let DEFAULT_SETTINGS: any;
let Single: any;
let Collection: any;
let Convertable: any;
let SpotifyPlugin: any;
let createStorageProvider: any;

let _initialized = false;

async function ensureImports() {
	if (_initialized) return;
	try {
		const deezerSdk = await import("@/lib/deezer");
		Deezer = deezerSdk.Deezer;

		const deemix = await import("@/lib/deemix");
		Downloader = deemix.Downloader;
		generateDownloadObject = deemix.generateDownloadObject;
		loadSettings = deemix.loadSettings;
		saveSettings = deemix.saveSettings;
		DEFAULT_SETTINGS = deemix.DEFAULT_SETTINGS;
		Single = deemix.Single;
		Collection = deemix.Collection;
		Convertable = deemix.Convertable;
		SpotifyPlugin = deemix.SpotifyPlugin;
		createStorageProvider = deemix.createStorageProvider;
		_initialized = true;
	} catch (e) {
		console.error("Failed to import deemix modules:", e);
	}
}

export class DeemixApp {
	queueOrder: string[];
	queue: Record<string, any>;
	currentJob: any;
	deezerAvailable?: "yes" | "no" | "no-network";
	latestVersion: string | null;
	plugins: Record<string, any>;
	settings: Settings;
	configStore: ConfigStore;
	storageProvider: StorageProvider | null;
	listener: Listener;
	_wsBroadcast?: (key: string, data: any) => void;
	// Full download object data (equivalent to disk persistence in old deemix)
	// Stores toDict() output keyed by UUID, needed by startQueue to reconstruct
	// Single/Collection instances with trackAPI/albumAPI data
	private _downloadData: Record<string, any> = {};

	constructor(listener: Listener, configStore: ConfigStore) {
		this.queueOrder = [];
		this.queue = {};
		this.currentJob = null;
		this.plugins = {};
		this.latestVersion = null;
		this.listener = listener;
		this.settings = {} as Settings;
		this.configStore = configStore;
		this.storageProvider = null;
		// init() is called externally after construction (awaited by server-state.ts)
	}

	async init() {
		await ensureImports();
		if (loadSettings) {
			this.settings = await loadSettings(this.configStore);
		}
		if (createStorageProvider) {
			this.storageProvider = createStorageProvider(this.settings);
		}
		if (SpotifyPlugin) {
			this.plugins.spotify = new SpotifyPlugin(this.configStore);
			await this.plugins.spotify.setup();
		}
	}

	async isDeezerAvailable(): Promise<"yes" | "no" | "no-network"> {
		if (this.deezerAvailable) return this.deezerAvailable;
		try {
			const got = (await import("got")).default;
			const response = await got.get("https://www.deezer.com/", {
				headers: {
					Cookie: "dz_lang=en; Domain=deezer.com; Path=/; Secure; hostOnly=false;",
				},
				https: { rejectUnauthorized: false },
				retry: { limit: 3 },
			});
			const title = (response.body.match(/<title[^>]*>([^<]+)<\/title>/)?.[1] || "").trim();
			this.deezerAvailable =
				title !== "Deezer will soon be available in your country." ? "yes" : "no";
		} catch {
			this.deezerAvailable = "no-network";
		}
		return this.deezerAvailable;
	}

	getSettings() {
		return {
			settings: this.settings,
			defaultSettings: DEFAULT_SETTINGS,
			spotifySettings: this.plugins.spotify?.getSettings?.() || {},
		};
	}

	async saveSettings(newSettings: Settings, newSpotifySettings: any) {
		if (saveSettings) {
			await saveSettings(newSettings, this.configStore);
		}
		this.settings = newSettings;
		if (createStorageProvider) {
			this.storageProvider = createStorageProvider(this.settings);
		}
		if (this.plugins.spotify?.saveSettings) {
			await this.plugins.spotify.saveSettings(newSpotifySettings);
		}
	}

	getQueue() {
		const result: any = {
			queue: this.queue,
			queueOrder: this.queueOrder,
		};
		if (this.currentJob?.downloadObject) {
			result.current = this.currentJob.downloadObject.getSlimmedDict();
		}
		return result;
	}

	async addToQueue(dz: any, url: string[], bitrate: number, retry = false, userId?: string) {
		await ensureImports();
		if (!dz.loggedIn) throw new Error("NotLoggedIn");

		let downloadObjs: any[] = [];
		const downloadErrors: any[] = [];

		for (const link of url) {
			try {
				const downloadObj = await generateDownloadObject(
					dz,
					link,
					bitrate,
					this.plugins,
					this.listener
				);
				if (Array.isArray(downloadObj)) {
					downloadObjs = downloadObjs.concat(downloadObj);
				} else if (downloadObj) {
					downloadObjs.push(downloadObj);
				}
			} catch (e: any) {
				downloadErrors.push(e);
			}
		}

		if (downloadErrors.length) {
			downloadErrors.forEach((e) => {
				this.listener.send("queueError", {
					link: e.link,
					error: e.message,
					errid: e.errid,
				});
			});
		}

		const slimmedObjects: any[] = [];

		downloadObjs.forEach((downloadObj) => {
			if (Object.keys(this.queue).includes(downloadObj.uuid) && !retry) {
				this.listener.send("alreadyInQueue", downloadObj.getEssentialDict());
				return;
			}

			this.queueOrder.push(downloadObj.uuid);
			// Store full download data in memory (replaces disk persistence from old deemix)
			const fullData = downloadObj.toDict();
			if (userId) fullData.__userId = userId;
			this._downloadData[downloadObj.uuid] = fullData;
			this.queue[downloadObj.uuid] = downloadObj.getEssentialDict();
			this.queue[downloadObj.uuid].status = "inQueue";
			if (userId) this.queue[downloadObj.uuid].userId = userId;
			const slimmed = downloadObj.getSlimmedDict();
			slimmed.status = "inQueue";
			if (userId) slimmed.userId = userId;
			slimmedObjects.push(slimmed);
		});

		if (slimmedObjects.length === 1)
			this.listener.send("addedToQueue", slimmedObjects[0]);
		else this.listener.send("addedToQueue", slimmedObjects);

		this.startQueue(dz);
		return slimmedObjects;
	}

	async startQueue(dz: any) {
		await ensureImports();
		do {
			if (this.currentJob !== null || this.queueOrder.length === 0) return null;
			this.currentJob = true;

			let currentUUID: string;
			do {
				currentUUID = this.queueOrder.shift() || "";
			} while (this.queue[currentUUID] === undefined && this.queueOrder.length);

			if (this.queue[currentUUID] === undefined) {
				this.currentJob = null;
				return null;
			}

			this.queue[currentUUID].status = "downloading";
			// Use full download data (with trackAPI, albumAPI, etc.) for reconstruction
			const currentItem = this._downloadData[currentUUID];

			if (!currentItem) {
				this.currentJob = null;
				continue;
			}

			let downloadObject: any;
			switch (currentItem.__type__) {
				case "Single":
					downloadObject = new Single(currentItem);
					break;
				case "Collection":
					downloadObject = new Collection(currentItem);
					break;
				case "Convertable": {
					const convertable = new Convertable(currentItem);
					downloadObject = await this.plugins[convertable.plugin]?.convert(
						dz,
						convertable,
						this.settings,
						this.listener
					);
					break;
				}
			}

			if (!downloadObject) {
				this.currentJob = null;
				continue;
			}

			const itemUserId = currentItem.__userId || null;
			this.currentJob = new Downloader(dz, downloadObject, this.settings, this.listener, this.storageProvider || undefined);
			this.listener.send("startDownload", { uuid: currentUUID, userId: itemUserId });
			await this.currentJob.start();

			if (!downloadObject.isCanceled) {
				if (downloadObject.failed === downloadObject.size && downloadObject.size !== 0) {
					this.queue[currentUUID].status = "failed";
				} else if (downloadObject.failed > 0) {
					this.queue[currentUUID].status = "withErrors";
				} else {
					this.queue[currentUUID].status = "completed";
				}

				this.queue[currentUUID] = {
					...downloadObject.getSlimmedDict(),
					status: this.queue[currentUUID].status,
					userId: itemUserId,
				};

				// Record completed tracks in download history
				if (itemUserId && this.queue[currentUUID].status !== "failed") {
					this._recordDownloadHistory(itemUserId, downloadObject, currentItem);
				}

				this.listener.send("finishDownload", {
					uuid: currentUUID,
					status: this.queue[currentUUID].status,
					extrasPath: downloadObject.extrasPath || "",
					userId: itemUserId,
				});
			}

			// Clean up full download data (no longer needed after completion)
			delete this._downloadData[currentUUID];
			this.currentJob = null;
		} while (this.queueOrder.length);
	}

	cancelDownload(uuid: string) {
		if (this.queue[uuid]) {
			if (this.queue[uuid].status === "downloading" && this.currentJob?.downloadObject) {
				this.currentJob.downloadObject.isCanceled = true;
				this.listener.send("cancellingCurrentItem", uuid);
			} else if (this.queue[uuid].status === "inQueue") {
				this.queueOrder = this.queueOrder.filter((id) => id !== uuid);
				this.listener.send("removedFromQueue", { uuid });
			} else {
				this.listener.send("removedFromQueue", { uuid });
			}
			delete this.queue[uuid];
			delete this._downloadData[uuid];
		}
	}

	cancelAllDownloads() {
		this.queueOrder = [];
		let currentItem: string | null = null;
		Object.values(this.queue).forEach((downloadObject: any) => {
			if (downloadObject.status === "downloading" && this.currentJob?.downloadObject) {
				this.currentJob.downloadObject.isCanceled = true;
				this.listener.send("cancellingCurrentItem", downloadObject.uuid);
				currentItem = downloadObject.uuid;
			}
			delete this.queue[downloadObject.uuid];
			delete this._downloadData[downloadObject.uuid];
		});
		this.listener.send("removedAllDownloads", currentItem);
	}

	clearCompletedDownloads() {
		Object.values(this.queue).forEach((downloadObject: any) => {
			if (downloadObject.status === "completed") {
				delete this.queue[downloadObject.uuid];
			}
		});
		this.listener.send("removedFinishedDownloads");
	}

	/** Record completed track downloads in the database for history/dedup */
	private async _recordDownloadHistory(userId: string, downloadObject: any, rawData: any) {
		try {
			const { prisma } = await import("@/lib/prisma");
			const storageType = this.settings.storageType || "local";

			// Use the slimmed download object info (always available)
			const trackId = String(rawData.id || downloadObject.id || "");
			const title = rawData.title || downloadObject.title || "";
			const artist = rawData.artist || downloadObject.artist || "";
			const cover = rawData.cover || downloadObject.cover || null;
			const bitrate = rawData.bitrate || downloadObject.bitrate || 0;

			if (rawData.__type__ === "Single" && trackId) {
				await prisma.downloadHistory.upsert({
					where: { userId_trackId: { userId, trackId } },
					update: { downloadedAt: new Date() },
					create: {
						userId,
						trackId,
						title,
						artist,
						coverUrl: cover,
						bitrate,
						storageType,
					},
				});

				// Auto-add to "Downloads" playlist
				await this._addToDownloadsPlaylist(prisma, userId, {
					trackId,
					title,
					artist,
					album: rawData.album || downloadObject.album || null,
					coverUrl: cover,
					duration: rawData.duration || downloadObject.duration || null,
				});
			}

			// For collections (albums/playlists), record using the slimmed info
			if (rawData.__type__ === "Collection") {
				// Record the collection as a single entry using its ID
				if (trackId) {
					await prisma.downloadHistory.upsert({
						where: { userId_trackId: { userId, trackId } },
						update: { downloadedAt: new Date() },
						create: {
							userId,
							trackId,
							title,
							artist,
							coverUrl: cover,
							bitrate,
							storageType,
						},
					});
				}

				// Auto-add each track from the collection to "Downloads" playlist
				const tracks = rawData.collection?.tracks_gw || rawData.tracks_gw || [];
				if (tracks.length > 0) {
					await this._addCollectionToDownloadsPlaylist(prisma, userId, tracks);
				}
			}
		} catch (e) {
			console.error("Failed to record download history:", e);
		}
	}

	/** Find or create the "Downloads" playlist for a user, then add a track */
	private async _addToDownloadsPlaylist(
		prisma: any,
		userId: string,
		track: { trackId: string; title: string; artist: string; album: string | null; coverUrl: string | null; duration: number | null }
	) {
		try {
			// Find or create the Downloads playlist
			let playlist = await prisma.playlist.findFirst({
				where: { userId, title: "Downloads" },
			});
			if (!playlist) {
				playlist = await prisma.playlist.create({
					data: {
						userId,
						title: "Downloads",
						description: "Automatically added when you download tracks",
					},
				});
			}

			// Get next position
			const lastTrack = await prisma.playlistTrack.findFirst({
				where: { playlistId: playlist.id },
				orderBy: { position: "desc" },
			});
			const nextPosition = (lastTrack?.position ?? -1) + 1;

			// Upsert the track (skip if already in playlist)
			await prisma.playlistTrack.upsert({
				where: {
					playlistId_trackId: {
						playlistId: playlist.id,
						trackId: track.trackId,
					},
				},
				update: {},
				create: {
					playlistId: playlist.id,
					trackId: track.trackId,
					title: track.title,
					artist: track.artist,
					album: track.album,
					coverUrl: track.coverUrl,
					duration: track.duration,
					position: nextPosition,
				},
			});

			// Update playlist timestamp
			await prisma.playlist.update({
				where: { id: playlist.id },
				data: { updatedAt: new Date() },
			});
		} catch (e) {
			console.error("Failed to add track to Downloads playlist:", e);
		}
	}

	/** Add all tracks from a collection download to the Downloads playlist */
	private async _addCollectionToDownloadsPlaylist(prisma: any, userId: string, tracks: any[]) {
		try {
			let playlist = await prisma.playlist.findFirst({
				where: { userId, title: "Downloads" },
			});
			if (!playlist) {
				playlist = await prisma.playlist.create({
					data: {
						userId,
						title: "Downloads",
						description: "Automatically added when you download tracks",
					},
				});
			}

			const lastTrack = await prisma.playlistTrack.findFirst({
				where: { playlistId: playlist.id },
				orderBy: { position: "desc" },
			});
			let nextPosition = (lastTrack?.position ?? -1) + 1;

			for (const t of tracks) {
				const trackId = String(t.SNG_ID || t.id || "");
				if (!trackId) continue;

				try {
					await prisma.playlistTrack.upsert({
						where: {
							playlistId_trackId: {
								playlistId: playlist.id,
								trackId,
							},
						},
						update: {},
						create: {
							playlistId: playlist.id,
							trackId,
							title: t.SNG_TITLE || t.title || "",
							artist: t.ART_NAME || t.artist || "",
							album: t.ALB_TITLE || t.album || null,
							coverUrl: t.ALB_PICTURE ? `https://e-cdns-images.dzcdn.net/images/cover/${t.ALB_PICTURE}/500x500-000000-80-0-0.jpg` : null,
							duration: t.DURATION ? parseInt(t.DURATION, 10) : null,
							position: nextPosition++,
						},
					});
				} catch {
					// Skip duplicates
				}
			}

			await prisma.playlist.update({
				where: { id: playlist.id },
				data: { updatedAt: new Date() },
			});
		} catch (e) {
			console.error("Failed to add collection to Downloads playlist:", e);
		}
	}
}
