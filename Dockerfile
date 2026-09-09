# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Use Alpine mirror
RUN sed -i 's|https://dl-cdn.alpinelinux.org/alpine|https://mirrors.aliyun.com/alpine|g' /etc/apk/repositories

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --registry=https://registry.npmmirror.com

# Copy source code
COPY . .

# Build application
RUN pnpm run build

# Production stage
FROM nginx:alpine

# Use Alpine mirror
RUN sed -i 's|https://dl-cdn.alpinelinux.org/alpine|https://mirrors.aliyun.com/alpine|g' /etc/apk/repositories

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]