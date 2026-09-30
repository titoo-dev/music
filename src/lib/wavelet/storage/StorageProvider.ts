export interface StorageProvider {
	ensureDir(dirPath: string): Promise<void>;
	exists(filePath: string): Promise<boolean>;
	readFile(filePath: string): Promise<Buffer>;
	writeFile(filePath: string, data: Buffer | string): Promise<void>;
	createWriteStream(filePath: string): NodeJS.WritableStream;
	finalizeStream(filePath: string): Promise<void>;
	deleteFile(filePath: string): Promise<void>;
	deleteDirectory(dirPath: string): Promise<void>;
	getFileSize(filePath: string): Promise<number>;
	getLocalPath(filePath: string): string;
	rename(oldPath: string, newPath: string): Promise<void>;
}
