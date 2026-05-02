# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build


# ── Production stage ──────────────────────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

# Runtime dependencies only
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# Copy compiled frontend
COPY --from=builder /app/dist ./dist

# Copy backend source (tsx compiles on the fly in production via tsx)
COPY server.ts ./
COPY server/ ./server/
COPY tsconfig.json ./

# Create data and uploads directories — map these as Docker volumes in production
RUN mkdir -p /data /app/uploads

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/data/dsdst_panel.db

EXPOSE 3000

# Health check — the /api/public/health endpoint requires no auth
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/public/health || exit 1

CMD ["npx", "tsx", "server.ts"]
