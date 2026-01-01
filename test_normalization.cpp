#include "exponents/functions.h"
#include <iostream>
#include <iomanip>

// Declare the external C function
extern "C" {
    double* exponents(double M, const char* typeM, double SNR, double R, double N, double n, double threshold, double* results);
}

int main() {
    std::cout << std::fixed << std::setprecision(10);
    std::cout << "Testing X Normalization for Q\n";
    std::cout << "==============================\n\n";

    // Test 2-PAM
    std::cout << "Test 1: 2-PAM at SNR=5\n";
    std::cout << "-----------------------\n";
    double results1[3];
    double* ptr1 = exponents(2, "PAM", 5.0, 0.5, 20, 100, 1e-6, results1);
    std::cout << "Pe = " << results1[0] << "\n";
    std::cout << "E0 = " << results1[1] << "\n";
    std::cout << "rho = " << results1[2] << "\n";
    std::cout << "(Should see: INFO: X normalized for Q, avg_power≈1.0, scale≈1.0)\n\n";

    // Test 16-QAM
    std::cout << "Test 2: 16-QAM at SNR=10\n";
    std::cout << "-------------------------\n";
    double results2[3];
    double* ptr2 = exponents(16, "QAM", 10.0, 0.75, 30, 100, 1e-6, results2);
    std::cout << "Pe = " << results2[0] << "\n";
    std::cout << "E0 = " << results2[1] << "\n";
    std::cout << "rho = " << results2[2] << "\n";
    std::cout << "(Should see: INFO: X normalized for Q, avg_power≈1.0, scale≈1.0)\n\n";

    // Test PSK
    std::cout << "Test 3: 4-PSK at SNR=8\n";
    std::cout << "-----------------------\n";
    double results3[3];
    double* ptr3 = exponents(4, "PSK", 8.0, 0.5, 20, 100, 1e-6, results3);
    std::cout << "Pe = " << results3[0] << "\n";
    std::cout << "E0 = " << results3[1] << "\n";
    std::cout << "rho = " << results3[2] << "\n";
    std::cout << "(Should see: INFO: X normalized for Q, avg_power≈1.0, scale≈1.0)\n\n";

    std::cout << "Test Complete!\n";
    std::cout << "Expected: All avg_power ≈ 1.0, scale_factor ≈ 1.0 (since Q is uniform)\n";

    return 0;
}
