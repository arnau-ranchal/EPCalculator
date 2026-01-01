#include <iostream>
#include <iomanip>
#include <chrono>
#include <cmath>

// Include our exact implementation
#include "exponents/functions_wasm.cpp"

using namespace std;
using namespace std::chrono;

extern "C" {
    // Create an interface that matches the old implementation signature
    double test_new_implementation(int M, const char* typeM, double SNR_dB, double R, int N, double threshold, double& Pe, double& rho_optimal) {
        try {
            // Convert SNR from dB to linear scale
            double SNR = pow(10.0, SNR_dB / 10.0);

            // Initialize parameters
            setMod(M, typeM);
            setR(R);
            setSNR(SNR);
            setN(N);

            // Test parameters
            int num_iterations = 20;
            double rho_gd = 0.5;
            double rho_interpolated = 0.5;
            double r = R;

            // Run the exact implementation
            double error_exponent = GD_iid(r, rho_gd, rho_interpolated, num_iterations, N, threshold);

            Pe = pow(2, -N * error_exponent);
            rho_optimal = rho_gd;

            return error_exponent;
        } catch (...) {
            Pe = -1;
            rho_optimal = -1;
            return -999;
        }
    }
}