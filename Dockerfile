# Build stage
FROM node:20 AS build

WORKDIR /app

# Provide a build-time DATABASE_URL for prisma generate
ARG DATABASE_URL=postgres://postgres:password@postgres:5432/mydb
ENV DATABASE_URL=$DATABASE_URL

COPY package*.json ./

# Avoid prisma generate before schema files are copied
RUN npm ci --ignore-scripts

COPY . .

RUN npm run build
RUN npm prune --omit=dev

# Runtime stage
FROM node:20-slim

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./
COPY --from=build /app/dist ./dist

EXPOSE 4000

CMD ["node", "dist/src/server.js"]