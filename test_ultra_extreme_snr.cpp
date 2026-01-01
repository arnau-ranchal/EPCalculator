#include "exponents/functions.h"
#include <iostream>
#include <iomanip>
#include <vector>

// Declare the external C function
extern "C" {
    double* exponents(double M, const char* typeM, double SNR, double R, double N, double n, double threshold, double* results);
}

int main() {
    std::cout << std::fixed << std::setprecision(10);
    std::cout << "Testing ULTRA-EXTREME SNR Values\n";
    std::cout << "=================================\n\n";

    // Test parameters
    double M = 2;
    const char* typeM = "PAM";
    double R = 0.5;
    double N = 20;  // Standard N
    double n = 100;
    double threshold = 1e-6;

    // Ultra-extreme SNR values
    std::vector<double> snr_values = {
        1000, 5000, 10000, 50000, 100000, 500000, 1000000
    };

    std::cout << "Parameters: M=2 (PAM), R=0.5, N=20\n";
    std::cout << "Goal: Find the SNR where quadrature approximation breaks down\n\n";

    std::cout << "SNR (linear) | E0           | Status\n";
    std::cout << "-------------|--------------|----------------------------------\n";

    for (double snr : snr_values) {
        double results[3];

        std::cout << "\n=== Testing SNR = " << snr << " (linear) ===\n";
        std::cout << std::flush;

        double* ptr = exponents(M, typeM, snr, R, N, n, threshold, results);

        std::cout << std::setw(12) << snr << " | ";

        if (results[1] == -1.0) {
            std::cout << "ERROR        | COMPUTATION FAILED\n";
        } else if (results[1] < 0 && results[1] > -0.5) {
            std::cout << std::setw(12) << results[1] << " | NEGATIVE (should be clamped)\n";
        } else if (results[1] == 0.0) {
            std::cout << std::setw(12) << results[1] << " | CLAMPED (quadrature breakdown?)\n";
        } else {
            std::cout << std::setw(12) << results[1] << " | OK\n";
        }
        std::cout << std::flush;
    }

    std::cout << "\n\nCheck stderr output for warnings about quadrature approximation\n";

    return 0;
}
