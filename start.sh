#!/bin/bash
set -e

echo "Starting deployment..."

# Generate Prisma Client
echo "Generating Prisma client..."
npx prisma generate

# Start the application
echo "Starting application..."
node index.js
