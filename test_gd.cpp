#include <iostream>
#include <iomanip>
#include "exponents/functions.h"

int main() {
    std::cout << "Testing with gradient descent optimization..." << std::endl;
    std::cout << "===============================================" << std::endl;

    // Test: SNR=0 dB (1.0 linear)
    std::cout << "\n=== Test: SNR=0 dB (1.0 linear) ===" << std::endl;
    setN(20);
    setMod(2, "PAM");
    setSNR(1.0);  // 0 dB = 1.0 linear
    setR(0.5);
    setQ();
    setPI();
    setW();

    double r = 0.5;
    double rho = 1.0;  // Initial guess
    double rho_interp = 0.0;
    
    // Run gradient descent to find optimal rho
    double result = GD_iid(r, rho, rho_interp, 20, 20, 1e-6);

    std::cout << "After optimization:" << std::endl;
    std::cout << "Optimal rho=" << std::fixed << std::setprecision(6) << rho << std::endl;
    std::cout << "E0 - rho*R=" << result << std::endl;
    std::cout << "Expected E0=0.0679905 at rho=0.631744" << std::endl;

    return 0;
}
