# Stockage S3 / MinIO

Wavelet supporte le stockage des fichiers musicaux dans un bucket S3 compatible (MinIO, AWS S3, etc.) au lieu du disque local.

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Wavelet │────▶│  StorageProvider  │────▶│  MinIO / S3 │
│  (Next.js)   │     │  (abstraction)   │     │  (bucket)   │
└─────────────┘     └──────────────────┘     └─────────────┘
```

Le systeme utilise une interface `StorageProvider` avec deux implementations :
- **`LocalStorageProvider`** — ecrit sur le disque local (comportement par defaut)
- **`S3StorageProvider`** — upload vers un bucket S3/MinIO

Le choix se fait via la variable d'environnement `WAVELET_STORAGE_TYPE` ou le champ `storageType` dans `config.json`.

## Demarrage rapide avec MinIO

### 1. Lancer MinIO

```bash
docker compose up minio createbucket -d
```

Cela demarre :
- **MinIO** sur le port `9000` (API S3) et `9001` (console web)
- Un conteneur d'initialisation qui cree le bucket `wavelet-music`

Identifiants par defaut : `minioadmin` / `minioadmin`

### 2. Lancer l'application avec le stockage S3

```bash
WAVELET_STORAGE_TYPE=s3 \
WAVELET_S3_ENDPOINT=http://localhost:9000 \
WAVELET_S3_ACCESS_KEY=minioadmin \
WAVELET_S3_SECRET_KEY=minioadmin \
npm run dev:all
```

### 3. Verifier

- Ouvrir l'app : http://localhost:3000
- Console MinIO : http://localhost:9001 (login: `minioadmin`/`minioadmin`)
- Telecharger une chanson et verifier qu'elle apparait dans le bucket `wavelet-music`

## Variables d'environnement

| Variable | Description | Defaut |
|---|---|---|
| `WAVELET_STORAGE_TYPE` | Type de stockage : `local` ou `s3` | `local` |
| `WAVELET_S3_ENDPOINT` | URL du serveur S3 | `http://localhost:9000` |
| `WAVELET_S3_BUCKET` | Nom du bucket | `wavelet-music` |
| `WAVELET_S3_ACCESS_KEY` | Access key ID | _(vide)_ |
| `WAVELET_S3_SECRET_KEY` | Secret access key | _(vide)_ |
| `WAVELET_S3_REGION` | Region AWS | `us-east-1` |
| `WAVELET_S3_PATH_PREFIX` | Prefixe dans le bucket (ex: `music/`) | _(vide)_ |

Les variables d'environnement ont priorite sur les valeurs dans `config.json`.

## Configuration via config.json

La configuration S3 peut aussi etre definie dans le fichier `config.json` de wavelet :

```json
{
  "storageType": "s3",
  "s3": {
    "endpoint": "http://localhost:9000",
    "region": "us-east-1",
    "bucket": "wavelet-music",
    "accessKeyId": "minioadmin",
    "secretAccessKey": "minioadmin",
    "pathPrefix": ""
  }
}
```

## Structure des fichiers dans le bucket

Les fichiers sont stockes dans le bucket avec la meme arborescence que le mode local :

```
wavelet-music/
├── Artist Name/
│   └── Artist Name - Album/
│       ├── 01 - Track Title.flac
│       ├── 02 - Another Track.flac
│       ├── cover.jpg
│       └── playlist.m3u8
├── errors.txt
└── searched.txt
```

Le `pathPrefix` permet d'ajouter un prefixe (ex: `music/`) devant tous les chemins.

## Fonctionnement interne

### Flux de telechargement avec S3

1. Le fichier audio est telecharge et decrypte dans un **fichier temporaire local** (`/tmp/wavelet-s3/`)
2. Les tags ID3/FLAC sont ecrits sur ce fichier temporaire
3. Le fichier est **uploade vers S3** via multipart upload
4. Le fichier temporaire est supprime

Cette approche est necessaire car les librairies de tagging (`browser-id3-writer`, `metaflac-js2`) operent sur des fichiers locaux.

### Images de couverture

- **Embedded cover art** : telechargee dans `/tmp/wavelet-imgs/` (toujours local, cache ephemere pour le tagging)
- **Album/artist/playlist art** : stockee dans S3 via le StorageProvider

### Fichiers annexes

Les fichiers suivants utilisent aussi le StorageProvider :
- `errors.txt` — log des erreurs de telechargement
- `searched.txt` — log des tracks trouvees par recherche
- `*.lrc` — paroles synchronisees
- `*.m3u8` — fichiers playlist

## Utilisation avec AWS S3

Pour utiliser AWS S3 au lieu de MinIO :

```bash
WAVELET_STORAGE_TYPE=s3 \
WAVELET_S3_ENDPOINT=https://s3.eu-west-1.amazonaws.com \
WAVELET_S3_REGION=eu-west-1 \
WAVELET_S3_BUCKET=mon-bucket-musique \
WAVELET_S3_ACCESS_KEY=AKIA... \
WAVELET_S3_SECRET_KEY=... \
npm run dev:all
```

## Fichiers source

| Fichier | Role |
|---|---|
| `src/lib/wavelet/storage/StorageProvider.ts` | Interface abstraite |
| `src/lib/wavelet/storage/LocalStorageProvider.ts` | Implementation disque local |
| `src/lib/wavelet/storage/S3StorageProvider.ts` | Implementation S3/MinIO |
| `src/lib/wavelet/storage/factory.ts` | Factory `createStorageProvider()` |
| `src/lib/wavelet/settings.ts` | Defaults S3 + overrides env vars |
| `src/lib/wavelet/types/Settings.ts` | Interface `S3Settings` |
| `docker-compose.yml` | Service MinIO + init bucket |
