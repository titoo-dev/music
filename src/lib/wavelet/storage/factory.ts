import type { StorageProvider } from "./StorageProvider";
import { BlobStorageProvider } from "./BlobStorageProvider";

export function createStorageProvider(): StorageProvider {
	return new BlobStorageProvider();
}
