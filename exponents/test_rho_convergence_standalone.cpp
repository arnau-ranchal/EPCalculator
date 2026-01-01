/*
 * Standalone test: Does E0 quadrature convergence depend on rho?
 *
 * This is a minimal test that can be compiled standalone or integrated
 * into the existing EPCalculator codebase.
 */

#include <iostream>
#include <iomanip>
#include <fstream>
#include <vector>
#include <cmath>
#include <string>

// Function prototypes - these should link to the actual EPCalculator functions
extern void setX(int npoints, std::string xmode);
extern void setQ(std::string distribution, double shaping_param);
extern void normalizeX_for_Q();
extern void compute_hweights(int n, int num_iterations);
extern void setPI();
extern void setW();
extern double E_0_co(double r, double rho, double &grad_rho, double &E0);
extern void setN(int n_val);

// Extern globals from functions.cpp
extern double SNR;
extern double R;
extern int n;

int main() {
    std::cout << std::fixed << std::setprecision(12);

    std::cout << "================================================================================\n";
    std::cout << "TEST: Does Quadrature Convergence Depend on rho?\n";
    std::cout << "================================================================================\n\n";

    // Configuration
    const double R_val = 0.5;        // Code rate
    const double SNR_dB = 1.0;       // SNR in dB
    const int M = 64;                // Constellation size (2^6 = 64)
    const std::string constellation = "PAM";  // PAM, PSK, or QAM

    // Set global SNR
    SNR = std::pow(10.0, SNR_dB / 10.0);
    R = R_val;

    std::cout << "Configuration:\n";
    std::cout << "  Constellation: " << constellation << " (M=" << M << ")\n";
    std::cout << "  SNR: " << SNR_dB << " dB (" << SNR << " linear)\n";
    std::cout << "  Code rate R: " << R_val << "\n\n";

    // Initialize constellation and prior
    std::cout << "Initializing constellation and prior...\n";
    setX(M, constellation);
    setQ("uniform", 0.0);
    normalizeX_for_Q();
    std::cout << "  Done.\n\n";

    // Test parameters
    std::vector<double> rho_values = {0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0};
    std::vector<int> N_values = {2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 30, 40};
    const int N_ref = 40;  // Reference (high accuracy)

    std::cout << "Test parameters:\n";
    std::cout << "  rho values: ";
    for (double rho : rho_values) std::cout << rho << " ";
    std::cout << "\n  N values: ";
    for (int N : N_values) std::cout << N << " ";
    std::cout << "\n  Reference N: " << N_ref << "\n\n";

    // Open CSV output
    std::ofstream csv("rho_convergence_results.csv");
    csv << "rho,N,E0,error_vs_ref,relative_error\n";
    csv << std::scientific << std::setprecision(16);

    std::cout << "Running convergence test...\n";
    std::cout << "================================================================================\n\n";

    // Main test loop
    for (double rho : rho_values) {
        std::cout << "rho = " << std::setw(4) << rho << ":\n";
        std::cout << "  " << std::setw(4) << "N"
                  << std::setw(18) << "E0"
                  << std::setw(15) << "Error vs N=" << N_ref
                  << std::setw(15) << "Rel Error\n";
        std::cout << "  " << std::string(60, '-') << "\n";

        // Compute reference with N_ref
        setN(N_ref);
        compute_hweights(N_ref, 1);
        setPI();
        setW();

        double E0_ref, grad_rho_ref;
        E0_ref = E_0_co(R_val, rho, grad_rho_ref, E0_ref);

        // Test with different N values
        for (int N : N_values) {
            setN(N);
            compute_hweights(N, 1);
            setPI();
            setW();

            double E0_N, grad_rho_N;
            E0_N = E_0_co(R_val, rho, grad_rho_N, E0_N);

            double error = std::abs(E0_N - E0_ref);
            double rel_error = (E0_ref != 0.0) ? (error / std::abs(E0_ref)) : 0.0;

            std::cout << "  " << std::setw(4) << N
                      << std::setw(18) << E0_N
                      << std::scientific << std::setprecision(3)
                      << std::setw(15) << error
                      << std::setw(15) << rel_error
                      << std::fixed << std::setprecision(12) << "\n";

            csv << rho << "," << N << "," << E0_N << "," << error << "," << rel_error << "\n";
        }

        std::cout << "\n";
    }

    csv.close();

    std::cout << "================================================================================\n";
    std::cout << "Test complete! Results saved to: rho_convergence_results.csv\n";
    std::cout << "================================================================================\n\n";

    std::cout << "NEXT STEPS:\n";
    std::cout << "1. Run Python analysis script to visualize results\n";
    std::cout << "2. Check if convergence curves are parallel (rho-independent)\n";
    std::cout << "   or diverging (rho-dependent)\n\n";

    std::cout << "Python analysis command:\n";
    std::cout << "  python3 analyze_rho_convergence.py\n\n";

    return 0;
}
