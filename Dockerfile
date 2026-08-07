# ============================================================
# Stage 1 — Builder
# ============================================================
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Install OpenSSL (required by Prisma engine)
RUN apt-get update && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists/*

# Copy workspace & backend manifests
COPY package.json package-lock.json ./
COPY backend/package.json backend/package-lock.json ./backend/
COPY backend/tsconfig.json ./backend/
COPY backend/prisma ./backend/prisma/
COPY backend/src ./backend/src/

# Install dependencies & build (prisma generate + tsc)
RUN npm install --prefix backend
RUN npm run build --prefix backend

# ============================================================
# Stage 2 — Production Runner
# ============================================================
FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install OpenSSL
RUN apt-get update && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists/*

# Copy compiled output and node_modules directly from builder
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/prisma ./prisma
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/package.json ./package.json

# Render provides PORT automatically
EXPOSE 10000

# Start compiled application
CMD ["node", "dist/server.js"]