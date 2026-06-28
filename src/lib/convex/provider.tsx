"use client";

// Provider Convex côté navigateur. Monté UNIQUEMENT en mode AUTH_BACKEND=convex
// (cf. MaybeConvexProvider ci-dessous) — en mode prisma (défaut) l'app rend ses
// enfants directement, comportement inchangé. Active les souscriptions réactives
// (useQuery) + l'auth Convex. Voir docs/PHASE4_AUTH_CUTOVER.md / CONVEX_MIGRATION.md.

import { ReactNode, useState, type ComponentProps } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { createAuthClient } from "better-auth/react";
import { convexClient } from "@convex-dev/better-auth/client/plugins";

// Client d'auth dédié au provider (toujours plugué convex — ce composant n'est
// rendu qu'en mode convex). Le client partagé src/lib/auth-client.ts reste
// conditionnel pour ne pas altérer le flux de login en mode prisma.
const convexAuthClient = createAuthClient({ plugins: [convexClient()] });

export function ConvexClientProvider({
	children,
	initialToken,
}: {
	children: ReactNode;
	initialToken?: string | null;
}) {
	const [client] = useState(() => {
		const url = process.env.NEXT_PUBLIC_CONVEX_URL;
		if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
		return new ConvexReactClient(url);
	});

	return (
		<ConvexBetterAuthProvider
			client={client}
			// Friction de types better-auth↔composant (useSession data: never) —
			// le plugin convex est bien présent au runtime ; on cale sur le type du prop.
			authClient={
				convexAuthClient as unknown as ComponentProps<
					typeof ConvexBetterAuthProvider
				>["authClient"]
			}
			initialToken={initialToken ?? undefined}
		>
			{children}
		</ConvexBetterAuthProvider>
	);
}

/**
 * Convex est désormais le seul backend (Phase 6) → le provider est toujours
 * monté. Alias conservé pour ne pas toucher l'import de layout.tsx.
 */
export function MaybeConvexProvider({ children }: { children: ReactNode }) {
	return <ConvexClientProvider>{children}</ConvexClientProvider>;
}
