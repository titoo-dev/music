// Delete the given object keys from the R2 bucket of the current env
// (run by e2e/lib/stack.mjs after a run): npx tsx e2e/lib/clean-r2.ts <key>...
import { config } from "dotenv";
import { R2StorageProvider } from "@/lib/wavelet/storage/R2StorageProvider";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

async function main() {
	const storage = new R2StorageProvider();
	const keys = process.argv.slice(2);
	for (const key of keys) await storage.deleteFile(key);
	console.log(`deleted ${keys.length} object(s)`);
}

void main();
