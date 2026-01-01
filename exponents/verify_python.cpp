/*
 * Verify Python implementation matches C++ for:
 * 32-PAM, SNR=1.0, ρ=0.73, N=12 and N=20
 */

#include <iostream>
#include <iomanip>
#include <vector>
#include <chrono>

extern void setX(int npoints, std::string xmode);
extern void setQ(std::string distribution, double shaping_param);
extern void normalizeX_for_Q();
extern void compute_hweights(int n, int num_iterations);
extern void setPI();
extern void setW();
extern double E_0_co(double r, double rho, double &grad_rho, double &E0);
extern void setN(int n_val);

extern double SNR;
extern double R;

int main() {
    std::cout << std::fixed << std::setprecision(10);

    std::cout << "================================================================\n";
    std::cout << "VERIFYING PYTHON VS C++ IMPLEMENTATION\n";
    std::cout << "================================================================\n\n";

    // Configuration
    const int M = 32;
    const std::string constellation = "PAM";
    const double SNR_linear = 1.0;
    const double rho = 0.73;
    const double R_val = 0.5;

    SNR = SNR_linear;
    R = R_val;

    std::cout << "Configuration:\n";
    std::cout << "  M = " << M << "-" << constellation << "\n";
    std::cout << "  SNR = " << SNR_linear << " (linear)\n";
    std::cout << "  ρ = " << rho << "\n";
    std::cout << "  R = " << R_val << "\n\n";

    // Setup constellation
    setX(M, constellation);
    setQ("uniform", 0.0);
    normalizeX_for_Q();

    std::cout << "----------------------------------------------------------------\n\n";

    // Test for different N values
    std::vector<int> N_values = {5, 8, 10, 12, 15, 20};

    std::cout << "N      E₀ (C++)        Time     \n";
    std::cout << "----------------------------------------------------------------\n";

    for (int N : N_values) {
        setN(N);
        compute_hweights(N, 1);
        setPI();
        setW();

        double E0, grad_rho;

        auto start = std::chrono::high_resolution_clock::now();
        E0 = E_0_co(R_val, rho, grad_rho, E0);
        auto end = std::chrono::high_resolution_clock::now();

        double elapsed = std::chrono::duration<double>(end - start).count();

        std::cout << std::setw(2) << N << "     "
                  << std::fixed << std::setprecision(10) << std::setw(18) << E0 << "  "
                  << std::fixed << std::setprecision(3) << std::setw(8) << elapsed << "s\n";
    }

    std::cout << "\n";
    std::cout << "================================================================\n";
    std::cout << "Compare with Python results above\n";
    std::cout << "================================================================\n";

    return 0;
}
