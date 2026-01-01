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
    std::cout << "Low SNR Range Test: 0 to 1 linear\n";
    std::cout << "==================================\n";
    std::cout << "Parameters: 2-PAM, R=0.5, N=20\n\n";
    std::cout << "SNR(linear)  SNR(dB)      E0\n";
    std::cout << "----------  ---------  ------------\n";
    
    // Test SNR values from 0 to 1 linear
    double snr_values[] = {0.0, 0.01, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0};
    
    for (double snr : snr_values) {
        double e0 = test_snr(snr);
        double snr_db = (snr > 0) ? 10*log10(snr) : -999;
        std::cout << std::setw(10) << snr << "  ";
        std::cout << std::setw(9) << snr_db << "  ";
        std::cout << std::setw(12) << e0 << "\n";
    }
    
    return 0;
}
