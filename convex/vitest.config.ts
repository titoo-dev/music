import { defineConfig } from "vitest/config";

// Config dédiée aux tests des fonctions Convex (convex-test).
// Environnement edge-runtime requis par convex-test ; séparé de la config
// racine (jsdom) qui couvre src/. Lancer via `npm run test:convex`.
export default defineConfig({
	test: {
		environment: "edge-runtime",
		server: { deps: { inline: ["convex-test"] } },
		include: ["convex/**/*.test.ts"],
	},
});
