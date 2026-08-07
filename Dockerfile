# ============================================================
# Stage 1 — Builder
# ============================================================

FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Install OpenSSL (required by Prisma)
RUN apt-get update && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists/*

# Copy workspace manifests
COPY package.json package-lock.json ./

# Copy backend
COPY backend/package.json backend/package-lock.json ./backend/
COPY backend/tsconfig.json ./backend/
COPY backend/prisma ./backend/prisma/
COPY backend/src ./backend/src/

# Install backend dependencies
RUN npm install --prefix backend

# Generate Prisma Client (use locally installed v5 binary — NOT npx which pulls v7)
RUN ./backend/node_modules/.bin/prisma generate --schema=backend/prisma/schema.prisma

# Build TypeScript
RUN npm run build --prefix backend

# ============================================================
# Stage 2 — Production Runner
# ============================================================

FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production

# Install OpenSSL
RUN apt-get update && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists/*

# Copy compiled application
COPY --from=builder /app/backend/dist ./dist

# Copy Prisma files
COPY --from=builder /app/backend/prisma ./prisma

# Copy package files
COPY --from=builder /app/backend/package.json ./
COPY --from=builder /app/backend/package-lock.json ./

# Install production dependencies
RUN npm install --omit=dev

# Generate Prisma Client inside production image (use locally installed v5 binary)
RUN ./node_modules/.bin/prisma generate --schema=./prisma/schema.prisma

# Render provides PORT automatically
EXPOSE 10000

# Start application
CMD ["node", "dist/server.js"]