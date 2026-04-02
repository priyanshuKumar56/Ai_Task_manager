# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci && npm cache clean --force

COPY . .
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ─── Stage 2: Production (nginx) ──────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

# Security: non-root
RUN addgroup -g 1001 -S nginx-user && adduser -S -u 1001 -G nginx-user nginx-user

# Copy built app
COPY --from=builder /app/dist /usr/share/nginx/html

# nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN chown -R nginx-user:nginx-user /usr/share/nginx/html && \
    chown -R nginx-user:nginx-user /var/cache/nginx && \
    chown -R nginx-user:nginx-user /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown nginx-user:nginx-user /var/run/nginx.pid

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

USER nginx-user
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
