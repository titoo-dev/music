import type { StorageProvider } from "./StorageProvider";
import { R2StorageProvider } from "./R2StorageProvider";

export function createStorageProvider(): StorageProvider {
	return new R2StorageProvider();
}
