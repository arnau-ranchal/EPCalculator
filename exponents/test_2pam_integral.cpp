/*
 * Test the 2-PAM integral directly to compare with Python
 *
 * I(ρ, SNR) = E_Z[([1 + e^(4√SNR(Z-√SNR)/(1+ρ))]/2)^ρ]
 *
 * For 2-PAM, the full E₀ involves both constellation points by symmetry.
 */

#include <iostream>
#include <iomanip>
#include <cmath>
#include <vector>
#include <gsl/gsl_sf_hermite.h>

// Compute Hermite nodes and weights
std::pair<std::vector<double>, std::vector<double>> hermite_nodes_weights(int n) {
    std::vector<double> nodes(n);
    std::vector<double> weights(n);

    gsl_sf_hermite_prob_zero(n, nodes.data());

    for (int i = 0; i < n; ++i) {
        double x = nodes[i];
        // Weight for probabilist's Hermite (weight e^(-x²/2))
        // We want physicist's (weight e^(-x²)), so adjust
        weights[i] = gsl_sf_hermite_prob_array_der(n-1, x)[n-1];
        weights[i] = sqrt(M_PI) / (n * weights[i] * weights[i]);
    }

    return {nodes, weights};
}

double compute_integral_simple(double rho, double SNR, int N) {
    /**
     * Compute I(ρ, SNR) = ∫ (1/√π) e^(-x²) h(x/√2) dx
     *
     * where h(z) = ([1 + exp(4√SNR(z-√SNR)/(1+ρ))]/2)^ρ
     */

    auto [nodes, weights] = hermite_nodes_weights(N);

    double integral = 0.0;

    for (size_t i = 0; i < nodes.size(); ++i) {
        double x = nodes[i];
        double w = weights[i];

        // Change of variables: z = x/√2
        double z = x / sqrt(2.0);

        // Compute h(z)
        double exponent = 4.0 * sqrt(SNR) * (z - sqrt(SNR)) / (1.0 + rho);

        double h;
        if (exponent > 500.0) {
            h = pow(2.0, rho);  // exp >> 1
        } else if (exponent < -500.0) {
            h = pow(0.5, rho);  // exp ≈ 0
        } else {
            h = pow((1.0 + exp(exponent)) / 2.0, rho);
        }

        integral += w * h;
    }

    // Result includes 1/√π
    return integral / sqrt(M_PI);
}

int main() {
    std::cout << std::fixed << std::setprecision(12);

    std::cout << "================================================================\n";
    std::cout << "TESTING 2-PAM INTEGRAL (C++)\n";
    std::cout << "================================================================\n\n";

    double SNR = 1.0;
    double rho = 0.5;

    std::cout << "Configuration: SNR=" << SNR << ", ρ=" << rho << "\n\n";

    std::cout << "N      I(ρ,SNR)         \n";
    std::cout << "----------------------------------------------------------------\n";

    std::vector<int> N_values = {5, 10, 15, 20, 30};

    for (int N : N_values) {
        double I_val = compute_integral_simple(rho, SNR, N);
        std::cout << std::setw(2) << N << "     " << I_val << "\n";
    }

    std::cout << "\n";
    std::cout << "================================================================\n";
    std::cout << "ADDITIONAL TEST CASES\n";
    std::cout << "================================================================\n\n";

    std::vector<std::pair<double, double>> test_cases = {
        {0.3, 0.5},
        {0.5, 1.0},
        {0.7, 1.0},
        {0.5, 2.0}
    };

    std::cout << "ρ      SNR    I(ρ,SNR) (N=20)\n";
    std::cout << "----------------------------------------------------------------\n";

    for (auto [rho_test, snr_test] : test_cases) {
        double I_val = compute_integral_simple(rho_test, snr_test, 20);
        std::cout << std::setw(4) << rho_test << "   "
                  << std::setw(4) << snr_test << "   "
                  << I_val << "\n";
    }

    std::cout << "\n";
    std::cout << "================================================================\n";
    std::cout << "Compare these values with Python Gauss-Hermite results\n";
    std::cout << "================================================================\n";

    return 0;
}
