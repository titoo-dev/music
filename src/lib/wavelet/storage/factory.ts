import type { Settings } from "../types/Settings";
import type { StorageProvider } from "./StorageProvider";
import { LocalStorageProvider } from "./LocalStorageProvider";
import { S3StorageProvider } from "./S3StorageProvider";

export function createStorageProvider(settings: Settings): StorageProvider {
	if (settings.storageType === "s3" && settings.s3) {
		return new S3StorageProvider(settings.s3, settings.downloadLocation);
	}
	return new LocalStorageProvider();
}
