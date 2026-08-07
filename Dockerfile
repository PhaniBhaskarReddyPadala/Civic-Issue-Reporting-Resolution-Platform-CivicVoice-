# ============================================================
# Stage 1 — Builder
# Installs ALL deps, generates Prisma client, compiles TS → dist/
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace root manifests first (for caching)
COPY package.json package-lock.json ./

# Copy backend manifests & source
COPY backend/package.json backend/package-lock.json ./backend/
COPY backend/prisma ./backend/prisma/
COPY backend/src ./backend/src/
COPY backend/tsconfig.json ./backend/

# Install backend dependencies (including devDeps needed for tsc + ts-node)
RUN npm install --prefix backend

# Generate Prisma client
RUN npm run prisma:generate --prefix backend

# Compile TypeScript → dist/
RUN npm run build --prefix backend

# ============================================================
# Stage 2 — Runner
# Lean production image — only compiled JS, prod node_modules, prisma schema
# ============================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy only what's needed to run
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/prisma ./prisma
COPY --from=builder /app/backend/package.json ./package.json
COPY --from=builder /app/backend/package-lock.json ./package-lock.json

# Install production-only dependencies
RUN npm install --omit=dev

# Re-generate Prisma client (for production runtime)
RUN npx prisma generate

# Expose the port (Render sets PORT env var at runtime)
EXPOSE 10000

# Start compiled server — no nodemon, no ts-node
CMD ["node", "dist/server.js"]
