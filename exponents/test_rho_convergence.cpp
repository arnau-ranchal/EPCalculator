/*
 * Test: Does quadrature convergence depend on rho?
 *
 * Compare E0 computation with different numbers of Gauss-Hermite nodes
 * to see if convergence rate depends on the parameter rho.
 *
 * This tests the ACTUAL integral you're computing in E_0_co.
 */

#include <iostream>
#include <iomanip>
#include <vector>
#include <cmath>
#include <fstream>
#include "functions.h"

int main() {
    std::cout << std::fixed << std::setprecision(12);

    std::cout << "="*80 << "\n";
    std::cout << "TEST: Quadrature Convergence Dependence on rho\n";
    std::cout << "="*80 << "\n\n";

    // Test parameters
    const double R = 0.5;           // Code rate
    const double SNR_dB = 1.0;      // Signal-to-noise ratio in dB

    // Set SNR (this should be a global or parameter in your code)
    // SNR = pow(10, SNR_dB / 10.0);

    // Test different rho values
    std::vector<double> rho_values = {0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0};

    // Test different numbers of quadrature nodes
    std::vector<int> N_values = {2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 30, 40};

    // Reference: highest number of nodes
    const int N_ref = 40;

    std::cout << "Configuration:\n";
    std::cout << "  Code rate R: " << R << "\n";
    std::cout << "  SNR: " << SNR_dB << " dB\n";
    std::cout << "  Reference nodes: N=" << N_ref << "\n";
    std::cout << "  Testing nodes: N=";
    for (int N : N_values) {
        if (N != N_ref) std::cout << N << " ";
    }
    std::cout << "\n\n";

    // Output CSV file
    std::ofstream csv_file("rho_convergence_results.csv");
    csv_file << "rho,N,E0,error_vs_ref,relative_error\n";

    std::cout << "Results:\n";
    std::cout << "========\n\n";

    for (double rho : rho_values) {
        std::cout << "rho = " << rho << ":\n";
        std::cout << "  N     E0               Error vs N=" << N_ref
                  << "      Rel Error\n";
        std::cout << "  " << std::string(60, '-') << "\n";

        // First compute reference with N_ref
        double E0_ref, grad_rho_ref;

        // Precompute quadrature for N_ref
        compute_hweights(N_ref, 1);  // Assuming this function sets global quadrature

        // Compute E0 with reference N
        E0_ref = E_0_co(R, rho, grad_rho_ref, E0_ref);

        // Now test with different N values
        for (int N : N_values) {
            double E0_N, grad_rho_N;

            // Precompute quadrature for N
            compute_hweights(N, 1);

            // Compute E0 with N nodes
            E0_N = E_0_co(R, rho, grad_rho_N, E0_N);

            // Compute error
            double error = std::abs(E0_N - E0_ref);
            double rel_error = (E0_ref != 0) ? error / std::abs(E0_ref) : 0;

            std::cout << "  " << std::setw(3) << N
                      << "  " << std::setw(15) << E0_N
                      << "  " << std::scientific << std::setprecision(3)
                      << error
                      << "  " << rel_error
                      << std::fixed << std::setprecision(12) << "\n";

            // Write to CSV
            csv_file << rho << "," << N << "," << E0_N << ","
                     << error << "," << rel_error << "\n";
        }

        std::cout << "\n";
    }

    csv_file.close();

    std::cout << "="*80 << "\n";
    std::cout << "ANALYSIS INSTRUCTIONS:\n";
    std::cout << "="*80 << "\n\n";

    std::cout << "Results saved to: rho_convergence_results.csv\n\n";

    std::cout << "To analyze:\n";
    std::cout << "1. Plot error vs N for each rho value\n";
    std::cout << "2. Check if convergence curves are parallel (rho-independent)\n";
    std::cout << "   or if they diverge (rho-dependent)\n\n";

    std::cout << "Python analysis code:\n";
    std::cout << R"(
import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv('rho_convergence_results.csv')

fig, axes = plt::subplots(1, 2, figsize=(14, 6))

# Plot 1: Error vs N for different rho
for rho in df['rho'].unique():
    data = df[df['rho'] == rho]
    axes[0].semilogy(data['N'], data['error_vs_ref'],
                     marker='o', label=f'ρ={rho:.1f}')

axes[0].set_xlabel('Number of Quadrature Nodes (N)')
axes[0].set_ylabel('|E0(N) - E0(40)|')
axes[0].set_title('Convergence Rate vs ρ')
axes[0].legend()
axes[0].grid(True, alpha=0.3)

# Plot 2: Required N for fixed error vs rho
target_error = 1e-10
required_N = []
rho_vals = []

for rho in df['rho'].unique():
    data = df[df['rho'] == rho]
    # Find minimum N where error < target
    valid = data[data['error_vs_ref'] < target_error]
    if not valid.empty:
        required_N.append(valid['N'].min())
        rho_vals.append(rho)

axes[1].plot(rho_vals, required_N, 'o-', linewidth=2, markersize=8)
axes[1].set_xlabel('ρ')
axes[1].set_ylabel(f'Required N for error < {target_error}')
axes[1].set_title('Node Requirement vs ρ')
axes[1].grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('rho_convergence_analysis.png', dpi=150)
print("Analysis plot saved to: rho_convergence_analysis.png")
)";

    std::cout << "\n";
    std::cout << "INTERPRETATION:\n";
    std::cout << "- If curves are parallel: Convergence is rho-independent\n";
    std::cout << "  → Can use polynomial approximation strategy\n";
    std::cout << "  → Same N works for all rho\n\n";

    std::cout << "- If curves diverge: Convergence depends on rho\n";
    std::cout << "  → Different rho needs different N\n";
    std::cout << "  → Polynomial approximation more complex\n\n";

    return 0;
}
