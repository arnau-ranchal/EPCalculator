cmake_minimum_required(VERSION 3.16)
project(EPCalculatorWASM)

# Set C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Emscripten specific settings
if(EMSCRIPTEN)
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -O3 -s WASM=1 -s ALLOW_MEMORY_GROWTH=1")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -s EXPORTED_RUNTIME_METHODS=['ccall','cwrap']")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -s EXPORTED_FUNCTIONS=['_exponents','_malloc','_free']")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -s MODULARIZE=1 -s EXPORT_NAME='EPCalculatorModule'")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -s ENVIRONMENT=web,worker")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -s DISABLE_EXCEPTION_CATCHING=0")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -s NO_FILESYSTEM=1")

    # Optimize for size and performance
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -flto")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -s AGGRESSIVE_VARIABLE_ELIMINATION=1")
endif()

# Include Eigen (header-only library)
include_directories(../eigen-3.4.0)

# Remove database dependencies for WASM build
add_definitions(-DNO_DATABASE)

# Source files (excluding database dependencies)
set(SOURCES
    wasm_interface.cpp
    ../exponents/exponents_wasm_new.cpp
)

# Create the WASM library
add_executable(epcalculator ${SOURCES})

# Set output names
set_target_properties(epcalculator PROPERTIES
    OUTPUT_NAME "epcalculator"
    SUFFIX ".js"
)

# Copy output files to dist directory
if(EMSCRIPTEN)
    add_custom_command(TARGET epcalculator POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E copy
        ${CMAKE_BINARY_DIR}/epcalculator.js
        ${CMAKE_SOURCE_DIR}/../public/wasm/
        COMMAND ${CMAKE_COMMAND} -E copy
        ${CMAKE_BINARY_DIR}/epcalculator.wasm
        ${CMAKE_SOURCE_DIR}/../public/wasm/
        COMMENT "Copying WASM files to public directory"
    )
endif()