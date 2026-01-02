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
RUN apt-get update && apt-get install -y \
    build-essential \
    g++ \
    make \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

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
    wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only (no build tools)
RUN npm ci --omit=dev --ignore-scripts

# Copy application code
COPY simple-server-working.js ./
COPY src/services ./src/services

# Copy built artifacts from previous stages
COPY --from=frontend-builder /build/public ./public
COPY --from=cpp-builder /build/EPCalculatorOld/EPCalculatorOld/build/libfunctions.so \
    /app/EPCalculatorOld/EPCalculatorOld/build/libfunctions.so

# Create non-root user
RUN groupadd -g 1001 nodejs && \
    useradd -r -u 1001 -g nodejs nodeuser && \
    chown -R nodeuser:nodejs /app

USER nodeuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8000/api/health || exit 1

# Start application
CMD ["node", "simple-server-working.js"]
