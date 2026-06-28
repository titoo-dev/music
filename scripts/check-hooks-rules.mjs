#!/usr/bin/env node
/**
 * Blocking guard for React Rules-of-Hooks violations.
 *
 * Why this exists: a conditional `usePlayerStore(...)` placed *after* an early
 * return in src/app/(main)/artist/page.tsx made the hook count vary between
 * renders and crashed the whole page in production with React error #310
 * ("Rendered fewer hooks than expected"). ESLint already flags this via
 * `react-hooks/rules-of-hooks`, but the repo's main lint job is advisory
 * (continue-on-error) because of unrelated legacy `any` / `jsx-no-undef` debt,
 * so the error never blocked the merge.
 *
 * This script runs ESLint with the project's own flat config (so the
 * react-hooks plugin is loaded) but fails the build *only* on rules-of-hooks
 * violations — surgical enough that the legacy debt can't drown it out.
 */
import { ESLint } from "eslint";

const RULE = "react-hooks/rules-of-hooks";

const eslint = new ESLint();
const results = await eslint.lintFiles(["src/**/*.{ts,tsx}"]);

const offenders = [];
for (const result of results) {
	for (const msg of result.messages) {
		if (msg.ruleId === RULE) {
			offenders.push({ file: result.filePath, msg });
		}
	}
}

if (offenders.length === 0) {
	console.log(`✓ No ${RULE} violations.`);
	process.exit(0);
}

console.error(`✗ Found ${offenders.length} ${RULE} violation(s):\n`);
const cwd = process.cwd() + "/";
for (const { file, msg } of offenders) {
	const rel = file.startsWith(cwd) ? file.slice(cwd.length) : file;
	console.error(`  ${rel}:${msg.line}:${msg.column}  ${msg.message}`);
}
console.error(
	`\nHooks must be called unconditionally, in the same order every render. ` +
		`Move every hook above any conditional \`return\`.`,
);
process.exit(1);
