# Use build arg for Node.js version
ARG NODE_VERSION=18
FROM node:${NODE_VERSION}-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build:ci

# Production stage
FROM node:${NODE_VERSION}-alpine AS production

# Install pnpm
RUN npm install -g pnpm

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S discordbot -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod && pnpm cache clean

# Copy built application from base stage
COPY --from=base /app/dist ./dist

# Change ownership to app user
RUN chown -R discordbot:nodejs /app
USER discordbot

# Start the application
CMD ["node", "dist/index.js"]