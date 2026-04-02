# ─── Stage 1: Dependencies ────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# ─── Stage 2: Build/Dev Dependencies ─────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci && npm cache clean --force
COPY . .
RUN npm run lint || true

# ─── Stage 3: Production Image ────────────────────────────────────────────────
FROM node:20-alpine AS production

# Security: non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodeuser -u 1001 -G nodejs

WORKDIR /app

# Copy production deps
COPY --from=deps --chown=nodeuser:nodejs /app/node_modules ./node_modules
COPY --chown=nodeuser:nodejs . .

# Remove dev files
RUN rm -rf tests/ .eslintrc* jest.config* .env*

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:5000/health/live || exit 1

USER nodeuser

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "src/server.js"]
