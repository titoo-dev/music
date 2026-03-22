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

	async addToQueue(dz: any, url: string[], bitrate: number, retry = false) {
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
			this._downloadData[downloadObj.uuid] = downloadObj.toDict();
			this.queue[downloadObj.uuid] = downloadObj.getEssentialDict();
			this.queue[downloadObj.uuid].status = "inQueue";
			const slimmed = downloadObj.getSlimmedDict();
			slimmed.status = "inQueue";
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

			this.currentJob = new Downloader(dz, downloadObject, this.settings, this.listener, this.storageProvider || undefined);
			this.listener.send("startDownload", currentUUID);
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
				};

				this.listener.send("finishDownload", {
					uuid: currentUUID,
					status: this.queue[currentUUID].status,
					extrasPath: downloadObject.extrasPath || "",
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
}
