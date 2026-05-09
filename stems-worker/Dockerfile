# Stems worker — BullMQ consumer that runs Demucs (Python) on cached tracks.
#
# PR 1 (this file): Node-only stub that connects to Redis and logs jobs.
# PR 3 will extend this with Python 3.11 + ffmpeg + demucs + pre-downloaded
# htdemucs_6s weights at build time.

# ── Stage 1: install deps + compile TypeScript ──
FROM node:22-slim AS builder
WORKDIR /app

COPY stems-worker/package.json stems-worker/tsconfig.json ./
RUN npm install --no-audit --no-fund

COPY stems-worker/src ./src
RUN npm run build

# ── Stage 2: runtime ──
FROM node:22-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production

COPY stems-worker/package.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY --from=builder /app/dist ./dist

CMD ["node", "dist/index.js"]
