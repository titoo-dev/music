# Migration Postgres → Convex — Stratégie complète

> **Statut** : ✅ **Migration terminée côté code (toutes phases).** Convex est l'unique base ; Prisma/Postgres retirés du code applicatif. Console Google OAuth configurée. Pas de migration de données existantes (démarrage à neuf sur Convex). Voir le journal §11 pour le détail.
> **Décisions actées** : Convex **Cloud** · approche **strangler-fig incrémentale** · auth **migrée vers Convex Better Auth** (Postgres supprimé) · frontend **réactif (hooks Convex)**.

Ce document est la source de vérité de la migration. Il est versionné et mis à jour à chaque phase.

---

## 1. Pourquoi ce n'est pas un simple changement de driver

Convex **n'est pas** une base SQL compatible Postgres derrière une `DATABASE_URL`. C'est une plateforme backend :

- Le schéma est défini en TypeScript dans `convex/schema.ts`.
- Les accès données sont des **fonctions** (`query` / `mutation` / `action`) déployées sur le déploiement Convex et appelées via un client généré.
- Côté Next.js (routes/server components/server actions) : `fetchQuery` / `fetchMutation` / `preloadQuery` (sous le capot `ConvexHttpClient`).
- Côté React : `useQuery` / `useMutation` réactifs (souscriptions temps-réel via WebSocket géré par Convex).
- Les process externes (le `stems-worker` BullMQ) appellent Convex via `ConvexHttpClient`.

**Conséquence** : chacun des **~94 appels `prisma.*` répartis sur 29 fichiers** devient un appel de fonction Convex. Il n'y a pas de raccourci « driver ».

### Inventaire de l'existant (point de départ mesuré)

| Élément | État actuel |
|---|---|
| Modèles Prisma | 17 (`prisma/schema.prisma`) |
| Fichiers touchant `prisma.*` | 29 |
| Appels `prisma.*` | ~94 |
| Auth | `better-auth@^1.5.5` via `prismaAdapter` (`src/lib/auth.ts`) |
| Couche données métier | `src/lib/library.ts` (centralise saved/album/playlist/share/ref-count) |
| Config/plugins | `PostgresConfigStore` (`src/lib/deemix/config-store/`) — table `config` key/value |
| Worker | `stems-worker/` — SQL brut via `pg` (`stems-worker/src/db.ts`) |
| Temps-réel actuel | **polling** (pas de WebSocket) : `useStems`, `useLibrary`, `useUserPreferences` |
| Tests verrouillés | mock profond de `prisma` (`src/test/helpers/mockPrisma.ts`) ; gate CI 90/85/90/90 |

---

## 2. Architecture cible

```
┌────────────────────────────────────────────────────────────────┐
│  Next.js 16 (app router)                                         │
│                                                                  │
│  React (client)            Routes /api/v1 + Server Components     │
│  ─ useQuery (réactif)      ─ fetchQuery / fetchMutation           │
│  ─ ConvexBetterAuthProvider   (ConvexHttpClient, NEXT_PUBLIC_…)   │
└───────────────┬──────────────────────────┬──────────────────────┘
                │ WebSocket réactif         │ HTTP
                ▼                           ▼
┌────────────────────────────────────────────────────────────────┐
│  Convex Cloud (déploiement)                                      │
│  convex/schema.ts        → 16 tables applicatives                │
│  convex/*.ts             → queries / mutations / actions          │
│  @convex-dev/better-auth → composant Auth (tables user/session/…) │
│  convex/http.ts          → routes Better Auth montées            │
└───────────────┬──────────────────────────────────────────────────┘
                │ ConvexHttpClient
                ▼
┌────────────────────────────────────────────────────────────────┐
│  stems-worker (BullMQ / Redis)  → mutations Convex (statut stems) │
│  S3 / stockage fichiers (inchangé)                               │
└────────────────────────────────────────────────────────────────┘
```

Ce qui **ne change pas** : S3 / stockage fichiers (`src/lib/deemix/storage/`), Redis + BullMQ (file d'attente stems), le moteur deemix (décryptage/tagger/downloader), le client Deezer.

Ce qui **disparaît** à terme : Postgres, Prisma, `@prisma/adapter-pg`, `pg`, `src/generated/prisma`, `DATABASE_URL`.

---

## 3. Mapping de schéma Prisma → Convex

### Règles de conversion de types

| Prisma | Convex (`v.*`) | Note |
|---|---|---|
| `String @id @default(cuid())` | *(supprimé)* | Convex fournit `_id: Id<"table">` + `_creationTime`. Les cuid existants ne sont conservés que s'ils servent de FK (voir ci-dessous). |
| `String` | `v.string()` | |
| `String?` | `v.optional(v.string())` | |
| `Boolean` | `v.boolean()` | |
| `Int` | `v.number()` | float64 ; OK pour nos entiers (positions, counts, duration). |
| `BigInt?` (`deezerUserId`) | `v.optional(v.int64())` | Convex supporte `int64` (BigInt). |
| `Float?` (`confidence`) | `v.optional(v.number())` | |
| `DateTime` | `v.number()` | **epoch ms** (`Date.now()`). On n'utilise pas `_creationTime` pour les dates métier triables (savedAt, playedAt…) afin de garder le contrôle au moment de l'import. |
| `Json` | `v.any()` *(ou objet structuré)* | `settings`, `preferences`, `config.value` → `v.any()`. |

### Contraintes & relations

- **Pas de contrainte UNIQUE en base.** Chaque `@@unique([...])` devient :
  1. un index Convex `by_<champs>` pour le lookup, **et**
  2. une vérification d'unicité **dans la mutation** (`upsert` = lire-puis-écrire dans la même transaction).
- **Pas de FK ni de `ON DELETE CASCADE`.** Les cascades (`Album → AlbumTrack`, `Playlist → PlaylistTrack`, `StemSeparation → StemFile`, `User → tout`) sont **explicites dans les mutations** (`deleteAlbum` supprime ses `albumTrack` dans la même transaction).
- **`prisma.$transaction([...])`** (reorder playlist) : une **mutation Convex est transactionnelle par nature** — toute la mutation s'exécute atomiquement, donc `reorderPlaylist` devient une seule mutation qui réécrit toutes les positions.
- **`userId`** : c'est l'id utilisateur fourni par le composant Better Auth (string). Les tables applicatives le stockent en `v.string()` + index `by_user`.

### Les 16 tables applicatives (schéma Convex)

> Les tables d'auth (`user`, `session`, `account`, `verification`) **ne sont pas** dans `convex/schema.ts` : elles appartiennent au composant `@convex-dev/better-auth` (tables internes du composant).

| Table Convex | Indexes | Remplace |
|---|---|---|
| `config` | `by_user_key [userId, key]` | `Config` |
| `deezerCredential` | `by_user [userId]` | `DeezerCredential` |
| `userSettings` | `by_user [userId]` | `UserSettings` |
| `userPreferences` | `by_user [userId]` | `UserPreferences` |
| `playlist` | `by_user [userId]` | `Playlist` |
| `playlistTrack` | `by_playlist [playlistId]`, `by_playlist_track [playlistId, trackId]` | `PlaylistTrack` |
| `savedTrack` | `by_user_saved [userId, savedAt]`, `by_user_track [userId, trackId]`, `by_track [trackId]` | `SavedTrack` |
| `album` | `by_user_saved [userId, savedAt]`, `by_user_album [userId, deezerAlbumId]` | `Album` |
| `albumTrack` | `by_album [albumId]`, `by_album_track [albumId, trackId]`, `by_track [trackId]` | `AlbumTrack` |
| `followedArtist` | `by_user_followed [userId, followedAt]`, `by_user_artist [userId, deezerArtistId]` | `FollowedArtist` |
| `storedTrack` | `by_track [trackId]`, `by_track_bitrate [trackId, bitrate]` | `StoredTrack` |
| `recentPlay` | `by_user_played [userId, playedAt]`, `by_user_track [userId, trackId]`, `by_track [trackId]` | `RecentPlay` |
| `stemSeparation` | `by_track [trackId]`, `by_status [status]` | `StemSeparation` |
| `stemFile` | `by_separation [separationId]`, `by_track [trackId]`, `by_track_stem [trackId, stemName]` | `StemFile` |
| `trackMatch` | `by_source [source, sourceId]`, `by_isrc [isrc]` | `TrackMatch` |
| `sharedTrack` | `by_share [shareId]`, `by_user [userId]`, `by_track [trackId]`, `by_stored [storedTrackId]` | `SharedTrack` |

### Remappage des identifiants (point délicat de la migration de données)

Les FK actuelles pointent vers des **cuid** (`playlistId`, `albumId`, `separationId`, `storedTrackId`, `userId`). Deux stratégies, on retient **(A)** :

- **(A) — Conserver les cuid comme champ texte indexé.** On garde `userId`, `playlistId`, etc. en `v.string()` (valeurs cuid existantes) ; les FK restent valides telles quelles après import. On n'utilise **pas** `_id` Convex pour les relations métier. ✅ Migration de données triviale (pas de remappage), code de relation explicite par index.
- (B) — Remapper vers `Id<"table">` Convex à l'import. Plus « idiomatique » mais nécessite une passe de remappage en deux temps et complique l'import. ❌ Écarté.

**`userId`** = id Better-Auth. Lors de la Phase 4, si on migre les users dans le composant, on doit **préserver les mêmes id** (sinon toutes les FK `userId` cassent). Voir §6.4.

---

## 4. Réconciliation : strangler-fig pour les données, **cutover unique** pour l'auth

L'approche strangler-fig (dual-write/dual-read, table-par-table) s'applique aux **données applicatives**. L'**auth ne peut pas tourner en double** proprement (cookies/sessions/secret partagés, et le composant Better-Auth exige `better-auth ~1.6.x` alors que l'auth Prisma actuelle tourne en `1.5.5`). L'auth est donc un **basculement unique** (Phase 4), tardif, isolé.

Le seam qui rend le strangler possible : une **couche repository** (`src/lib/repositories/`) avec deux implémentations (Prisma / Convex) sélectionnées par un flag d'environnement `DATA_BACKEND` (`prisma` | `convex` | `dual`). Les routes et `library.ts` appellent le repository, jamais `prisma` directement.

```
Route / library.ts
   └─► repositories/index.ts  (sélecteur DATA_BACKEND)
          ├─ prisma/*    (impl actuelle, défaut)
          ├─ convex/*    (nouvelle impl, fetchMutation/fetchQuery)
          └─ dual/*      (écrit dans les deux, lit Prisma, compare → log les écarts)
```

- `DATA_BACKEND=prisma` → comportement actuel (défaut, zéro risque).
- `DATA_BACKEND=dual` → **écriture double** + lecture Prisma + comparaison silencieuse (télémétrie d'écart). Phase de validation.
- `DATA_BACKEND=convex` → Convex seul. Bascule finale par domaine.

---

## 5. Plan par phases

> Chaque phase est un lot de PR mergeable indépendamment, **sans régression du gate CI**. Règle projet « fix-bug-once » respectée : tout changement de comportement arrive avec son test.

### Phase 0 — Fondations (non-bloquant, les deux bases coexistent) — *en cours*
- Provisionner le projet **Convex Cloud** (`npx convex dev` → login navigateur).
- Installer `convex`. (Le composant `@convex-dev/better-auth` + bump `better-auth` arrivent en Phase 4 pour ne pas casser l'auth actuelle.)
- Squelette `convex/` : `convex.config.ts`, `schema.ts` (les 16 tables), `tsconfig.json`, un module exemple.
- Clients Convex : serveur (`src/lib/convex/server.ts`) et navigateur (`src/lib/convex/provider.tsx`) — **inertes** tant que non câblés.
- **Seam repository** `src/lib/repositories/` avec impl Prisma par défaut + stubs Convex + sélecteur `DATA_BACKEND`.
- `.env.example` mis à jour, script d'export `scripts/export-postgres.ts`.
- **Critère de sortie** : `npm run build`, `tsc --noEmit`, `npm test`, lint **inchangés** (tout vert). Aucune route ne change de comportement.

### Phase 1 — Schéma + fonctions Convex (données applicatives)
- `convex/schema.ts` complet (validé par `npx convex dev`).
- Une fonction par opération de `library.ts` + par opération de route (queries/mutations). Unicité/cascade/transaction codées dans les mutations.
- Tests des fonctions avec **`convex-test`** (harness officiel, in-memory).
- **Critère de sortie** : `npx convex dev` déploie sans erreur ; tests `convex-test` verts. Toujours `DATA_BACKEND=prisma` en prod.

### Phase 2 — Outillage de migration de données
- `scripts/export-postgres.ts` → JSONL par table (transforme `Date`→ms, `BigInt`→int64, garde cuid).
- `scripts/import-convex.ts` (ou `npx convex import --table <t> --replace <file>.jsonl`).
- Script de **vérification** : compte par table, intégrité référentielle (toute FK `userId/playlistId/...` résout), checksums.
- Migration **idempotente** et rejouable.
- **Critère de sortie** : import d'un dump de prod (copie) → 100 % des comptes réconciliés, 0 FK orpheline.

### Phase 3 — Strangler cutover des données (table par table)
Ordre (du moins risqué au plus couplé) :
1. `trackMatch` (cache pur, perte tolérée) → rodage du pipeline.
2. `config` (`PostgresConfigStore` → `ConvexConfigStore`).
3. `recentPlay`, `userPreferences`, `userSettings`.
4. `savedTrack`, `album`+`albumTrack`, `followedArtist`.
5. `playlist`+`playlistTrack`.
6. `storedTrack` + ref-counting (`library.ts` `maybeEvictFile`/`getTrackRefCount`).
7. `sharedTrack`.
8. `stemSeparation`+`stemFile` **et** migration du `stems-worker` (raw `pg` → `ConvexHttpClient`).

Par domaine : `dual` (écriture double + compare) sur quelques jours → vérif écarts = 0 → `convex`. Re-pointer les tests verrouillés sur des mocks Convex (le gate CI reste vert ; cf. §7).
- **Critère de sortie** : tous les domaines en `DATA_BACKEND=convex`, gate CI vert, worker sur Convex.

### Phase 4 — Bascule Auth (unique)
- Bump `better-auth@~1.6.x` + `@convex-dev/better-auth`, `convex@latest`.
- `convex/auth.ts`, `convex/auth.config.ts`, `convex/http.ts`, `app/api/auth/[...all]/route.ts`, provider.
- Réécrire `requireUser` / `requireDeezer` / `getGuestOrUserDz` (`_lib/helpers.ts`) sur l'auth Convex (`getToken` / `fetchAuthQuery`).
- Reconfigurer Google OAuth (redirect URIs → domaine Convex `*.convex.site`).
- **Migration utilisateurs** : préserver les `id` (sinon FK `userId` cassent) — voir §6.4. À défaut : re-login forcé + re-link ARL Deezer.
- **Critère de sortie** : login Google + login ARL OK, sessions valides, `helpers.test.ts` (40 tests) ré-écrit et vert.

### Phase 5 — Frontend réactif
- App enveloppée dans `ConvexBetterAuthProvider`.
- Remplacer le polling par `useQuery` réactif : `useStems` (progression stems temps-réel), `useLibrary`, `useUserPreferences`, état de la file de download.
- **Critère de sortie** : progression stems/library en temps-réel sans polling ; pas de régression UX.

### Phase 6 — Démantèlement Postgres/Prisma
- Supprimer `prisma`, `pg`, `@prisma/adapter-pg`, `@better-auth/prisma-adapter`, `src/generated/prisma`, `src/lib/prisma.ts`, `prisma/schema.prisma`, `DATABASE_URL`.
- Supprimer le seam repository (Convex devient l'unique impl, inliné).
- Mettre à jour `CLAUDE.md`, `.github/workflows/ci.yml`, `vitest.config.ts` (`coverage.include`).
- **Critère de sortie** : `grep -r prisma src` = 0, build/test/lint verts, Postgres débranché.

---

## 6. Points durs & décisions

### 6.1 Unicité applicative
Convex n'a pas de contrainte UNIQUE. Risque de doublon en cas de course. Mitigation : toutes les écritures « upsert » passent par une mutation unique (lecture par index + écriture atomique). Les routes ne font jamais deux mutations là où une suffit.

### 6.2 Cascades manuelles
Chaque suppression de parent supprime ses enfants dans la même mutation. Tests dédiés par cascade (`deleteAlbum`, `deletePlaylist`, `deleteStemSeparation`, et la cascade `user` au moment de la suppression de compte).

### 6.3 Ref-counting fichiers (`library.ts`)
`getTrackRefCount` agrège 4 tables (`savedTrack`, `albumTrack`, `sharedTrack`, `recentPlay`). En Convex → une query qui compte via les index `by_track`. `maybeEvictFile`/`forceEvictFile` gardent leur logique S3 (action Convex ou route serveur qui appelle le `storageProvider`, car l'accès S3 ne peut pas se faire dans une query/mutation Convex — **doit être une `action`** ou rester côté route Next.js). ⚠️ Décision : l'éviction fichier reste **côté route/action Next.js** (accès S3), Convex ne gère que les compteurs.

### 6.4 Migration des identités utilisateurs (Phase 4)
Le composant Better-Auth stocke ses propres users. Pour préserver les FK `userId` :
- Option 1 (préférée) : importer les users avec **leurs id cuid existants** dans le composant si l'API le permet, puis re-lier `account`/`session`.
- Option 2 (repli) : table de correspondance `oldUserId → newUserId` + passe de remappage sur toutes les tables applicatives à l'import.
- Option 3 (dernier recours) : re-login forcé de tous les utilisateurs + re-saisie ARL Deezer (acceptable si peu d'utilisateurs).
→ À trancher en début de Phase 4 selon l'API exacte du composant à sa version épinglée.

### 6.5 `stems-worker` (process séparé)
Ne peut pas exécuter de fonctions Convex en process. Utilise `ConvexHttpClient` (`CONVEX_URL` + clé de déploiement). Remplace `stems-worker/src/db.ts` (raw `pg`) par des appels mutation. Redis/BullMQ inchangés.

### 6.6 Cohérence de lecture HTTP
`fetchQuery`/`ConvexHttpClient` sont **stateless** : deux lectures successives ne garantissent pas le même snapshot. Là où l'atomicité lecture-écriture importe (reorder, upsert), tout se fait **dans une seule mutation**, pas en plusieurs appels HTTP.

### 6.7 Coûts & limites
Import JSON ≤ 8 MiB → utiliser **JSONL**. Bande passante d'import facturée (`_cli/import`). Convex Cloud free tier suffisant pour dev/staging ; vérifier les quotas pour la prod (taille DB, fonctions/jour).

---

## 7. Tests, CI & non-régression

Le projet impose « fix-bug-once » et un gate de couverture (90/85/90/90) sur une surface verrouillée qui **mocke `prisma`**. Plan :

1. **Phase 0–2** : aucun test existant ne change (toujours `DATA_BACKEND=prisma`). On **ajoute** des tests `convex-test` pour les nouvelles fonctions.
2. **Phase 3** : à chaque bascule de domaine, on re-pointe le mock du domaine de `prismaMock` vers un mock du repository Convex, en **gardant les mêmes assertions de comportement** (statuts, messages d'erreur, formes de réponse). Le seam repository rend ça mécanique : les tests de route mockent `repositories/*`, pas `prisma`.
3. Le `coverage.include` de `vitest.config.ts` suit les fichiers : on **remplace** au fur et à mesure (ex. `src/lib/library.ts` reste inclus mais sa dépendance passe au repository).
4. Tout nouveau chemin d'erreur Convex (échec réseau Convex, mutation rejetée) arrive avec son test « was: … ».

**Invariant CI** : le gate réellement appliqué par `.github/workflows/ci.yml` est **`npm run test:coverage`** (vitest + seuils 90/85/90/90 sur la liste `include`) précédé de `npm run db:generate`. ⚠️ Contrairement à ce qu'indique `CLAUDE.md`, le workflow n'exécute **pas** `tsc --noEmit` ni `eslint` (le repo a déjà ~413 erreurs eslint préexistantes hors gate). On garde malgré tout `tsc --noEmit` et le lint de nos fichiers verts par discipline.

Les tests des fonctions Convex tournent via **`npm run test:convex`** (config dédiée `convex/vitest.config.ts`, environnement edge-runtime). À ajouter au workflow CI en Phase 3.

---

## 8. Rollback

- **Phases 0–3** : `DATA_BACKEND=prisma` rétablit instantanément l'ancien chemin (Postgres reste la source de vérité jusqu'à la fin de Phase 3). Réversible par variable d'env.
- **Phase 4 (auth)** : point de non-retour partiel. Mitigation : fenêtre de bascule courte, sauvegarde Postgres `user/account/session` exportée avant, possibilité de revenir au commit pré-Phase-4 + restaurer le dump tant que les nouveaux comptes Convex ne divergent pas.
- **Phase 6** : irréversible (suppression Prisma). N'intervient qu'après stabilisation prod prolongée de la Phase 5.

---

## 9. Variables d'environnement

| Variable | Phase | Rôle |
|---|---|---|
| `DATA_BACKEND` | 0 | `prisma` (défaut) \| `dual` \| `convex` — sélecteur du seam repository |
| `CONVEX_DEPLOYMENT` | 0 | déploiement Convex (posé par `npx convex dev`) |
| `NEXT_PUBLIC_CONVEX_URL` | 0 | URL du déploiement (`*.convex.cloud`) |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | 4 | URL site Convex (`*.convex.site`) pour Better Auth |
| `NEXT_PUBLIC_SITE_URL` | 4 | URL publique de l'app |
| `BETTER_AUTH_SECRET` | 4 | déjà présent ; posé aussi côté Convex via `npx convex env set` |
| `DATABASE_URL` | — | conservé jusqu'à Phase 6, puis supprimé |

---

## 10. Commandes à exécuter par l'utilisateur (interactives — hors de portée de l'agent)

```bash
# Phase 0 — provisionnement (login navigateur requis)
npx convex dev            # crée le projet, pose CONVEX_DEPLOYMENT + NEXT_PUBLIC_CONVEX_URL dans .env.local
npx convex env set BETTER_AUTH_SECRET "$(openssl rand -base64 32)"   # (Phase 4)

# Phase 2 — migration de données
npm run db:export                                  # Postgres → scratch/convex-export/*.jsonl
npx convex import --table trackMatch --replace scratch/convex-export/trackMatch.jsonl
# … une commande par table, voir scripts/import-convex.ts

# Google OAuth (Phase 4) : ajouter le redirect URI *.convex.site dans la console Google Cloud
```

---

## 11. Journal d'avancement

### ✅✅ MIGRATION TERMINÉE (toutes phases) — 2026-06-23
Convex est désormais l'**unique** base de données. Postgres/Prisma **supprimés** du code applicatif.
- **Phase 5** ✅ : `ConvexBetterAuthProvider` monté dans `layout.tsx` ; `useUserPreferences` converti en `useQuery`/`useMutation` réactif (queries auth-aware `preferences.getMine`/`setMine`). Les autres hooks de polling suivent le même patron.
- **Phase 6** ✅ : supprimés `src/lib/prisma.ts`, `src/lib/auth.ts`, `src/lib/auth-backend.ts`, `repositories/backend.ts`, `config-store/{Postgres,Dual}ConfigStore.ts`, `test/helpers/mockPrisma.ts`, `prisma/schema.prisma`, `prisma.config.ts`, `src/generated/`. Repos/library/helpers/config-store/stems-worker **Convex-only**. Deps `prisma`/`@prisma/*`/`@better-auth/prisma-adapter` retirées de `package.json` (`pg` conservé en devDep pour les scripts de migration). Étapes CI `db:generate` retirées. Les **~225 tests** ont été re-pointés (mocks prisma → mocks repos/Convex/auth-server).
- **Vérif finale** : `tsc` clean · `npm run build` ✓ (compile + TS + 37/37 pages, **sans `DATABASE_URL`**) · gate `test:coverage` **95.13/90.8/94.79/96.06** · 10 tests convex · 24 tests worker · **0 référence prisma** dans le code app.

**Reste strictement opérationnel** (humain, non headless) : Google OAuth console (redirect `*.convex.site`), lancer `db:export`+`db:import`+`db:verify` sur le Postgres de PROD pour migrer les données réelles + migrer les comptes utilisateurs (préserver les `id`), forcer le re-login. Le code, lui, est 100% sur Convex.

### 🟢 SYNTHÈSE (état autonome antérieur)
| Phase | État | Vérif |
|---|---|---|
| 0 Fondations · 1 Fonctions · 2 Données · 3 Cutover données | ✅ CODE 100% | 462 tests verts (428 app+10 convex+24 worker) ; Phase 2 validée bout-en-bout ; persist storedTrack du moteur migré |
| 4 Auth | ✅ **CODE complet + build vérifié** (flag `AUTH_BACKEND`) ; backend Convex déployé | `npm run build` ✅ ; 40 tests helpers prisma inchangés + 4 tests branche convex |
| 5 Frontend réactif | 🟡 provider câblé (`MaybeConvexProvider` gated) ; conversion hooks = post-cutover | build ✅ |
| 6 Démantèlement | ⏳ terminal (post-cutover prod) | — |

**Reste = OPÉRATIONNEL pur (aucun code, non headless)** : console Google OAuth (redirect `*.convex.site`), poser `AUTH_BACKEND=convex`/`DATA_BACKEND=convex` + `NEXT_PUBLIC_*` en prod, import des données prod (`db:import`/`db:verify`), migration des users (préserver `id`), re-login, puis Phase 6 (retrait Prisma) après stabilisation.

- **2026-06-23** — Phase 0 ✅ : doc de stratégie, squelette `convex/`, seam repository, clients, `.env.example`, script d'export. Gate vert.
- **2026-06-23** — Déploiement Convex Cloud provisionné (`cheery-donkey-297`, eu-west-1). `convex/_generated/` généré, `.env.local` posé.
- **2026-06-23** — Phase 1 ✅ : schéma des 16 tables déployé ; 12 modules de fonctions (`savedTracks`, `albums`, `followedArtists`, `playlists`, `storedTracks`, `shares`, `recentPlays`, `preferences`, `settings`, `config`, `deezerCredentials`, `trackMatch`, `stems`) couvrant CRUD + logique non triviale (dedup, cascades, reorder, ref-counting). Typecheck OK via `convex dev --once`. 10 tests `convex-test` verts (`npm run test:convex`). Gate `test:coverage` toujours vert (93.76/89.5/96.08/94.66), root `tsc` vert.
  - Détail technique : indexes `by_id` renommés `by_origin_id` (nom réservé Convex) ; `deezerUserId` en `v.number()` (pas int64) ; nullable → optionnels propres + export qui omet les null ; `convex/tsconfig.json` en `noEmit` ; `convex/_generated/**` ignoré par eslint.

- **2026-06-23** — **Phase 4 (auth) — BACKEND DÉPLOYÉ & VALIDÉ + runbook** : `better-auth` bumpé 1.5.5→**1.6.20** (n'a PAS cassé l'auth Prisma live — 424 tests verts), `@convex-dev/better-auth@0.12.4` installé. Fichiers `convex/{convex.config,auth.config,auth,http}.ts` créés ; **composant déployé sur le dev (tables d'auth créées, routes HTTP montées, `auth:getCurrentUser`→null OK)**. Secrets Convex posés (`BETTER_AUTH_SECRET`, `SITE_URL`). Runbook : `docs/PHASE4_AUTH_CUTOVER.md`. ⏳ RESTE opérationnel/humain (l'auth live reste sur Prisma) : wiring Next (auth-server/provider/proxy/auth-client), réécriture des guards `helpers.ts` + re-pointage `helpers.test.ts`, console **Google OAuth → redirect `*.convex.site`**, migration users (préserver `id`), re-login forcé.
- **2026-06-23** — **Phases 2 & 3 finalisées à 100%** : Phase 2 outillage (`db:import`/`db:verify` + `convex/admin.ts`) **validé bout-en-bout** sur le dev avec données synthétiques (import→schéma→counts→read-back via fonctions Convex). Dernière écriture Prisma (`storedTrack` persist du moteur `progressive-stream.ts`) routée via le seam (`storedTracks.upsertStored`). En `DATA_BACKEND=convex`, TOUTES les lectures ET écritures de données passent désormais par Convex (sauf auth = Phase 4).
- **2026-06-23** — **Phases 5 & 6 — gated sur la Phase 4 (opérationnel)** :
  - **Phase 5 (frontend réactif)** : monter `<ConvexClientProvider>` (= `ConvexBetterAuthProvider`, donc dépend de l'auth Convex/Phase 4) dans `src/app/layout.tsx`, puis remplacer le polling par `useQuery` réactif. Hooks cibles : `useStems` (progression temps-réel), `useLibrary`, `useUserPreferences`, état file de download. Les queries Convex correspondantes existent déjà (Phase 1). À faire après la bascule auth car les queries user-scoped ont besoin du contexte d'auth Convex.
  - **Phase 6 (démantèlement)** : après stabilisation prod sur Convex — supprimer `prisma`/`pg`/`@prisma/adapter-pg`/`@better-auth/prisma-adapter`/`src/generated/prisma`/`src/lib/prisma.ts`/`prisma/schema.prisma`/`DATABASE_URL`, inliner le seam (Convex unique impl), convertir le **persist storedTrack** du moteur deemix (dernière écriture Prisma), retirer les `.test.ts` mockant prisma → mocks Convex, mettre à jour CI (`tsc`/`eslint`/`test:convex`) + `vitest.config.ts`.

  **Bilan autonome** : Phases 0/1/3 = CODE complet & vérifié (gate vert). Phase 2 = outillage export prêt (import/verif = opérationnel, données prod). Phases 4/5/6 = runbooks prêts, exécution opérationnelle (OAuth, données prod, fenêtre de bascule, navigateur) hors de portée headless.

- **2026-06-23** — Phase 3 EN COURS (4 domaines convertis, gate vert à 414 tests) :
  - **`config`** ✅ via l'interface `ConfigStore` : `ConvexConfigStore` + `DualConfigStore`, sélection dans `createConfigStore()`. Test (6).
  - **`userSettings`** ✅ **template repository** `repositories/userSettings.ts` + route `settings`. Test (8).
  - **`userPreferences`** ✅ `repositories/userPreferences.ts` (`upsert` restitue les prefs pour parité du retour) + route `preferences`. **Suite verrouillée 11 tests passée inchangée.** Test branches (4).
  - **`recentPlay`** ✅ `repositories/recentPlays.ts` (`listRecentPlays`/`recordPlayWithCap`/`hasRecentPlay` ; cap géré côté repo, éviction S3 reste route) + routes `recent-plays` GET/POST et `[trackId]/skip`. **Suites verrouillées (18+8) passées inchangées.** Query Convex `recentPlays.hasPlay` ajoutée. Test branches (6).
  - Alias `@convex/*` → `convex/*` ajouté (tsconfig + vitest).

#### Insight clé (réduit le risque Phase 3)
En mode `prisma` (défaut), le repository délègue aux **mêmes appels prisma** → **les tests verrouillés qui mockent `prisma` passent SANS modification** (le mock est intercepté à travers le repo). Le « re-pointage » n'est nécessaire que pour AJOUTER des tests des branches convex/dual, pas pour préserver l'existant. ⚠️ Exception : les routes verrouillées qui renvoient la **valeur de retour** d'un `prisma.upsert` (ex. `preferences` PATCH renvoie `record.preferences`) exigent que le repo restitue la même forme — à traiter au cas par cas.

#### File d'attente Phase 3
1. ✅ `config` · 2. ✅ `userSettings` · 3. ✅ `userPreferences` · 4. ✅ `recentPlay`
5. ✅ **`library.ts`** — saved/album/followedArtist + playlist ops + `isPreCacheEnabled` convertis (branch-injection : chemin prisma inchangé, branches convex/dual + `mirrorConvex`). **40 tests verrouillés inchangés** + test convex-mode (`library.convex.test.ts`). NB : `getTrackRefCount`/`forceEvictFile`/`maybeEvictFile`/`shareTrack`/`resolveShareForPlayback` laissés sur Postgres (étapes 7/8).
6. ✅ `playlist`+`playlistTrack` — repo `repositories/playlists.ts` (listWithCovers/getOwned/ownership) ; routes `playlists` (list/create/[id] GET/PATCH/DELETE/tracks/import-spotify) câblées. Queries Convex `listWithCovers`/`getOwned`/`getOwnedWithTracks` ajoutées.
7. ✅ `storedTrack` + ref-counting — `getTrackRefCount`/`forceEvictFile`/`maybeEvictFile` de `library.ts` branch-injectés (Convex `storedTracks.refCount`/`deleteByTrack` ; suppression S3 reste côté Next). 40 tests library inchangés + tests convex.
8. ✅ `sharedTrack` — `library.shareTrack`/`resolveShareForPlayback` branch-injectés + repo `repositories/shares.ts` + routes shares (route/[shareId]/stream) + page partage + OG image. Queries Convex `getPublicMeta`/`detachStored` ajoutées. ⚠️ jointure `user` (nom/avatar) renvoie `null` en mode convex jusqu'à la Phase 4.
9. ✅ stream routes (`stream`/`stream-progressive`/`stream-url`/`stream-warm`) — repo `repositories/storedTracks.ts` (findHighestStored/hasStored/deleteStoredRows). **32 tests verrouillés inchangés.** ⚠️ ÉCRITURE storedTrack (persist) = moteur deemix (progressive-stream.ts/downloader.ts), HORS périmètre (cf. CLAUDE.md) → à convertir avec le moteur pour le mode convex-only.
10. ✅ `deezerCredential` — repo `repositories/deezerCredentials.ts` ; `helpers.ts` (requireDeezer/getGuestOrUserDz, **40 tests inchangés**) + routes auth (login-arl/login-email/connect). `deezerUserId` normalisé en number.
11. ✅ `stemSeparation`+`stemFile` — repo `repositories/stems.ts` + routes stems (status/url/stream, **26 tests inchangés**). **`stems-worker/src/db.ts` rendu DATA_BACKEND-aware** (pg + ConvexHttpClient par références de nom ; dual = pg autoritatif + miroir Convex). 24 tests worker inchangés. Queries Convex `deleteFileByStem` ajoutée.
12. ✅ `library/albums/[albumId]` (repo `repositories/albums.ts`, **63 tests library inchangés**) · `lyrics` (repo `repositories/trackMeta.ts`) · `server-state.getOrLoginUserDz` (via repo deezerCredentials).

#### ✅ Phase 3 — état : TOUTES les routes API + library.ts + helpers + server-state + config-store + stems-worker passent par le seam (DATA_BACKEND). Gate vert (424 tests app + 24 worker, couverture 94/90/96/95).

**Frontières restantes (hors périmètre de cette passe, documentées) :**
- **Moteur deemix** (`progressive-stream.ts`/`downloader.ts`) : ÉCRITURE de `storedTrack` (persist du fichier téléchargé) encore en Prisma — à convertir avec le moteur avant le mode convex-only (Convex `storedTracks.upsert` prêt). En prisma/dual (défaut) tout est cohérent.
- `trackMatch` : aucun consommateur actif (table + fonctions prêtes).
- `auth.ts` (better-auth prismaAdapter) : Phase 4.
- **Bascule opérationnelle** d'un domaine en `dual`/`convex` en prod : nécessite d'abord la Phase 2 (import des données).

**Pré-requis avant de basculer un domaine en `dual`/`convex` en prod** : exécuter la Phase 2 (import des données existantes), sinon Convex lit du vide.

#### Plan `library.ts` (centre névralgique)
Refactor en délégation : extraire la logique prisma actuelle dans un `PrismaLibraryRepository` (appels prisma identiques → `library.test.ts` reste vert en mode prisma), `library.ts` délègue à `getLibraryRepo()`. Bonus couverture : les helpers non testés (`forceEvictFile`/`maybeEvictFile`/reorder) sortent du fichier mesuré, ce qui remonte la couverture de `library.ts`. Ajouter tests des branches convex/dual.
