/**
 * Generate PWA icons from SVG template.
 * Run: node scripts/generate-icons.mjs
 *
 * Uses sharp if available, otherwise falls back to writing SVGs
 * that can be converted manually.
 */

import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = join(__dirname, "..", "public", "icons");

const BG = "#FF2E00";
const FG = "#FFFFFF";

function createSvg(size, maskable = false) {
	const padding = maskable ? size * 0.2 : size * 0.1;
	const inner = size - padding * 2;
	const fontSize = inner * 0.65;
	const bgRect = maskable
		? `<rect width="${size}" height="${size}" fill="${BG}"/>`
		: `<rect x="${padding * 0.5}" y="${padding * 0.5}" width="${size - padding}" height="${size - padding}" fill="${BG}"/>`;

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${bgRect}
  <text x="${size / 2}" y="${size / 2}" font-family="sans-serif" font-weight="900" font-size="${fontSize}" fill="${FG}" text-anchor="middle" dominant-baseline="central">D</text>
</svg>`;
}

async function main() {
	let sharp;
	try {
		sharp = (await import("sharp")).default;
	} catch {
		console.log("sharp not found, writing SVG files instead...");
		console.log("Install sharp (npm i -D sharp) and re-run for PNG output.");
	}

	const icons = [
		{ name: "icon-192.png", size: 192, maskable: false },
		{ name: "icon-512.png", size: 512, maskable: false },
		{ name: "icon-maskable-512.png", size: 512, maskable: true },
		{ name: "apple-touch-icon.png", size: 180, maskable: false },
	];

	for (const icon of icons) {
		const svg = createSvg(icon.size, icon.maskable);

		if (sharp) {
			const png = await sharp(Buffer.from(svg)).png().toBuffer();
			const outPath = join(ICONS_DIR, icon.name);
			writeFileSync(outPath, png);
			console.log(`Generated ${icon.name} (${icon.size}x${icon.size})`);
		} else {
			const svgName = icon.name.replace(".png", ".svg");
			writeFileSync(join(ICONS_DIR, svgName), svg);
			console.log(`Written ${svgName} (convert to PNG manually)`);
		}
	}

	console.log("\nDone!");
}

main().catch(console.error);
