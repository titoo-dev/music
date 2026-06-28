import { createAuthClient } from "better-auth/react";
import { convexClient } from "@convex-dev/better-auth/client/plugins";

// Auth Convex (Postgres supprimé, Phase 6) : le plugin convexClient gère le
// token de session Convex côté navigateur.
export const authClient = createAuthClient({ plugins: [convexClient()] });
