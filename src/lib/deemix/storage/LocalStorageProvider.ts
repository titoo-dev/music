import fs from "fs";
import type { StorageProvider } from "./StorageProvider";

export class LocalStorageProvider implements StorageProvider {
	async ensureDir(dirPath: string): Promise<void> {
		fs.mkdirSync(dirPath, { recursive: true });
	}

	async exists(filePath: string): Promise<boolean> {
		return fs.existsSync(filePath);
	}

	async readFile(filePath: string): Promise<Buffer> {
		return fs.readFileSync(filePath);
	}

	async writeFile(filePath: string, data: Buffer | string): Promise<void> {
		fs.writeFileSync(filePath, data);
	}

	createWriteStream(filePath: string): NodeJS.WritableStream {
		return fs.createWriteStream(filePath);
	}

	async finalizeStream(_filePath: string): Promise<void> {
		// No-op for local storage — file is already at its final location
	}

	async deleteFile(filePath: string): Promise<void> {
		if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
	}

	async deleteDirectory(dirPath: string): Promise<void> {
		if (fs.existsSync(dirPath)) {
			fs.rmSync(dirPath, { recursive: true, force: true });
		}
	}

	async getFileSize(filePath: string): Promise<number> {
		return fs.statSync(filePath).size;
	}

	getLocalPath(filePath: string): string {
		return filePath;
	}
}
