// Server-side app singleton — holds shared settings, the storage provider,
// and the cross-user download lock map used by the progressive streaming
// engine. The legacy queue (addToQueue / startQueue) was removed in favor
// of the progressive streaming + library-save model.

import type { Listener } from "@/lib/deemix/types/listener";
import type { Settings } from "@/lib/deemix/types/Settings";
import type { ConfigStore } from "@/lib/deemix/config-store/ConfigStore";
import type { StorageProvider } from "@/lib/deemix/storage/StorageProvider";

let loadSettings: any;
let saveSettingsFn: any;
let DEFAULT_SETTINGS: any;
let createStorageProvider: any;
let _initialized = false;

async function ensureImports() {
	if (_initialized) return;
	try {
		const deemix = await import("@/lib/deemix");
		loadSettings = deemix.loadSettings;
		saveSettingsFn = deemix.saveSettings;
		DEFAULT_SETTINGS = deemix.DEFAULT_SETTINGS;
		createStorageProvider = deemix.createStorageProvider;
		_initialized = true;
	} catch (e) {
		console.error("Failed to import deemix modules:", e);
	}
}

export class DeemixApp {
	deezerAvailable?: "yes" | "no" | "no-network";
	settings: Settings;
	configStore: ConfigStore;
	storageProvider: StorageProvider | null;
	listener: Listener;

	/** Lock map: "trackId_bitrate" → Promise that resolves when a fetch
	 *  completes. Prevents concurrent progressive downloads of the same track. */
	private _downloadLocks: Map<string, Promise<void>> = new Map();

	constructor(listener: Listener, configStore: ConfigStore) {
		this.listener = listener;
		this.settings = {} as Settings;
		this.configStore = configStore;
		this.storageProvider = null;
	}

	async init() {
		await ensureImports();
		if (loadSettings) {
			this.settings = await loadSettings(this.configStore);
		}
		if (createStorageProvider) {
			this.storageProvider = createStorageProvider(this.settings);
		}
	}

	async isDeezerAvailable(): Promise<"yes" | "no" | "no-network"> {
		if (this.deezerAvailable) return this.deezerAvailable;
		try {
			const got = (await import("got")).default;
			const response = await got.get("https://www.deezer.com/", {
				headers: {
					Cookie:
						"dz_lang=en; Domain=deezer.com; Path=/; Secure; hostOnly=false;",
				},
				https: { rejectUnauthorized: false },
				retry: { limit: 3 },
			});
			const title = (
				response.body.match(/<title[^>]*>([^<]+)<\/title>/)?.[1] || ""
			).trim();
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
		};
	}

	async saveSettings(newSettings: Settings) {
		if (saveSettingsFn) {
			await saveSettingsFn(newSettings, this.configStore);
		}
		this.settings = newSettings;
		if (createStorageProvider) {
			this.storageProvider = createStorageProvider(this.settings);
		}
	}

	/** Acquire a per-track download lock. Returns a release function plus
	 *  a flag indicating whether another fetch is already in progress. */
	acquireDownloadLock(
		trackId: string,
		bitrate: number
	): {
		alreadyInProgress: boolean;
		waitForExisting: () => Promise<void>;
		release: () => void;
	} {
		const lockKey = `${trackId}_${bitrate}`;
		const existing = this._downloadLocks.get(lockKey);
		if (existing) {
			return {
				alreadyInProgress: true,
				waitForExisting: () => existing,
				release: () => {},
			};
		}
		let releaseFn: () => void;
		const lockPromise = new Promise<void>((resolve) => {
			releaseFn = resolve;
		});
		this._downloadLocks.set(lockKey, lockPromise);
		return {
			alreadyInProgress: false,
			waitForExisting: () => Promise.resolve(),
			release: () => {
				this._downloadLocks.delete(lockKey);
				releaseFn();
			},
		};
	}
}
