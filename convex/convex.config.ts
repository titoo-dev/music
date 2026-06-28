// Définition de l'app Convex (composants).
//
// Phase 0 : aucun composant. Phase 4 : on enregistre le composant Better Auth
// pour faire tourner l'authentification DANS Convex (voir docs/CONVEX_MIGRATION.md).
//
//   import betterAuth from "@convex-dev/better-auth/convex.config";
//   app.use(betterAuth);

import { defineApp } from "convex/server";
import betterAuth from "@convex-dev/better-auth/convex.config";

const app = defineApp();
app.use(betterAuth);

export default app;
