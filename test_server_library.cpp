#include <iostream>
#include <iomanip>
#include "exponents/functions.h"

int main() {
    std::cout << "Testing library used by server..." << std::endl;
    std::cout << "======================================" << std::endl;

    // Test case: SNR=90, N=30 (should trigger log-space in hybrid)
    setN(30);
    setMod(2, "PAM");
    setSNR(90.0);
    setR(0.5);
    setQ();
    setPI();
    setW();

    double r = 0.5;
    double rho = 1.0;
    double rho_interp = 0.0;
    double grad_rho = 0.0;
    double e0_val = 0.0;

    std::cout << "\nTest: M=2, PAM, SNR=90, R=0.5, N=30" << std::endl;
    std::cout << "Calling E_0_co(0.5, 0.5, grad_rho, e0_val)..." << std::endl;

    // This will print messages if it's the hybrid version
    E_0_co(0.5, 0.5, grad_rho, e0_val);

    std::cout << "Result: E0=" << std::fixed << std::setprecision(6) << e0_val
              << ", grad_rho=" << grad_rho << std::endl;

    return 0;
}
