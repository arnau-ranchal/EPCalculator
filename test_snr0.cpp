#include <iostream>
#include <iomanip>
#include "exponents/functions.h"

int main() {
    std::cout << "Testing SNR=0 case..." << std::endl;
    std::cout << "======================================" << std::endl;

    // Test case: M=2, PAM, SNR=0 dB (linear=1), R=0.5, N=20
    setN(20);
    setMod(2, "PAM");
    setSNR(1.0);  // 0 dB = 1.0 linear
    setR(0.5);
    setQ();
    setPI();
    setW();

    double r = 0.5;
    double rho = 0.631744;
    double grad_rho = 0.0;
    double e0_val = 0.0;

    std::cout << "\nTest: M=2, PAM, SNR=0 dB (1.0 linear), R=0.5, N=20, rho=0.631744" << std::endl;

    E_0_co(r, rho, grad_rho, e0_val);

    std::cout << "Result: E0=" << std::fixed << std::setprecision(7) << e0_val
              << ", grad_rho=" << grad_rho << std::endl;
    std::cout << "Expected: E0=0.0679905" << std::endl;

    return 0;
}
