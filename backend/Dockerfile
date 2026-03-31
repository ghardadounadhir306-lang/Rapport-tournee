# Build stage
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies (legacy peer deps usually needed for older NestJS CLI)
RUN npm ci --legacy-peer-deps

# Copy rest of the application
COPY . .

# Generate prisma client (uncomment if using prisma)
RUN npx prisma generate

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /usr/src/app

# Copy built files from builder
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/prisma ./prisma

EXPOSE 3000

# Start command
CMD ["npm", "run", "start:prod"]
