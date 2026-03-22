FROM node:22-alpine AS builder
WORKDIR /app
RUN npm install --no-save esbuild express@5 ws@8
COPY server ./server
RUN npx esbuild server/index.ts --bundle --platform=node --outfile=dist/server.js

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/dist/server.js ./server.js

EXPOSE 6595
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
