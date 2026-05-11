# Launch `npm run dev` against the local Docker stack
# (postgres + redis + minio brought up by `docker compose up -d postgres redis minio`)
# without touching .env.local — your prod creds (Google OAuth, Deezer ARL,
# auth secret) are still loaded from there, only the data plane is overridden.
#
# Usage: .\scripts\dev-local.ps1

$env:DATABASE_URL = "postgresql://deemix:deemix@localhost:15432/deemix"
$env:REDIS_URL = "redis://localhost:6379"
$env:DEEMIX_S3_ENDPOINT = "http://localhost:9000"
$env:DEEMIX_S3_ACCESS_KEY = "minioadmin"
$env:DEEMIX_S3_SECRET_KEY = "minioadmin"
$env:DEEMIX_S3_BUCKET = "deemix-music"
$env:DEEMIX_STORAGE_TYPE = "s3"

Write-Host "→ DATABASE_URL: $env:DATABASE_URL"
Write-Host "→ REDIS_URL:    $env:REDIS_URL"
Write-Host "→ S3:           $env:DEEMIX_S3_ENDPOINT (bucket=$env:DEEMIX_S3_BUCKET)"
Write-Host ""
Write-Host "Starting Next.js dev server on http://localhost:3000 ..."
Write-Host ""

npm run dev
