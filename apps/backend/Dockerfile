FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++ bash

# Copy backend manifests and prisma schema first for better caching
COPY apps/backend/package.json apps/backend/package-lock.json* apps/backend/tsconfig.json ./apps/backend/
COPY apps/backend/prisma ./apps/backend/prisma

RUN cd apps/backend && npm ci

# Copy the rest of the backend source
COPY apps/backend ./apps/backend

# Generate Prisma client and build TypeScript
RUN cd apps/backend && npx prisma generate && npm run build

FROM node:20-alpine AS runner
WORKDIR /app/apps/backend

ENV NODE_ENV=production

# Install production dependencies
COPY --from=builder /app/apps/backend/package.json /app/apps/backend/package-lock.json ./
RUN npm ci --omit=dev

# Copy built artifacts and prisma schema
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/prisma ./prisma

EXPOSE 3001

# Run migrations and start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
