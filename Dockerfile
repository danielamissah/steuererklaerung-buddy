# Multi-stage Dockerfile for Steuererklärung Buddy (Next.js).
#
# Stage 1 (deps):    Install production dependencies only
# Stage 2 (builder): Build the Next.js app with public env vars
# Stage 3 (runner):  Minimal production image 

# Secret env vars (GROQ_API_KEY, GOOGLE_CLOUD_VISION_API_KEY) are
# injected at RUNTIME only — never baked into the image.
# Public vars (NEXT_PUBLIC_*) must be available at BUILD time because
# Next.js inlines them into the client bundle during compilation.

# ── Stage 1: Dependencies ─────────────────────────────────────────────────────
# ── Stage 1: Dependencies ─────────────────────────────────────────────────────
FROM node:20-alpine AS deps

RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
# Install ALL dependencies including devDependencies —
# build tools like @tailwindcss/postcss are needed at compile time.
# The runner stage copies only the compiled output, not node_modules,
# so dev packages do not end up in the production image.
RUN npm ci

# ── Stage 2: Builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# Public vars are safe as build args — they end up in the client bundle anyway
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_URL

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

RUN npm run build

# ── Stage 3: Runner ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Non-root user — running as root in production is a security risk
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]