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
    std::cout << "Testing High SNR Values - Finding Breakdown Point\n";
    std::cout << "==================================================\n\n";

    // Test parameters
    double M = 2;
    const char* typeM = "PAM";
    double R = 0.5;
    double N = 20;
    double n = 100;
    double threshold = 1e-6;

    // Test SNR values from moderate to extreme
    std::vector<double> snr_values = {
        10, 20, 30, 40, 50,        // Moderate
        60, 70, 80, 90, 100,       // High
        120, 150, 200, 250, 300,   // Very high
        400, 500, 750, 1000        // Extreme
    };

    std::cout << "SNR (linear) | E0           | Pe           | rho          | Status\n";
    std::cout << "-------------|--------------|--------------|--------------|------------------\n";

    for (double snr : snr_values) {
        double results[3];

        std::cout << "\n=== Testing SNR = " << snr << " (linear) ===\n";
        std::cout << std::flush;  // Flush before calling (stderr messages will appear)

        double* ptr = exponents(M, typeM, snr, R, N, n, threshold, results);

        std::cout << std::setw(12) << snr << " | ";

        if (results[1] == -1.0) {
            // Error marker
            std::cout << "ERROR        | ERROR        | "
                     << std::setw(12) << results[2] << " | FAILED\n";
        } else if (results[1] < 0) {
            // Unexpected negative
            std::cout << std::setw(12) << results[1] << " | "
                     << std::setw(12) << results[0] << " | "
                     << std::setw(12) << results[2] << " | NEGATIVE E0!\n";
        } else if (results[1] == 0.0) {
            // Clamped to zero
            std::cout << std::setw(12) << results[1] << " | "
                     << std::setw(12) << results[0] << " | "
                     << std::setw(12) << results[2] << " | CLAMPED\n";
        } else {
            // Valid result
            std::cout << std::setw(12) << results[1] << " | "
                     << std::setw(12) << results[0] << " | "
                     << std::setw(12) << results[2] << " | OK\n";
        }
        std::cout << std::flush;
    }

    std::cout << "\n\n=== Summary ===\n";
    std::cout << "Legend:\n";
    std::cout << "  OK         - Computation succeeded\n";
    std::cout << "  CLAMPED    - E0 was negative, clamped to 0 (may be inaccurate)\n";
    std::cout << "  NEGATIVE E0 - E0 is negative (not clamped, unexpected)\n";
    std::cout << "  FAILED     - Computation returned error marker (-1.0)\n";
    std::cout << "\nCheck stderr output above for detailed error messages from E_0_co()\n";

    return 0;
}
