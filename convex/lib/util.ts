// Helpers partagés des fonctions Convex (non exportés en tant qu'endpoints :
// ce fichier n'enregistre aucun query/mutation).

/**
 * Génère un id texte pour le champ `id` (cuid d'origine conservé pour les FK).
 * Pour les enregistrements créés directement via Convex. En mode dual-write,
 * les mutations acceptent un `id` explicite (le cuid produit par Prisma).
 */
export function newId(): string {
	return crypto.randomUUID();
}

/** Hex aléatoire (équivalent de randomBytes(n).toString("hex")) pour les shareId. */
export function randomHex(bytes: number): string {
	const buf = new Uint8Array(bytes);
	crypto.getRandomValues(buf);
	return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}
