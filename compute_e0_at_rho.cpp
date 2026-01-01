// Compute E_0 at a specific rho value
#include "exponents/functions.h"
#include <iostream>
#include <iomanip>

// External globals from functions.cpp
extern double SNR;
extern double R;
extern int n;

void computeForConstellation(int M, std::string typeM, double SNR_val, double rho) {
    double R_val = 0.0;    // R=0 for E_0
    int N_val = 20;
    int n_val = 100;

    std::cout << "Computing E_0 for " << M << "-" << typeM << std::endl;
    std::cout << "  SNR = " << SNR_val << " (linear)" << std::endl;
    std::cout << "  ρ = " << rho << std::endl;

    // Set globals
    SNR = SNR_val;
    R = R_val;
    n = n_val;
    setN(N_val);

    // Initialize constellation
    setX(M, typeM);
    setQ("uniform", 0.0);
    normalizeX_for_Q();
    setPI();
    setW();
    compute_hweights(n, 500);

    // Evaluate E_0 at the specific rho
    double grad_rho = 0.0;
    double E0_val = 0.0;
    double result = E_0_co(R, rho, grad_rho, E0_val);

    std::cout << std::fixed << std::setprecision(10);
    std::cout << "  E_0(ρ=" << rho << ") = " << E0_val << std::endl;
    std::cout << "  Gradient: " << grad_rho << std::endl;
    std::cout << std::endl;
}

int main() {
    double SNR_val = 3.0;  // Linear SNR
    double rho = 0.723;    // Fixed rho value

    std::cout << "======================================" << std::endl;
    std::cout << "Computing E_0 at ρ=0.723, SNR=3" << std::endl;
    std::cout << "======================================" << std::endl;
    std::cout << std::endl;

    // 4-PAM
    computeForConstellation(4, "PAM", SNR_val, rho);

    // 8-PSK
    computeForConstellation(8, "PSK", SNR_val, rho);

    // 16-QAM
    computeForConstellation(16, "QAM", SNR_val, rho);

    return 0;
}
