# Stems worker — BullMQ consumer that runs Demucs on cached tracks.
#
# Multi-stage build:
#   1. Node builder: compile TypeScript to dist/
#   2. Runtime: node:22-slim + Python 3.11 venv + ffmpeg + demucs +
#      production node_modules + compiled dist
#
# Demucs models (htdemucs, htdemucs_6s, ~500MB each) are NOT pre-baked into
# the image to keep it lean. They auto-download on first run into the
# TORCH_HOME volume mount (declared in docker-compose). Pre-warm by hitting
# POST /api/v1/stems/<trackId> once before opening the feature to users.

# ── Stage 1: TypeScript build ──
FROM node:22-slim AS builder
WORKDIR /app

COPY stems-worker/package.json stems-worker/package-lock.json* ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund

COPY stems-worker/tsconfig.json ./
COPY stems-worker/src ./src
RUN npm run build

# ── Stage 2: production deps ──
FROM node:22-slim AS prod-deps
WORKDIR /app
COPY stems-worker/package.json stems-worker/package-lock.json* ./
RUN npm ci --omit=dev --no-audit --no-fund || npm install --omit=dev --no-audit --no-fund

# ── Stage 3: runtime ──
FROM node:22-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PATH="/opt/demucs-venv/bin:$PATH"

# Python + ffmpeg for audio I/O. python3-venv is required by PEP 668 on
# Debian Bookworm (no system-wide pip installs).
RUN apt-get update && apt-get install -y --no-install-recommends \
        python3 \
        python3-venv \
        ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install Demucs + torch CPU-only (much smaller than the full CUDA build).
RUN python3 -m venv /opt/demucs-venv && \
    /opt/demucs-venv/bin/pip install --upgrade pip && \
    /opt/demucs-venv/bin/pip install \
        torch==2.5.1 torchaudio==2.5.1 \
        --index-url https://download.pytorch.org/whl/cpu && \
    /opt/demucs-venv/bin/pip install demucs

COPY stems-worker/package.json ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

CMD ["node", "dist/index.js"]
