# Production Dockerfile for Quantum Radio
FROM node:22-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies including optional ones for production
RUN npm ci --omit=dev --include=optional

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S quantum -u 1001

# Change ownership of the app directory
RUN chown -R quantum:nodejs /app

# Switch to non-root user
USER quantum

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/users || exit 1

# Start the application
CMD ["npm", "start"]