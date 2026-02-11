# EPCalculator Production Dockerfile
# Multi-stage build optimized for Rancher/Kubernetes deployment

# =============================================================================
# Stage 1: Build C++ library with Eigen
# =============================================================================
FROM node:18.17-bookworm AS cpp-builder

# Install C++ build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    g++ \
    make \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# Copy Eigen headers and C++ source
COPY eigen-3.4.0 ./eigen-3.4.0
COPY exponents ./exponents
COPY Makefile ./

# Build the C++ shared library
RUN make clean && make

# =============================================================================
# Stage 2: Production runtime
# =============================================================================
FROM node:18.17-bookworm-slim AS production

# Install runtime dependencies
# - libstdc++6: C++ standard library (for libfunctions.so)
# - python3, build-essential: Required for ffi-napi native addon compilation
# - wget: For health checks
RUN apt-get update && apt-get install -y \
    libstdc++6 \
    python3 \
    build-essential \
    wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
# ffi-napi requires native compilation, so we need build tools
RUN npm ci --omit=dev

# Copy pre-built application (built on host with npm run build)
COPY dist ./dist
COPY public ./public

# Copy worker files (these are JS, not compiled by TypeScript)
COPY src/workers ./dist/workers

# Copy tutorial images (served statically, not bundled by Vite)
COPY src/frontend/assets/tutorial-images ./dist/frontend/assets/tutorial-images

# Copy C++ library from build stage
COPY --from=cpp-builder /build/build/libfunctions.so ./build/libfunctions.so

# Create data directory for SQLite database
RUN mkdir -p /app/data

# Create non-root user for security
RUN groupadd -g 1001 nodejs && \
    useradd -r -u 1001 -g nodejs nodeuser && \
    chown -R nodeuser:nodejs /app

USER nodeuser

# Environment variables (defaults - override in Rancher/Kubernetes)
ENV NODE_ENV=production
ENV PORT=8000

# API Documentation - set these to enable Swagger UI in production:
# ENV ENABLE_API_DOCS=true
# ENV PUBLIC_URL=https://your-domain.com

# Expose port
EXPOSE 8000

# Health check - use lightweight liveness endpoint
# Increased start-period for database initialization
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8000/health || exit 1

# Start the application
CMD ["node", "dist/server.js"]
