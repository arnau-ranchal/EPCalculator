#include "exponents/functions_old.h"
#include <iostream>
#include <iomanip>

int main() {
    // Test parameters: 2-PAM, SNR=0.1 linear, R=0.5, N=20, n=100, threshold=1e-6

    std::cout << std::fixed << std::setprecision(6);
    std::cout << "Testing functions_old.cpp with SNR=0.1 linear\n";
    std::cout << "Parameters: M=2 (PAM), SNR=0.1, R=0.5, N=20, n=100, threshold=1e-6\n";
    std::cout << "==========================================\n";

    // Setup the calculator
    setMod(2, "PAM");
    setSNR(0.1);  // SNR = 0.1 linear
    setR(0.5);
    setN(20);

    // Initialize Q, PI, W matrices
    setQ();
    setPI();
    setW();

    // Compute error exponent using GD_iid
    double r = 0.5;
    double rho = 0.5;  // Initial guess
    double rho_interpolated = 0.0;
    int num_iterations = 1000;
    double error = 1e-6;

    double e0 = GD_iid(r, rho, rho_interpolated, num_iterations, 20, error);

    std::cout << "\nResults:\n";
    std::cout << "  E0 (error exponent): " << e0 << "\n";
    std::cout << "  Optimal rho: " << rho << "\n";
    std::cout << "  rho_interpolated: " << rho_interpolated << "\n";

    // Compute error probability
    int n = 100;
    double Pe = std::pow(2, -n * e0);
    std::cout << "  Error Probability (n=100): " << Pe << "\n";

    return 0;
}
