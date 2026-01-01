#include "exponents/functions.h"
#include <iostream>
#include <iomanip>

double test_snr(double snr) {
    setMod(2, "PAM");
    setSNR(snr);
    setR(0.5);
    setN(20);
    setQ();
    setPI();
    setW();
    
    double r = 0.5;
    double rho = 0.5;
    double rho_interpolated = 0.0;
    return GD_iid(r, rho, rho_interpolated, 1000, 20, 1e-6);
}

int main() {
    std::cout << std::fixed << std::setprecision(8);
    std::cout << "Testing functions.cpp across multiple SNR values\n";
    std::cout << "================================================\n";
    
    double snr_values[] = {0.1, 0.5, 1.0, 2.0, 5.0, 10.0};
    
    for (double snr : snr_values) {
        double e0 = test_snr(snr);
        std::cout << "SNR=" << std::setw(6) << snr << " (" << std::setw(7) << 10*log10(snr) << " dB): E0=" << e0 << "\n";
    }
    
    return 0;
}
