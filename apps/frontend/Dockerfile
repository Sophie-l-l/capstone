FROM node:20-alpine AS builder

WORKDIR /app/apps/frontend

COPY apps/frontend/package.json apps/frontend/package-lock.json* ./
# Allow installs to proceed despite peer dep conflicts (React 19 vs some libs)
RUN npm config set legacy-peer-deps true && npm ci

# Build-time API URL for client bundle; default to /api (behind nginx)
ARG NEXT_PUBLIC_API_URL=/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY apps/frontend ./
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app/apps/frontend
ENV NODE_ENV=production

COPY --from=builder /app/apps/frontend/.next ./.next
COPY --from=builder /app/apps/frontend/public ./public
COPY --from=builder /app/apps/frontend/package.json /app/apps/frontend/package-lock.json* ./
RUN npm ci --omit=dev

EXPOSE 3000
CMD ["npm", "run", "start"]
