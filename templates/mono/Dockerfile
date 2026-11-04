# One image for the whole app: the API serves the built web app on the same origin.
# Runs on any container host: Railway, Fly.io, Render, AWS (App Runner, ECS, Lightsail), Cloud Run,
# or a VPS with `docker compose up -d --build` (see compose.yaml).
# ponytail: single stage with dev dependencies kept (~1 GB); add a pruned runtime stage if image size matters.
FROM node:24-slim
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate
COPY . .
RUN pnpm install --frozen-lockfile
# VITE_API_URL=/ : the web app calls /api on its own origin (overrides any .env file).
RUN VITE_API_URL=/ pnpm turbo build --filter=@slipway/web --filter=@slipway/api
ENV NODE_ENV=production PORT=3000 WEB_DIST=/app/apps/web/dist
WORKDIR /app/apps/api
EXPOSE 3000
# Without DATABASE_URL the data lives in ./.data (embedded PGlite); mount a volume there or set a Postgres URL.
CMD ["node", "dist/main.js"]
