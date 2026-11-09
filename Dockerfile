# Static Astro site, built with Node and served by nginx (Coolify on Hetzner)

ARG NODE_VERSION=26.13.0
ARG PNPM_VERSION=12.16.1
ARG NGINX_VERSION=1.29-alpine

# ---- Base: Node with a pinned pnpm ----
FROM node:${NODE_VERSION}-alpine AS base
ARG PNPM_VERSION
WORKDIR /app
RUN npm install -g pnpm@${PNPM_VERSION}

# ---- Dependencies ----
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# --ignore-scripts: no lifecycle scripts (Husky) inside the image
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prefer-offline --ignore-scripts

# ---- Build ----
FROM deps AS builder
COPY . .
# The production build loads Umami (src/lib/analytics), which counts only on www.kogakure.de
ENV ANALYTICS=true
# Search engines may index the pages: set as a build variable in the production
# app only (Coolify), so staging stays noindex
ARG INDEXABLE=false
ENV INDEXABLE=${INDEXABLE}
RUN --mount=type=cache,id=astro-cache,target=/app/node_modules/.astro \
    pnpm run build && test -f dist/index.html

# ---- Production: nginx serves dist/ ----
FROM nginx:${NGINX_VERSION} AS production
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
