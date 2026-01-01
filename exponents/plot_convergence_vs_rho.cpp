/*
 * Generate data for convergence plot: |E0(ρ, N) - E0(ρ, N_ref)| vs ρ
 *
 * Configuration:
 * - Constellation: 2-PSK (M=2)
 * - SNR: 1.0 (linear)
 * - rho range: [-1, 2]
 * - N values: 2, 3, 4, ..., 19
 * - N_ref: 20
 */

#include <iostream>
#include <iomanip>
#include <fstream>
#include <vector>
#include <cmath>
#include <string>

// External functions from EPCalculator
extern void setX(int npoints, std::string xmode);
extern void setQ(std::string distribution, double shaping_param);
extern void normalizeX_for_Q();
extern void compute_hweights(int n, int num_iterations);
extern void setPI();
extern void setW();
extern double E_0_co(double r, double rho, double &grad_rho, double &E0);
extern void setN(int n_val);

// External globals
extern double SNR;
extern double R;
extern int n;

int main() {
    std::cout << std::fixed << std::setprecision(12);

    std::cout << "================================================================================\n";
    std::cout << "CONVERGENCE PLOT DATA: |E0(ρ, N) - E0(ρ, 20)| vs ρ\n";
    std::cout << "================================================================================\n\n";

    // Configuration
    const int M = 2;                      // 2-PSK
    const std::string constellation = "PSK";
    const double SNR_linear = 1.0;        // SNR = 1 (linear)
    const double R_val = 0.5;             // Code rate (arbitrary, doesn't affect test)

    // rho range: [-1, 2]
    const double rho_min = -1.0;
    const double rho_max = 2.0;
    const int n_rho_points = 151;         // Dense sampling: step size 0.02

    // N values: 2 to 19, reference N=20
    const int N_min = 2;
    const int N_max = 19;
    const int N_ref = 20;

    // Set global parameters
    SNR = SNR_linear;
    R = R_val;

    std::cout << "Configuration:\n";
    std::cout << "  Constellation: " << constellation << " (M=" << M << ")\n";
    std::cout << "  SNR: " << SNR_linear << " (linear)\n";
    std::cout << "  Code rate R: " << R_val << "\n";
    std::cout << "  rho range: [" << rho_min << ", " << rho_max << "]\n";
    std::cout << "  rho points: " << n_rho_points << "\n";
    std::cout << "  N values: " << N_min << " to " << N_max << "\n";
    std::cout << "  N_ref: " << N_ref << "\n\n";

    // Initialize constellation and prior
    std::cout << "Initializing...\n";
    setX(M, constellation);
    setQ("uniform", 0.0);
    normalizeX_for_Q();
    std::cout << "  Constellation and prior initialized.\n\n";

    // Open CSV output
    std::ofstream csv("convergence_vs_rho.csv");
    csv << std::scientific << std::setprecision(16);

    // Header
    csv << "rho";
    for (int N = N_min; N <= N_max; ++N) {
        csv << ",error_N" << N;
    }
    csv << "\n";

    std::cout << "Computing E0(ρ) for all configurations...\n";
    std::cout << "This will take a few minutes...\n\n";

    // Progress tracking
    int total_computations = n_rho_points * (1 + N_max - N_min + 1);
    int completed = 0;

    // Loop over rho values
    for (int i = 0; i < n_rho_points; ++i) {
        double rho = rho_min + (rho_max - rho_min) * i / (n_rho_points - 1);

        // Compute reference E0 with N=20
        setN(N_ref);
        compute_hweights(N_ref, 1);
        setPI();
        setW();

        double E0_ref, grad_rho_ref;
        E0_ref = E_0_co(R_val, rho, grad_rho_ref, E0_ref);
        completed++;

        // Store errors for each N
        std::vector<double> errors;

        // Compute E0 for each N and calculate error
        for (int N = N_min; N <= N_max; ++N) {
            setN(N);
            compute_hweights(N, 1);
            setPI();
            setW();

            double E0_N, grad_rho_N;
            E0_N = E_0_co(R_val, rho, grad_rho_N, E0_N);

            double error = std::abs(E0_N - E0_ref);
            errors.push_back(error);
            completed++;
        }

        // Write to CSV
        csv << rho;
        for (double err : errors) {
            csv << "," << err;
        }
        csv << "\n";

        // Progress update every 10%
        if ((i + 1) % (n_rho_points / 10) == 0) {
            double progress = 100.0 * completed / total_computations;
            std::cout << "  Progress: " << std::setprecision(1) << std::fixed
                      << progress << "% (" << i + 1 << "/" << n_rho_points
                      << " rho points)\n" << std::setprecision(12);
        }
    }

    csv.close();

    std::cout << "\n";
    std::cout << "================================================================================\n";
    std::cout << "Data generation complete!\n";
    std::cout << "================================================================================\n\n";

    std::cout << "Output file: convergence_vs_rho.csv\n";
    std::cout << "Total E0 evaluations: " << completed << "\n\n";

    std::cout << "To generate the plot, run:\n";
    std::cout << "  python3 plot_convergence_vs_rho.py\n\n";

    return 0;
}
