# Stage 1: Build WebApp (Mini App frontend)
FROM node:24-alpine AS webapp-builder
WORKDIR /app/webapp

COPY webapp/package*.json ./
RUN npm ci

COPY webapp/ ./
RUN npm run build

# Stage 2: Build Server (TypeScript backend)
FROM node:24-alpine AS server-builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build:server

# Stage 3: Production Runtime
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built artifacts
COPY --from=server-builder /app/dist ./dist
COPY --from=webapp-builder /app/webapp/dist ./webapp/dist

# Directory for SQLite database and emoji cache
RUN mkdir -p /app/data

EXPOSE 3000

# Health check against API
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]
