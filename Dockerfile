<<<<<<< HEAD
# EPCalculator Production Dockerfile
# Multi-stage build optimized for Rancher/Kubernetes deployment

# =============================================================================
# Stage 1: Build C++ library with Eigen
# =============================================================================
FROM node:18.17-bookworm AS cpp-builder

# Install C++ build dependencies
=======
# Production Dockerfile for EPCalculator with Svelte frontend
# Optimized for Docker registry with proper layer caching

# Stage 1: Build frontend
FROM node:18-bookworm AS frontend-builder

WORKDIR /build

# Copy package files first (better caching)
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./

# Install ALL dependencies (including devDependencies for build)
# Skip native addons like ffi-napi since frontend doesn't need them
RUN npm ci --ignore-scripts

# Install terser separately for vite minification
RUN npm install terser --save-dev

# Copy frontend source
COPY index.html ./
COPY src/frontend ./src/frontend

# Build frontend (outputs to public/)
RUN npm run build:frontend

# Stage 2: Build C++ library
FROM node:18-bookworm AS cpp-builder

# Install build dependencies
>>>>>>> parent of ac1c89ab (Restructure of the folders)
RUN apt-get update && apt-get install -y \
    build-essential \
    g++ \
    make \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

<<<<<<< HEAD
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
=======
# Copy C++ source
COPY EPCalculatorOld ./EPCalculatorOld

# Build C++ library
WORKDIR /build/EPCalculatorOld/EPCalculatorOld
RUN make clean && make

# Stage 3: Production runtime
FROM node:18-bookworm-slim AS production

# Install runtime dependencies only
RUN apt-get update && apt-get install -y \
    libstdc++6 \
>>>>>>> parent of ac1c89ab (Restructure of the folders)
    wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

<<<<<<< HEAD
# Install production dependencies
# ffi-napi requires native compilation, so we need build tools
RUN npm ci --omit=dev

# Copy server application
COPY server ./server
=======
# Install production dependencies only (no build tools)
RUN npm ci --omit=dev --ignore-scripts

# Copy application code
COPY simple-server-working.js ./
>>>>>>> parent of ac1c89ab (Restructure of the folders)
COPY src/services ./src/services

# Copy built artifacts from previous stages
COPY --from=frontend-builder /build/public ./public
<<<<<<< HEAD
COPY --from=cpp-builder /build/build/libfunctions.so ./build/libfunctions.so

# Create non-root user for security
=======
COPY --from=cpp-builder /build/EPCalculatorOld/EPCalculatorOld/build/libfunctions.so \
    /app/EPCalculatorOld/EPCalculatorOld/build/libfunctions.so

# Create non-root user
>>>>>>> parent of ac1c89ab (Restructure of the folders)
RUN groupadd -g 1001 nodejs && \
    useradd -r -u 1001 -g nodejs nodeuser && \
    chown -R nodeuser:nodejs /app

USER nodeuser

<<<<<<< HEAD
# Environment variables
ENV NODE_ENV=production
ENV PORT=8000

=======
>>>>>>> parent of ac1c89ab (Restructure of the folders)
# Expose port
EXPOSE 8000

# Health check
<<<<<<< HEAD
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8000/api/health || exit 1

# Start the application
CMD ["node", "server/simple-server-working.js"]
=======
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8000/api/health || exit 1

# Start application
CMD ["node", "simple-server-working.js"]
>>>>>>> parent of ac1c89ab (Restructure of the folders)
