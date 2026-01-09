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
# Stage 2: Build frontend with Vite
# =============================================================================
FROM node:18.17-bookworm AS frontend-builder

WORKDIR /build

# Copy package files first (better layer caching)
COPY package*.json ./
COPY vite.config.ts ./

# Install ALL dependencies (including devDependencies for build)
# Use --ignore-scripts to skip native addon builds (not needed for frontend)
RUN npm ci --ignore-scripts

# Copy frontend source and services (some frontend code imports services)
COPY index.html ./
COPY src/frontend ./src/frontend
COPY src/services ./src/services

# Build frontend (outputs to public/)
RUN npm run build:frontend

# =============================================================================
# Stage 3: Production runtime
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

# Copy server application
COPY server ./server
COPY src/services ./src/services

# Copy built artifacts from previous stages
COPY --from=frontend-builder /build/public ./public
COPY --from=cpp-builder /build/build/libfunctions.so ./build/libfunctions.so

# Create non-root user for security
RUN groupadd -g 1001 nodejs && \
    useradd -r -u 1001 -g nodejs nodeuser && \
    chown -R nodeuser:nodejs /app

USER nodeuser

# Environment variables
ENV NODE_ENV=production
ENV PORT=8000

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8000/api/health || exit 1

# Start the application
CMD ["node", "server/simple-server-working.js"]
