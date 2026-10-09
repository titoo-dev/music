import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Space Grotesk Bold for the share OG image, shipped in the repo
 * (assets/fonts) rather than fetched: a font URL on fonts.gstatic.com is
 * versioned and silently 404s once Google moves it. Null when the file
 * can't be read, so the image still renders with the default font.
 */
export async function loadOgFont(): Promise<ArrayBuffer | null> {
	try {
		const buf = await readFile(join(process.cwd(), "assets/fonts/SpaceGrotesk-Bold.ttf"));
		return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
	} catch (e) {
		console.error("[og] font unavailable:", e);
		return null;
	}
}
