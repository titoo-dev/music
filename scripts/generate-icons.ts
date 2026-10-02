/**
 * Rasterise the wavelet mark (src/lib/logo.ts) into every icon the app ships:
 * the SVG/ICO favicons and apple-icon (Next.js metadata file conventions in
 * src/app/), plus the PWA manifest icons in public/icons/.
 *
 * Run: npm run icons
 */

import { writeFileSync } from "fs";
import { join } from "path";
import sharp from "sharp";
import { logoSvg, type LogoSvgOptions } from "../src/lib/logo";

const ROOT = join(__dirname, "..");
const APP = join(ROOT, "src", "app");
const PUBLIC = join(ROOT, "public");

/** Favicon sizes get a heavier stroke and no glow so the curve survives 16 px. */
const SMALL: LogoSvgOptions = { glow: false, strokeWidth: 7 };
/** iOS / Android crop the square themselves — fill it, keep the wave in the safe zone. */
const MASKABLE: LogoSvgOptions = { fullBleed: true, scale: 0.78 };
const APPLE: LogoSvgOptions = { fullBleed: true, scale: 0.86 };

const png = (opts: LogoSvgOptions & { size: number }) => sharp(Buffer.from(logoSvg(opts))).png().toBuffer();

/** ICO container with PNG-encoded entries (supported by every browser since Vista). */
function ico(images: { size: number; data: Buffer }[]): Buffer {
	const header = Buffer.alloc(6);
	header.writeUInt16LE(0, 0); // reserved
	header.writeUInt16LE(1, 2); // type: icon
	header.writeUInt16LE(images.length, 4);
	let offset = 6 + 16 * images.length;
	const entries = images.map(({ size, data }) => {
		const e = Buffer.alloc(16);
		e.writeUInt8(size >= 256 ? 0 : size, 0);
		e.writeUInt8(size >= 256 ? 0 : size, 1);
		e.writeUInt8(0, 2); // palette
		e.writeUInt8(0, 3); // reserved
		e.writeUInt16LE(1, 4); // colour planes
		e.writeUInt16LE(32, 6); // bpp
		e.writeUInt32LE(data.length, 8);
		e.writeUInt32LE(offset, 12);
		offset += data.length;
		return e;
	});
	return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

async function main() {
	const write = (path: string, data: Buffer | string) => {
		writeFileSync(path, data);
		console.log(`  ${path.slice(ROOT.length + 1).replaceAll("\\", "/")}`);
	};

	// Browser tab: modern browsers take the SVG, the ICO covers the rest.
	write(join(APP, "icon.svg"), logoSvg({ size: 32, ...SMALL }));
	write(
		join(APP, "favicon.ico"),
		ico(await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await png({ size, ...SMALL }) })))),
	);

	const apple = await png({ size: 180, ...APPLE });
	write(join(APP, "apple-icon.png"), apple);
	// iOS also probes /apple-touch-icon.png directly, without reading the <link>.
	write(join(PUBLIC, "apple-touch-icon.png"), apple);

	write(join(PUBLIC, "icons", "icon-192.png"), await png({ size: 192 }));
	write(join(PUBLIC, "icons", "icon-512.png"), await png({ size: 512 }));
	write(join(PUBLIC, "icons", "icon-maskable-512.png"), await png({ size: 512, ...MASKABLE }));
	write(join(PUBLIC, "logo.svg"), logoSvg({ size: 512 }));
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
