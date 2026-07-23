FROM oven/bun:1

WORKDIR /app

# Install workspace dependencies (cached separately from source for faster rebuilds)
COPY package.json bun.lock ./
COPY core/package.json core/package.json
COPY client/package.json client/package.json
COPY server/package.json server/package.json
RUN bun install --frozen-lockfile

COPY core core
COPY client client
COPY server server

# Vite bakes these into the static bundle at build time — pass with
# `--build-arg` (Railway: declare as service variables, they become ARGs).
ARG VITE_SENTRY_DSN
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN

RUN bun run --cwd server generate
RUN bun run --cwd client build

ENV NODE_ENV=production
EXPOSE 3000

# `migrate deploy` only applies pending migrations — safe to run on every boot.
CMD ["sh", "-c", "bun run --cwd server migrate:deploy && bun run --cwd server seed && bun run --cwd server start"]
