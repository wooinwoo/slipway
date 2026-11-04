# API image. Runs on any container host: Railway, Fly.io, Render, AWS (App Runner, ECS, Lightsail),
# Cloud Run, or a VPS. Set DATABASE_URL to a Postgres URL, or mount a volume at /app/.data for PGlite.
# ponytail: single stage with dev dependencies kept; add a pruned runtime stage if image size matters.
FROM node:24-slim
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate
COPY . .
RUN pnpm install --frozen-lockfile && pnpm build
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
CMD ["node", "dist/main.js"]
