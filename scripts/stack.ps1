# One-shot launcher for the full local stack:
#   docker (postgres + redis + minio + bucket) → prisma → [stems-worker] → next dev
#
# Usage:
#   .\scripts\stack.ps1                 # infra + db sync + next dev (foreground)
#   .\scripts\stack.ps1 -Stems          # also build/start the Demucs stems-worker container
#   .\scripts\stack.ps1 -InfraOnly      # infra + db sync, no next dev
#   .\scripts\stack.ps1 -SkipDb         # skip prisma generate / db push
#   .\scripts\stack.ps1 -Status         # show container status
#   .\scripts\stack.ps1 -Logs           # follow container logs
#   .\scripts\stack.ps1 -Down           # stop containers (data volumes are kept)
#
# Ctrl+C only stops `next dev`; containers keep running until -Down.
# The data plane is overridden via process env so .env /
# .env.local (auth secrets, Deezer ARL, …) are still loaded by Next.js.

[CmdletBinding()]
param(
	[switch]$Stems,
	[switch]$InfraOnly,
	[switch]$SkipDb,
	[switch]$Status,
	[switch]$Logs,
	[switch]$Down
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$composeArgs = @("-f", "docker-compose.yml", "-f", "scripts/compose.local.yml")
$infra = @("postgres", "redis", "minio")

function Step($msg) { Write-Host "`n▸ $msg" -ForegroundColor Cyan }
function Fail($msg) { Write-Host "✗ $msg" -ForegroundColor Red; exit 1 }

function Invoke-Checked {
	param([string]$Label)
	if ($LASTEXITCODE -ne 0) { Fail "$Label failed (exit $LASTEXITCODE)" }
}

function Compose { docker compose @composeArgs @args }

function Read-DotEnv($path) {
	$vars = @{}
	if (-not (Test-Path $path)) { return $vars }
	foreach ($line in Get-Content $path) {
		if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$') {
			$vars[$Matches[1]] = $Matches[2].Trim('"', "'")
		}
	}
	return $vars
}

function Get-Env($vars, $key, $default) {
	if ($vars.ContainsKey($key) -and $vars[$key]) { return $vars[$key] }
	return $default
}

# ── Preflight ──
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { Fail "docker not found in PATH" }
docker info *> $null
if ($LASTEXITCODE -ne 0) { Fail "Docker daemon is not running — start Docker Desktop and retry" }
if (-not (Test-Path ".env")) { Fail ".env missing — copy .env.example to .env first" }

# ── Management commands ──
if ($Down) { Step "Stopping containers"; Compose stop; exit $LASTEXITCODE }
if ($Status) { Compose ps; exit $LASTEXITCODE }
if ($Logs) { Compose logs -f --tail 100; exit $LASTEXITCODE }

$dotenv = Read-DotEnv ".env"
$pgUser = Get-Env $dotenv "POSTGRES_USER" "wavelet"
$pgPass = Get-Env $dotenv "POSTGRES_PASSWORD" "wavelet"
$pgDb = Get-Env $dotenv "POSTGRES_DB" "wavelet"
$minioUser = Get-Env $dotenv "MINIO_ROOT_USER" "minioadmin"
$minioPass = Get-Env $dotenv "MINIO_ROOT_PASSWORD" "minioadmin"
$bucket = Get-Env $dotenv "WAVELET_S3_BUCKET" "wavelet-music"

# ── 1. Infra ──
Step "Starting $($infra -join ', ')"
Compose up -d --wait @infra
Invoke-Checked "docker compose up"

Step "Ensuring bucket '$bucket'"
Compose run --rm createbucket | Out-Null
Invoke-Checked "createbucket"

# ── 2. Host-side env overrides (compose hostnames → localhost) ──
$env:DATABASE_URL = "postgresql://${pgUser}:${pgPass}@localhost:15432/${pgDb}"
$env:REDIS_URL = "redis://localhost:6379"
$env:WAVELET_STORAGE_TYPE = "s3"
$env:WAVELET_S3_ENDPOINT = "http://localhost:9000"
$env:WAVELET_S3_ACCESS_KEY = $minioUser
$env:WAVELET_S3_SECRET_KEY = $minioPass
$env:WAVELET_S3_BUCKET = $bucket

# ── 3. Node deps + DB schema ──
if (-not (Test-Path "node_modules")) {
	Step "Installing npm dependencies"
	npm install
	Invoke-Checked "npm install"
}

if (-not $SkipDb) {
	Step "Prisma generate + db push"
	npx prisma generate
	Invoke-Checked "prisma generate"
	npx prisma db push
	Invoke-Checked "prisma db push"
}

# ── 4. Stems worker (optional, heavy: Python + Demucs image) ──
if ($Stems) {
	Step "Building + starting stems-worker"
	Compose up -d --build stems-worker
	Invoke-Checked "stems-worker"
}

# ── Summary ──
Write-Host ""
Write-Host "  Postgres   localhost:15432  ($pgDb)" -ForegroundColor Green
Write-Host "  Redis      localhost:6379" -ForegroundColor Green
Write-Host "  MinIO      http://localhost:9000  (console http://localhost:9001)" -ForegroundColor Green
if ($Stems) { Write-Host "  Stems      container Wavelet-StemsWorker  (logs: .\scripts\stack.ps1 -Logs)" -ForegroundColor Green }

if ($InfraOnly) {
	Write-Host "`nInfra is up. Stop it with .\scripts\stack.ps1 -Down"
	exit 0
}

Write-Host "  Next.js    http://localhost:3000" -ForegroundColor Green
Write-Host "`nCtrl+C stops Next.js only — run .\scripts\stack.ps1 -Down to stop containers.`n"

npm run dev
