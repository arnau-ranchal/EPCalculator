#include "exponents/functions.h"
#include <iostream>
#include <iomanip>

int main() {
    std::cout << std::fixed << std::setprecision(6);
    std::cout << "SNR Sweep Test (2-PAM, R=0.5, N=20)\n";
    std::cout << "====================================\n";

    double snr_values[] = {0.1, 0.5, 1.0, 2.0, 5.0, 10.0};
    
    for (double snr : snr_values) {
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
        double e0 = GD_iid(r, rho, rho_interpolated, 1000, 20, 1e-6);

        std::cout << "SNR=" << snr << " (" << 10*log10(snr) << " dB): ";
        std::cout << "E0=" << e0 << ", rho=" << rho << "\n";
    }

    return 0;
}
