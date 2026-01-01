#include "exponents/functions.h"
#include <iostream>
#include <iomanip>

// Declare the external C function
extern "C" {
    double* exponents(double M, const char* typeM, double SNR, double R, double N, double n, double threshold, double* results);
}

int main() {
    std::cout << std::fixed << std::setprecision(15);
    std::cout << "Testing SNR=0 linear through exponents() interface\n";
    std::cout << "===================================================\n";

    double results[3];
    double* ptr = exponents(2, "PAM", 0.0, 0.5, 20, 100, 1e-6, results);

    std::cout << "\nResults for SNR=0 linear:\n";
    std::cout << "  Error Probability (Pe): " << results[0] << "\n";
    std::cout << "  Error Exponent (E0):    " << results[1] << "\n";
    std::cout << "  Optimal rho:            " << results[2] << "\n";

    std::cout << "\nExpected for SNR=0 (degenerate channel):\n";
    std::cout << "  Pe should be ≈ 0.5 to 1.0\n";
    std::cout << "  E0 should be ≈ 0.0\n";
    std::cout << "  rho should be ≈ 0.0\n";

    return 0;
}
