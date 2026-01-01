#include <iostream>
#include <iomanip>
#include "exponents/functions.h"

int main() {
    std::cout << "Testing with server startup parameters..." << std::endl;
    std::cout << "===========================================" << std::endl;

    // Server test parameters: M=2, SNR=5 dB, R=0.5, N=20
    std::cout << "\n=== Test: M=2, SNR=5 dB, R=0.5, N=20 ===" << std::endl;
    setN(20);
    setMod(2, "PAM");
    setSNR(pow(10.0, 5.0/10.0));  // 5 dB = 3.162 linear
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
    std::cout << "Expected: E0=0.690312, rho=1.000000" << std::endl;

    // Now test E_0_co directly at rho=1.0
    std::cout << "\n=== Direct E_0_co test at rho=1.0 ===" << std::endl;
    rho = 1.0;
    double grad_rho = 0.0;
    double e0_val = 0.0;

    E_0_co(r, rho, grad_rho, e0_val);

    std::cout << "Direct result: E0=" << std::fixed << std::setprecision(7) << e0_val
              << ", grad_rho=" << grad_rho << std::endl;
    std::cout << "E0 - rho*R = " << (e0_val - rho * r) << std::endl;

    return 0;
}
