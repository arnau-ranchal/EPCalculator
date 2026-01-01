// exponents.cpp
#include <cmath>
#include <cstring> 
#include "functions.h"
#include <iostream>

extern "C" {

    // Custom constellation version
    double* exponents_custom(const double* real_parts, const double* imag_parts, const double* probabilities, int num_points, double SNR, double R, double N, double n, double threshold, double* results) {
        int it = 20;
        setCustomConstellation(real_parts, imag_parts, probabilities, num_points);
        setR(R);
        setSNR(SNR);
        setN(static_cast<int>(N));

        // matrices
        setPI();
        setW();

        double rho_gd, rho_interpolated;
        double r;
        double e0 = GD_iid(r, rho_gd, rho_interpolated, it, static_cast<int>(N), threshold);

        // Check for invalid results
        if (!std::isfinite(e0) || e0 < -0.5) {
            std::cerr << "ERROR: Invalid error exponent E0 = " << e0
                      << " (SNR=" << SNR << ", N=" << N << ")\n";
            results[0] = -1.0;
            results[1] = -1.0;
            results[2] = rho_gd;
            return results;
        }

        // Clamp tiny negative values to 0
        if (e0 < 0 && e0 > -0.5) {
            std::cout << "INFO: Clamping tiny negative E0=" << e0 << " to 0 (floating point noise)\n";
            e0 = 0.0;
        }

        // Compute error probability
        double exponent = -n * e0;
        if (exponent < -1000) {
            results[0] = 0.0;
            std::cout << "INFO: Error probability Pe < 1e-300 (underflow), setting to 0\n";
        } else if (exponent > 0) {
            std::cerr << "ERROR: Positive exponent in Pe calculation\n";
            results[0] = 1.0;
        } else {
            results[0] = pow(2.0, exponent);
        }

        results[1] = e0;
        results[2] = rho_gd;
        results[3] = getMutualInformation();  // I(X;Y) = E0'(0)
        results[4] = getCutoffRate();         // R0 = E0(1)

        return results;
    }

    double* exponents(double M, const char* typeM, double SNR, double R, double N, double n, double threshold, const char* distribution, double shaping_param, double* results) {

        int it = 20;
        setMod(static_cast<int>(M), typeM);
        setQ(std::string(distribution), shaping_param); // matrix Q with distribution
        normalizeX_for_Q(); // Renormalize X based on Q distribution
        setR(R);
        setSNR(SNR);
        setN(static_cast<int>(N));

        // matrices
        setPI();
        setW();

        double rho_gd, rho_interpolated;
        double r;
        double e0 = GD_iid(r, rho_gd, rho_interpolated, it, static_cast<int>(N), threshold);

        // Check for invalid results
        // Only treat significantly negative values (< -0.5) as errors
        // Small negative values near 0 are floating point noise and should be clamped to 0
        if (!std::isfinite(e0) || e0 < -0.5) {
            std::cerr << "ERROR: Invalid error exponent E0 = " << e0
                      << " (SNR=" << SNR << ", N=" << N << ")\n";
            // Return special marker for invalid computation
            results[0] = -1.0; // Marker: invalid Pe
            results[1] = -1.0; // Marker: invalid E0
            results[2] = rho_gd;
            return results;
        }

        // Clamp tiny negative values to 0 (floating point precision issues)
        if (e0 < 0 && e0 > -0.5) {
            std::cout << "INFO: Clamping tiny negative E0=" << e0 << " to 0 (floating point noise)\n";
            e0 = 0.0;
        }

        // Compute error probability Pe = 2^(-n*e0)
        // Check for underflow: if n*e0 > 1000, Pe < 2^(-1000) ≈ 1e-301 (near underflow)
        double exponent = -n * e0;
        if (exponent < -1000) {
            // Severe underflow - Pe is effectively 0
            results[0] = 0.0;  // Pe ≈ 0
            std::cout << "INFO: Error probability Pe < 1e-300 (underflow), setting to 0\n";
        } else if (exponent > 0) {
            // This shouldn't happen (would mean E0 < 0)
            std::cerr << "ERROR: Positive exponent in Pe calculation\n";
            results[0] = 1.0;  // Safeguard
        } else {
            results[0] = pow(2.0, exponent);
        }

        results[1] = e0;                      // Error exponent
        results[2] = rho_gd;                  // Optimal rho
        results[3] = getMutualInformation();  // I(X;Y) = E0'(0)
        results[4] = getCutoffRate();         // R0 = E0(1)

        return results;
    }
}
