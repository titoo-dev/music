# Déploiement sur Vercel

Wavelet tourne entièrement dans Next.js (pages + routes `src/app/api/v1/`), sans service Node externe.

| Besoin | Service Vercel |
|---|---|
| Hébergement + API | Vercel Functions (Fluid compute, runtime Node.js) |
| Base de données | Postgres via la Marketplace (Neon) |
| Fichiers audio | Cloudflare R2, bucket **privé** (hors Vercel) |

## 1. Créer le projet

1. Importer le repo sur [vercel.com/new](https://vercel.com/new). Le preset Next.js est détecté et `npm run build` lance `prisma generate && next build`.
2. **Storage → Create → Neon (Postgres)**, puis le connecter au projet. `DATABASE_URL` est injectée automatiquement.
3. **Cloudflare R2** : voir [Stockage audio](#stockage-audio-cloudflare-r2). Ajouter `R2_ACCOUNT_ID`, `R2_BUCKET`, `R2_ACCESS_KEY_ID` et `R2_SECRET_ACCESS_KEY` aux variables du projet.
4. **Settings → Environment Variables** : ajouter `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (l'URL de production), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, et si besoin `WAVELET_SERVICE_ARL`, `SPOTIFY_CLIENT_ID` et `SPOTIFY_CLIENT_SECRET` (voir `.env.example`).
5. Dans la console Google OAuth, ajouter `https://<domaine>/api/auth/callback/google` aux redirect URIs.

## 2. Schéma de la base

Le schéma est géré par des migrations Prisma (`prisma/migrations/`). Le build Vercel (`vercel.json` → `npm run vercel-build`) lance `prisma migrate deploy` avant `next build`, sur la connexion directe `DATABASE_URL_UNPOOLED` (le pooler Neon ne supporte pas les verrous de migration). Rien à faire à la main.

Pour modifier le schéma : éditer `prisma/schema.prisma`, puis lancer `npm run db:migrate -- --name <nom>` contre une base de dev. La migration générée est commitée, puis appliquée au prochain déploiement.

## 3. Développement local

```bash
vercel env pull .env.local   # R2_* du bucket de dev (+ variables non sensibles)
npm run dev
```

- **R2** : l'environnement Development a son propre bucket (`wavelet-music-dev`) et son propre token, qui n'a aucun droit sur le bucket de prod (`wavelet-music`).
- **Postgres** : les variables Neon sont « Sensitive » et ne sont pas récupérées par `vercel env pull`. En local, `DATABASE_URL` (dans `.env` ou `.env.local`) pointe vers un Postgres local, par exemple un conteneur Docker, ou vers une branche Neon de dev. Pour une base existante créée avant les migrations : `npx prisma db push`, puis `npx prisma migrate resolve --applied 0_init`.

## Fonctionnement du streaming

- **Premier play** (`/api/v1/stream-progressive/[trackId]`) : déchiffrement Deezer à la volée, streamé au navigateur. En parallèle, le fichier est écrit dans `/tmp`, tagué, puis uploadé dans R2. Cette persistance tourne dans `after()` (`maxDuration = 300`), pour que Vercel ne gèle pas la fonction à la fin de la réponse.
- **Plays suivants** : `/api/v1/stream-url/[trackId]` renvoie une URL R2 pré-signée de 15 min, lue directement par le navigateur (le transfert sortant R2 est gratuit et ne passe pas par Vercel). Si elle échoue (CORS, réseau), le lecteur bascule sur le proxy same-origin `/api/v1/stream/[trackId]`, qui gère les `Range`.
- `WAVELET_DISABLE_PRESIGNED_URLS=1` force le proxy pour tout le monde.
- **Stockage en panne ou qui refuse la lecture** (403, 5xx, config absente) : `/stream` redirige vers `/stream-progressive/[trackId]?live=1`, qui joue directement depuis Deezer sans repasser par le cache. Les lignes `StoredTrack` sont conservées.

## Stockage audio (Cloudflare R2)

Les fichiers audio sont dans R2 plutôt que dans Vercel Blob : en Hobby, Blob est limité à 10 Go de transfert par mois et bloque le store pendant 30 jours une fois la limite dépassée (c'est arrivé en octobre 2026). R2 n'a pas de frais de sortie et offre 10 Go de stockage gratuits.

- Deux buckets privés, région ENAM : `wavelet-music` (Production + Preview) et `wavelet-music-dev` (Development).
- CORS sur les deux : `GET`/`HEAD` depuis toutes les origines, en-têtes `range`, exposés `Content-Length`, `Content-Range`, `Accept-Ranges`, `Content-Type`, `ETag`. Les URL pré-signées restent la seule clé d'accès.
- Un token API de compte par bucket (permission « Workers R2 Storage Bucket Item Write », limitée au bucket). Identifiants S3 : `R2_ACCESS_KEY_ID` = id du token, `R2_SECRET_ACCESS_KEY` = SHA-256 (hex) de sa valeur.
- Code : `src/lib/wavelet/storage/r2.ts` (client signé avec `aws4fetch`), `R2StorageProvider.ts` (écritures), `src/lib/object-stream.ts` (lectures et URL pré-signées).

## Migration depuis les anciens stockages (S3 / MinIO / Vercel Blob)

Les fichiers ne sont pas migrés. Les lignes `StoredTrack` avec `storageType` `s3`, `local` ou `blob` sont supprimées automatiquement au premier play : le titre est re-streamé depuis Deezer, puis remis en cache dans R2.

La séparation de stems (Demucs, BullMQ, Redis) a été retirée. Elle demandait Python et torch, plusieurs Go de RAM, et des jobs plus longs que la durée maximale d'une fonction.
