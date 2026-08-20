# Fastify API image. Runtime configuration (DB_CONNECT, SECRET_KEY, ...) comes
# from the environment, matching backend-fastify/.env.example.
FROM node:22-alpine AS deps

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:22-alpine AS runtime

ENV NODE_ENV=production \
    PORT=8000

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
COPY scripts ./scripts

RUN mkdir -p uploads && chown -R node:node /app
USER node

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8000/properties/ || exit 1

CMD ["node", "src/index.js"]
