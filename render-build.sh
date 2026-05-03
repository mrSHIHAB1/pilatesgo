#!/usr/bin/env bash
# exit on error
set -o errexit

# Install dependencies
npm install

# Generate Prisma Client with custom schema path
npx prisma generate --schema=./prisma/schema

# Build your application
npm run build

# Run migrations (deploy to production database)
npx prisma migrate deploy --schema=./prisma/schema