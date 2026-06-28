# Phase 4 — Bascule Auth vers Convex Better Auth (runbook opérationnel)

> **Nature** : bascule UNIQUE (pas de strangler — l'auth ne tourne pas en double).
> **Pré-requis** : Phase 3 terminée (faite). Fenêtre de maintenance recommandée.

## ✅ Déjà fait (autonome, vérifié)
- **Dépendances installées** : `better-auth@1.6.20`, `@convex-dev/better-auth@0.12.4` (le bump 1.5→1.6 ne casse PAS l'auth Prisma live ni le gate — 424 tests verts, `tsc` clean).
- **Backend Convex déployé + validé** (déploiement dev `cheery-donkey-297`) :
  - `convex/convex.config.ts` (composant `app.use(betterAuth)`), `convex/auth.config.ts`,
    `convex/auth.ts` (`createAuth` avec Google, `getCurrentUser` via `safeGetAuthUser`),
    `convex/http.ts` (routes montées). **Le composant compile, déploie, crée ses tables d'auth.**
  - `getCurrentUser` renvoie `null` sans session (testé via `npx convex run auth:getCurrentUser`).
- **Secrets Convex posés (dev)** : `BETTER_AUTH_SECRET`, `SITE_URL`.

## ⏳ Reste à faire (OPÉRATIONNEL — non exécutable headless : console Google, données prod, navigateur)
L'auth **live** de l'app tourne TOUJOURS sur Prisma (`src/lib/auth.ts`) — rien n'est cassé.
Les étapes ci-dessous réalisent la bascule effective.

## 0. Sauvegarde (avant tout)

```bash
# Export des tables d'auth Postgres (rollback possible)
pg_dump "$DATABASE_URL" -t '"user"' -t session -t account -t verification \
  -t deezer_credential > backup-auth.sql
```

## 1. Dépendances

```bash
npm install @convex-dev/better-auth
npm install better-auth@~1.6.15   # bump 1.5.5 → 1.6.x (requis par le composant)
npm install convex@latest         # ≥ 1.25 (déjà 1.41)
```

⚠️ Après le bump, vérifier que `src/lib/auth.ts` (prismaAdapter) compile encore —
l'API `prismaAdapter`/`betterAuth` est stable en 1.6, mais relancer `tsc --noEmit`.

## 2. Composant Convex

**`convex/convex.config.ts`** — décommenter le composant :
```typescript
import { defineApp } from "convex/server";
import betterAuth from "@convex-dev/better-auth/convex.config";

const app = defineApp();
app.use(betterAuth);
export default app;
```

**`convex/auth.config.ts`** (nouveau) :
```typescript
import { getAuthConfigProvider } from "@convex-dev/better-auth/auth-config";
import type { AuthConfig } from "convex/server";

export default {
  providers: [getAuthConfigProvider()],
} satisfies AuthConfig;
```

**`convex/auth.ts`** (nouveau) — instance Better Auth DANS Convex, avec Google :
```typescript
import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { components } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { betterAuth } from "better-auth/minimal";
import authConfig from "./auth.config";

const siteUrl = process.env.SITE_URL!;

export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) =>
  betterAuth({
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },
    plugins: [convex({ authConfig })],
  });

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => authComponent.getAuthUser(ctx),
});
```

**`convex/http.ts`** (nouveau) :
```typescript
import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";

const http = httpRouter();
authComponent.registerRoutes(http, createAuth);
export default http;
```

## 3. Variables d'environnement Convex + Next

```bash
npx convex env set SITE_URL "https://<votre-domaine-public>"          # ex http://localhost:3000 en dev
npx convex env set GOOGLE_CLIENT_ID "$GOOGLE_CLIENT_ID"
npx convex env set GOOGLE_CLIENT_SECRET "$GOOGLE_CLIENT_SECRET"
# BETTER_AUTH_SECRET : déjà posé (dev). À poser aussi en prod.
```

`.env.local` (déjà partiellement présent — voir `.env.example`) :
```
NEXT_PUBLIC_CONVEX_SITE_URL=https://<deployment>.convex.site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 4. Google OAuth (console Google Cloud — manuel)

Ajouter l'URI de redirection autorisée :
```
https://<deployment>.convex.site/api/auth/callback/google
```
(Les routes Better Auth sont servies par les HTTP actions Convex, domaine `*.convex.site`.)

## 5. Helpers Next.js + provider + proxy

**`src/lib/auth-server.ts`** (nouveau) :
```typescript
import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";

export const {
  handler, preloadAuthQuery, isAuthenticated, getToken,
  fetchAuthQuery, fetchAuthMutation, fetchAuthAction,
} = convexBetterAuthNextJs({
  convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL!,
  convexSiteUrl: process.env.NEXT_PUBLIC_CONVEX_SITE_URL!,
});
```

**`src/app/api/auth/[...all]/route.ts`** (nouveau) :
```typescript
import { handler } from "@/lib/auth-server";
export const { GET, POST } = handler;
```

**`src/lib/convex/provider.tsx`** — remplacer `ConvexProvider` par :
```tsx
"use client";
import { ConvexReactClient } from "convex/react";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { authClient } from "@/lib/auth-client";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
export function ConvexClientProvider({ children, initialToken }: {
  children: React.ReactNode; initialToken?: string | null;
}) {
  return (
    <ConvexBetterAuthProvider client={convex} authClient={authClient} initialToken={initialToken}>
      {children}
    </ConvexBetterAuthProvider>
  );
}
```
Monter `<ConvexClientProvider>` dans `src/app/layout.tsx` (racine).

**`src/lib/auth-client.ts`** — ajouter le plugin convex :
```typescript
import { createAuthClient } from "better-auth/react";
import { convexClient } from "@convex-dev/better-auth/client/plugins";
export const authClient = createAuthClient({ plugins: [convexClient()] });
```

## 6. Réécrire les guards (`src/app/api/v1/_lib/helpers.ts`)

`requireUser` lit aujourd'hui `auth.api.getSession({ headers })` (prismaAdapter).
Le remplacer par le token Convex Better Auth :

```typescript
import { getToken, fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@convex/_generated/api";

export async function requireUser(request: NextRequest) {
  try {
    const token = await getToken();           // lit le cookie de session
    if (!token) return { userId: null, session: null, error: fail("NOT_AUTHENTICATED", "Please sign in to continue.", 401) };
    const user = await fetchAuthQuery(api.auth.getCurrentUser, {});
    if (!user?._id) return { userId: null, session: null, error: fail("NOT_AUTHENTICATED", "Please sign in to continue.", 401) };
    return { userId: user._id, session: { user }, error: null };
  } catch {
    return { userId: null, session: null, error: fail("AUTH_ERROR", "Failed to validate session.", 500) };
  }
}
```
`requireDeezer`/`getGuestOrUserDz` réutilisent `requireUser` + `getDeezerCredential` (déjà sur le seam). **Mettre à jour `helpers.test.ts`** : mocker `@/lib/auth-server` au lieu de `@/lib/auth` (les 40 tests verrouillés doivent être re-pointés ici, en conservant les mêmes assertions de statut/erreur).

Supprimer `src/lib/auth.ts` (prismaAdapter) une fois les guards basculés.

## 7. Migration des identités (préserver les `userId`)

Les FK applicatives stockent `userId` = id Better-Auth d'origine (cuid). **Il FAUT
préserver ces id** dans le composant, sinon toutes les FK cassent.

- **Option préférée** : importer `user`/`account` dans les tables du composant
  Better-Auth en conservant les `id` (via `npx convex import` sur les tables du
  composant, ou un script de seed appelant l'API d'admin Better-Auth).
- **Repli** : table de correspondance `oldUserId → newUserId` + passe de
  remappage sur toutes les tables applicatives importées (Phase 2).
- **Dernier recours** : re-login forcé de tous les utilisateurs + re-saisie ARL
  Deezer (acceptable si peu d'utilisateurs). Les sessions Postgres sont invalidées
  de toute façon (secret/format différents).

## 8. Déploiement + vérification

```bash
npx convex dev --once          # déploie le composant + http.ts (crée les tables d'auth)
npm run build && npm run test  # gate
```
Vérifier manuellement : login Google, login ARL Deezer, `requireDeezer` OK,
lecture, partage public.

## 9. Rollback

Revenir au commit pré-Phase-4 + `psql "$DATABASE_URL" < backup-auth.sql`, tant que
les nouveaux comptes Convex n'ont pas divergé. Au-delà, rollback = perte des
inscriptions post-bascule.
