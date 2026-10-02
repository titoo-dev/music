# Déploiement sur Vercel

Wavelet tourne entièrement dans Next.js (pages + routes `src/app/api/v1/`), sans service Node externe.

| Besoin | Service Vercel |
|---|---|
| Hébergement + API | Vercel Functions (Fluid compute, runtime Node.js) |
| Base de données | Postgres via la Marketplace (Neon) |
| Fichiers audio | Vercel Blob, store **privé** |

## 1. Créer le projet

1. Importer le repo sur [vercel.com/new](https://vercel.com/new). Le preset Next.js est détecté et `npm run build` lance `prisma generate && next build`.
2. **Storage → Create → Neon (Postgres)**, puis le connecter au projet. `DATABASE_URL` est injectée automatiquement.
3. **Storage → Create → Blob**, en accès **Private**, puis le connecter au projet. `BLOB_READ_WRITE_TOKEN` est injecté automatiquement.
4. **Settings → Environment Variables** : ajouter `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (l'URL de production), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, et si besoin `WAVELET_SERVICE_ARL`, `SPOTIFY_CLIENT_ID` et `SPOTIFY_CLIENT_SECRET` (voir `.env.example`).
5. Dans la console Google OAuth, ajouter `https://<domaine>/api/auth/callback/google` aux redirect URIs.

## 2. Schéma de la base

Le schéma est géré par des migrations Prisma (`prisma/migrations/`). Le build Vercel (`vercel.json` → `npm run vercel-build`) lance `prisma migrate deploy` avant `next build`, sur la connexion directe `DATABASE_URL_UNPOOLED` (le pooler Neon ne supporte pas les verrous de migration). Rien à faire à la main.

Pour modifier le schéma : éditer `prisma/schema.prisma`, puis lancer `npm run db:migrate -- --name <nom>` contre une base de dev. La migration générée est commitée, puis appliquée au prochain déploiement.

## 3. Développement local

```bash
vercel env pull .env.local   # BLOB_READ_WRITE_TOKEN (+ variables non sensibles)
npm run dev
```

Les variables Neon sont marquées « Sensitive » et ne sont pas récupérées par `vercel env pull`. En local, ajouter à la main dans `.env.local` la `DATABASE_URL` d'une branche Neon de dev. Le store Blob tiré est celui de la prod : prévoir un store dédié au dev pour ne pas y écrire.

## Fonctionnement du streaming

- **Premier play** (`/api/v1/stream-progressive/[trackId]`) : déchiffrement Deezer à la volée, streamé au navigateur. En parallèle, le fichier est écrit dans `/tmp`, tagué, puis uploadé dans Blob. Cette persistance tourne dans `after()` (`maxDuration = 300`), pour que Vercel ne gèle pas la fonction à la fin de la réponse.
- **Plays suivants** : `/api/v1/stream-url/[trackId]` renvoie une URL Blob pré-signée de 15 min, lue directement par le navigateur. Si elle échoue (CORS, réseau), le lecteur bascule sur le proxy same-origin `/api/v1/stream/[trackId]`, qui gère les `Range`.
- `WAVELET_DISABLE_PRESIGNED_URLS=1` force le proxy pour tout le monde.

## Migration depuis l'ancienne stack (S3 / MinIO / Docker)

Les fichiers S3 ne sont pas migrés. Les lignes `StoredTrack` avec `storageType` `s3` ou `local` sont supprimées automatiquement au premier play : le titre est re-streamé depuis Deezer, puis remis en cache dans Blob.

La séparation de stems (Demucs, BullMQ, Redis) a été retirée. Elle demandait Python et torch, plusieurs Go de RAM, et des jobs plus longs que la durée maximale d'une fonction.
