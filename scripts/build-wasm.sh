#!/bin/bash

# Build script for WebAssembly compilation
set -e

echo "Building EPCalculator WebAssembly module..."

# Create necessary directories
mkdir -p wasm/build
mkdir -p public/wasm

# Check if Emscripten is available
if ! command -v emcc &> /dev/null; then
    echo "Error: Emscripten not found. Please install Emscripten SDK."
    echo "Visit: https://emscripten.org/docs/getting_started/downloads.html"
    exit 1
fi

# Navigate to build directory
cd wasm/build

# Configure with CMake
echo "Configuring CMake for WebAssembly..."
emcmake cmake .. \
    -DCMAKE_BUILD_TYPE=Release \
    -DCMAKE_TOOLCHAIN_FILE=$EMSCRIPTEN/cmake/Modules/Platform/Emscripten.cmake

# Build the project
echo "Building WebAssembly module..."
emmake make -j$(nproc)

# Verify output files exist
if [ -f "epcalculator.js" ] && [ -f "epcalculator.wasm" ]; then
    echo "WebAssembly build successful!"
    echo "Generated files:"
    echo "  - epcalculator.js ($(du -h epcalculator.js | cut -f1))"
    echo "  - epcalculator.wasm ($(du -h epcalculator.wasm | cut -f1))"
else
    echo "Error: WebAssembly build failed - output files not found"
    exit 1
fi

# Return to project root
cd ../..

echo "WebAssembly module ready for integration!"