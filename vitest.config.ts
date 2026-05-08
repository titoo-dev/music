import { defineConfig } from "vitest/config";
import { fileURLToPath } from "url";
import path from "path";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	resolve: {
		alias: {
			"@": path.resolve(dirname, "./src"),
		},
	},
	test: {
		globals: true,
		environment: "node",
		setupFiles: ["./src/test/setup.ts"],
		include: ["src/**/*.{test,spec}.{ts,tsx}"],
		exclude: ["node_modules", ".next", "dist"],
		environmentMatchGlobs: [
			["src/components/**", "jsdom"],
			["src/hooks/**", "jsdom"],
			["src/stores/**", "jsdom"],
		],
		clearMocks: true,
		restoreMocks: true,
		coverage: {
			provider: "v8",
			reporter: ["text", "html", "json-summary", "lcov"],
			reportsDirectory: "./coverage",
			// Scope coverage to the files we have explicitly locked in. Adding
			// new untested files here will drop the average and fail the gate.
			// As you add tests for new modules, append them here.
			include: [
				"src/stores/usePlayerStore.ts",
				"src/stores/usePreviewStore.ts",
				"src/stores/useTrackActionStore.ts",
				"src/lib/library.ts",
				"src/app/api/v1/_lib/helpers.ts",
				"src/app/api/v1/stream/**",
				"src/app/api/v1/stream-progressive/**",
				"src/app/api/v1/stream-url/**",
				"src/app/api/v1/library/**",
				"src/app/api/v1/recent-plays/**",
				"src/app/api/v1/preferences/**",
			],
			exclude: [
				"**/*.test.{ts,tsx}",
				"**/*.spec.{ts,tsx}",
				"src/test/**",
			],
			// Global thresholds — set just below the current baseline so a real
			// regression (deleted tests, dead code paths) trips CI, but a small
			// refactor doesn't have to chase the last percent. Tighten as the
			// suite grows. Per-file enforcement is intentionally off because
			// `library.ts` has known-untested helpers (playlist/share helpers
			// outside the user-library scope locked in this pass).
			thresholds: {
				lines: 90,
				branches: 85,
				functions: 90,
				statements: 90,
			},
		},
	},
});
