// WASM-compatible version of exponents.cpp
#include <cmath>
#include <cstring>
#include "functions.h"
#include <iostream>

extern "C" {
    float* exponents_wasm(float M, const char* typeM, float SNR, float R, float N, float n, float threshold, float* results) {
        try {
            int it = 20;

            // Initialize parameters
            setMod(static_cast<int>(M), typeM);
            setR(R);
            setSNR(SNR);
            setN(static_cast<int>(N));

            // Initialize rho starting value
            double rho_gd = 0.5;
            double rho_interpolated = 0.5;
            double r = R;

            // Run computation
            double e0 = GD_iid(r, rho_gd, rho_interpolated, it, static_cast<int>(N), threshold);

            results[0] = pow(2, -n * e0); // Pe
            results[1] = e0; // exp
            results[2] = rho_gd;

            return results;
        } catch (...) {
            // Return null on error
            return nullptr;
        }
    }

    // Export the original function name for compatibility
    float* exponents(float M, const char* typeM, float SNR, float R, float N, float n, float threshold, float* results) {
        return exponents_wasm(M, typeM, SNR, R, N, n, threshold, results);
    }
}