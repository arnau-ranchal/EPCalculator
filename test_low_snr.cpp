#include "EPCalculatorOld/EPCalculatorOld/exponents/functions.h"
#include <iostream>
#include <iomanip>

int main() {
    // Test with very low SNR = 0.1
    setMod(2, "PAM");
    setQ();
    setR(0.3);
    setSNR(0.1);  // Very low SNR
    setN(15);
    setPI();
    setW();

    double rho_gd, rho_interpolated, r;
    int iterations;
    double e0 = GD_iid(r, rho_gd, rho_interpolated, iterations, 15, 1e-6);

    std::cout << std::fixed << std::setprecision(6);
    std::cout << "Low SNR test (SNR=0.1, R=0.3):" << std::endl;
    std::cout << "E0: " << e0 << std::endl;
    std::cout << "rho: " << rho_gd << std::endl;
    std::cout << "Pe: " << pow(2, -128 * e0) << std::endl;

    return 0;
}