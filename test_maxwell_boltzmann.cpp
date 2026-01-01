#include "exponents/functions.h"
#include <iostream>
#include <iomanip>

// Declare the external C function
extern "C" {
    double* exponents(double M, const char* typeM, double SNR, double R, double N, double n, double threshold, const char* distribution, double shaping_param, double* results);
}

int main() {
    std::cout << std::fixed << std::setprecision(10);
    std::cout << "Testing Maxwell-Boltzmann Distribution\n";
    std::cout << "========================================\n\n";

    // Test 4-PAM with different beta values
    std::cout << "Test: 4-PAM at SNR=10, R=0.5, N=20\n";
    std::cout << "-----------------------------------\n\n";

    // Test 1: Uniform (beta=0)
    std::cout << "1. Uniform distribution (beta=0):\n";
    double results1[3];
    exponents(4, "PAM", 10.0, 0.5, 20, 100, 1e-6, "uniform", 0.0, results1);
    std::cout << "   E0 = " << results1[1] << ", rho = " << results1[2] << "\n\n";

    // Test 2: Weak shaping (beta=0.5)
    std::cout << "2. Maxwell-Boltzmann (beta=0.5):\n";
    double results2[3];
    exponents(4, "PAM", 10.0, 0.5, 20, 100, 1e-6, "maxwell-boltzmann", 0.5, results2);
    std::cout << "   E0 = " << results2[1] << ", rho = " << results2[2] << "\n\n";

    // Test 3: Strong shaping (beta=1.0)
    std::cout << "3. Maxwell-Boltzmann (beta=1.0):\n";
    double results3[3];
    exponents(4, "PAM", 10.0, 0.5, 20, 100, 1e-6, "boltzmann", 1.0, results3);
    std::cout << "   E0 = " << results3[1] << ", rho = " << results3[2] << "\n\n";

    // Test 4: Very strong shaping (beta=2.0)
    std::cout << "4. Maxwell-Boltzmann (beta=2.0):\n";
    double results4[3];
    exponents(4, "PAM", 10.0, 0.5, 20, 100, 1e-6, "maxwell-boltzmann", 2.0, results4);
    std::cout << "   E0 = " << results4[1] << ", rho = " << results4[2] << "\n\n";

    std::cout << "Analysis:\n";
    std::cout << "---------\n";
    std::cout << "As beta increases:\n";
    std::cout << "- Lower energy symbols become MORE likely\n";
    std::cout << "- Distribution becomes more concentrated near center\n";
    std::cout << "- X normalization ensures E[|X|²] = 1 for all beta\n";
    std::cout << "\n";

    std::cout << "E0 Comparison:\n";
    std::cout << "  Uniform (β=0.0): " << results1[1] << "\n";
    std::cout << "  Beta = 0.5:      " << results2[1] << "\n";
    std::cout << "  Beta = 1.0:      " << results3[1] << "\n";
    std::cout << "  Beta = 2.0:      " << results4[1] << "\n";

    return 0;
}
