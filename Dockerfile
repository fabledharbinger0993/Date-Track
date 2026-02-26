# Multi-stage build for production

# Stage 1: Build frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --only=production
COPY frontend/ ./
RUN npm run build

# Stage 2: Backend
FROM node:18-alpine AS backend
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ ./

# Stage 3: Production
FROM node:18-alpine
WORKDIR /app

# Copy backend
COPY --from=backend /app ./

# Copy frontend build
COPY --from=frontend-build /app/frontend/build ./public

# Install production dependencies only
RUN npm ci --only=production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "server.js"]
