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
    std::cout << "Testing High SNR with 16-QAM (More Complex Modulation)\n";
    std::cout << "========================================================\n\n";

    // More challenging parameters
    double M = 16;
    const char* typeM = "QAM";
    double R = 0.75;  // Higher rate
    double N = 30;    // More quadrature points
    double n = 100;
    double threshold = 1e-6;

    // Test SNR values
    std::vector<double> snr_values = {
        10, 20, 50, 100, 150, 200, 300, 500, 1000
    };

    std::cout << "Parameters: M=16 (QAM), R=0.75, N=30\n\n";
    std::cout << "SNR (linear) | E0           | Pe           | rho          | Status\n";
    std::cout << "-------------|--------------|--------------|--------------|------------------\n";

    for (double snr : snr_values) {
        double results[3];

        std::cout << "\n=== Testing SNR = " << snr << " (linear) ===\n";
        std::cout << std::flush;

        double* ptr = exponents(M, typeM, snr, R, N, n, threshold, results);

        std::cout << std::setw(12) << snr << " | ";

        if (results[1] == -1.0) {
            std::cout << "ERROR        | ERROR        | "
                     << std::setw(12) << results[2] << " | FAILED\n";
        } else if (results[1] < 0) {
            std::cout << std::setw(12) << results[1] << " | "
                     << std::setw(12) << results[0] << " | "
                     << std::setw(12) << results[2] << " | NEGATIVE E0!\n";
        } else if (results[1] == 0.0 && snr > 10) {
            std::cout << std::setw(12) << results[1] << " | "
                     << std::setw(12) << results[0] << " | "
                     << std::setw(12) << results[2] << " | CLAMPED (suspicious at high SNR)\n";
        } else {
            std::cout << std::setw(12) << results[1] << " | "
                     << std::setw(12) << results[0] << " | "
                     << std::setw(12) << results[2] << " | OK\n";
        }
        std::cout << std::flush;
    }

    std::cout << "\n\nTest complete - check stderr output for detailed messages\n";

    return 0;
}
