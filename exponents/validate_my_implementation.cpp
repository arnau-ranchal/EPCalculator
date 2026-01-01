/*
 * Cross-validation test: Compare my Gauss-Hermite implementation with EPCalculator
 *
 * EPCalculator computes E(R) and finds optimal ρ
 * My implementation computes E₀(ρ) directly
 * Relationship: E₀(ρ_opt) = E(R) + ρ_opt * R
 *
 * Tests: 2-PAM and 4-PAM at various SNR and R values
 */

#include <iostream>
#include <iomanip>
#include <cmath>
#include <vector>
#include <complex>
#include <limits>

// EPCalculator external functions
extern void setX(int npoints, std::string xmode);
extern void setQ(std::string distribution, double shaping_param);
extern void normalizeX_for_Q();
extern void compute_hweights(int n, int num_iterations);
extern void setPI();
extern void setW();
extern double E_0_co(double r, double rho, double &grad_rho, double &E0);
extern double GD_co(double &r, double &rho, double &rho_interpolated, int num_iterations, int n, bool updateR, double error);
extern void setN(int n_val);

extern double SNR;
extern double R;
extern std::vector<std::complex<double>> X;

// My Gauss-Hermite implementation for 1D (PAM)
void get_gauss_hermite(int n, std::vector<double>& nodes, std::vector<double>& weights) {
    nodes.resize(n);
    weights.resize(n);
    const double eps = 1e-14;
    const int maxIter = 100;
    int m = (n + 1) / 2;

    for (int i = 0; i < m; i++) {
        double x;
        if (i == 0) x = std::sqrt(2.0 * n + 1.0) - 1.85575 * std::pow(2.0 * n + 1.0, -1.0/6.0);
        else if (i == 1) x = x - 1.14 * std::pow((double)n, 0.426) / x;
        else if (i == 2) x = 1.86 * x - 0.86 * nodes[0];
        else if (i == 3) x = 1.91 * x - 0.91 * nodes[1];
        else x = 2.0 * x - nodes[i - 2];

        for (int iter = 0; iter < maxIter; iter++) {
            double p1 = std::pow(M_PI, -0.25), p2 = 0.0;
            for (int j = 1; j <= n; j++) {
                double p3 = p2; p2 = p1;
                p1 = x * std::sqrt(2.0 / j) * p2 - std::sqrt((double)(j - 1) / j) * p3;
            }
            double dx = p1 / (std::sqrt(2.0 * n) * p2);
            x -= dx;
            if (std::abs(dx) < eps) break;
        }
        nodes[i] = x; nodes[n - 1 - i] = -x;

        double p2_final = 0.0, p1_final = std::pow(M_PI, -0.25);
        for (int j = 1; j <= n; j++) {
            double p3 = p2_final; p2_final = p1_final;
            p1_final = x * std::sqrt(2.0 / j) * p2_final - std::sqrt((double)(j - 1) / j) * p3;
        }
        double w = 1.0 / (p2_final * p2_final * n);
        weights[i] = w; weights[n - 1 - i] = w;
    }
}

struct Symbol {
    double I, Q;
    Symbol(double i = 0, double q = 0) : I(i), Q(q) {}
};

std::vector<Symbol> get_pam_constellation(int M) {
    std::vector<Symbol> constellation;
    double scale = std::sqrt(3.0 / (M*M - 1.0));
    for (int i = 0; i < M; i++) {
        double val = (2*i - M + 1) * scale;
        constellation.push_back(Symbol(val, 0));
    }
    return constellation;
}

// My Form 1 implementation for 1D
double my_compute_E0(const std::vector<double>& nodes,
                     const std::vector<double>& weights,
                     double snr, double rho,
                     const std::vector<Symbol>& constellation) {
    const int M = constellation.size();
    const double Q = 1.0 / M;
    const double sqrtSNR = std::sqrt(2.0 * snr);
    const double scale = std::sqrt(2.0 * (1.0 + rho));
    const double exp_val = 1.0 / (1.0 + rho);
    const double coeff = std::pow(1.0 / std::sqrt(2.0 * M_PI), exp_val);
    const double LOG2 = std::log(2.0);

    double result = 0.0;
    for (size_t i = 0; i < nodes.size(); i++) {
        double y = scale * nodes[i];

        double inner_sum = 0.0;
        for (int k = 0; k < M; k++) {
            double x = sqrtSNR * constellation[k].I;
            double d = y - x;
            double phi_power = std::exp(-d*d / (2.0 * (1.0 + rho)));
            inner_sum += Q * coeff * phi_power;
        }

        double integrand = std::pow(inner_sum, 1.0 + rho);
        result += weights[i] * integrand * std::exp(nodes[i] * nodes[i]);
    }

    double gallager_exp = result * scale;
    return (gallager_exp > 0) ? -std::log(gallager_exp) / LOG2 : std::numeric_limits<double>::quiet_NaN();
}

struct TestCase {
    int M;
    double SNR_val;
    double R_val;
    int N;
};

int main() {
    std::cout << std::fixed << std::setprecision(10);

    std::cout << "================================================================================\n";
    std::cout << "  CROSS-VALIDATION: My Implementation vs EPCalculator\n";
    std::cout << "================================================================================\n\n";

    std::cout << "Relationship: E₀(ρ_opt) = E(R) + ρ_opt * R\n";
    std::cout << "  - EPCalculator: Computes E(R) and finds optimal ρ via gradient descent\n";
    std::cout << "  - My code: Computes E₀(ρ) directly using Gauss-Hermite quadrature\n\n";

    std::vector<TestCase> tests = {
        {2, 0.9, 0.5, 32},   // 2-PAM, SNR=0.9, R=0.5 (matches sanity check)
        {2, 1.0, 0.5, 32},   // 2-PAM, SNR=1.0, R=0.5
        {4, 0.9, 0.5, 32},   // 4-PAM, SNR=0.9, R=0.5
        {4, 1.0, 0.5, 32},   // 4-PAM, SNR=1.0, R=0.5
    };

    for (const auto& test : tests) {
        std::cout << "================================================================================\n";
        std::cout << "Test: " << test.M << "-PAM, SNR=" << test.SNR_val
                  << ", R=" << test.R_val << ", N=" << test.N << "\n";
        std::cout << "================================================================================\n\n";

        // Setup EPCalculator
        SNR = test.SNR_val;
        R = test.R_val;

        setX(test.M, "PAM");
        setQ("uniform", 0.0);
        normalizeX_for_Q();
        setN(test.N);
        compute_hweights(test.N, 1);
        setPI();
        setW();

        std::cout << "EPCalculator constellation:\n";
        for (int i = 0; i < test.M; i++) {
            std::cout << "  X[" << i << "] = " << std::real(X[i]) << "\n";
        }
        std::cout << "\n";

        // EPCalculator: Find optimal rho using gradient descent
        double rho_start = 0.5;
        double rho_opt = rho_start;
        double rho_interpolated = rho_start;
        double E_R = GD_co(R, rho_opt, rho_interpolated, 100, test.N, false, 1e-10);

        std::cout << "EPCalculator Results:\n";
        std::cout << "  Optimal ρ:     " << rho_opt << "\n";
        std::cout << "  E(R):          " << E_R << "\n";
        std::cout << "  ρ * R:         " << (rho_opt * R) << "\n";
        std::cout << "  E₀(ρ_opt):     " << (E_R + rho_opt * R) << "\n\n";

        // My implementation: Compute E0 at the optimal rho
        std::vector<double> my_nodes, my_weights;
        get_gauss_hermite(test.N, my_nodes, my_weights);

        auto my_constellation = get_pam_constellation(test.M);

        std::cout << "My constellation (should match):\n";
        for (int i = 0; i < test.M; i++) {
            std::cout << "  X[" << i << "] = " << my_constellation[i].I << "\n";
        }
        std::cout << "\n";

        double my_E0 = my_compute_E0(my_nodes, my_weights, test.SNR_val, rho_opt, my_constellation);

        std::cout << "My Implementation Results:\n";
        std::cout << "  E₀(ρ_opt):     " << my_E0 << "\n\n";

        // Comparison
        double diff = std::abs(my_E0 - (E_R + rho_opt * R));
        double rel_diff = diff / std::max(std::abs(my_E0), std::abs(E_R + rho_opt * R));

        std::cout << "Comparison:\n";
        std::cout << "  EPCalculator:  E₀ = " << (E_R + rho_opt * R) << "\n";
        std::cout << "  My code:       E₀ = " << my_E0 << "\n";
        std::cout << "  Difference:    Δ  = " << diff << "\n";
        std::cout << "  Relative diff: δ  = " << (rel_diff * 100) << "%\n";
        std::cout << "  Status:        " << (diff < 1e-6 ? "✓ PASS" : "✗ FAIL") << "\n\n";

        // Also test at rho=1 (Bhattacharyya bound) - should be same for both
        double E0_at_rho1;
        double grad;
        E_0_co(R, 1.0, grad, E0_at_rho1);

        double my_E0_at_rho1 = my_compute_E0(my_nodes, my_weights, test.SNR_val, 1.0, my_constellation);

        std::cout << "Additional Check at ρ=1 (Bhattacharyya bound):\n";
        std::cout << "  EPCalculator:  E₀(1) = " << E0_at_rho1 << "\n";
        std::cout << "  My code:       E₀(1) = " << my_E0_at_rho1 << "\n";
        std::cout << "  Difference:    Δ     = " << std::abs(E0_at_rho1 - my_E0_at_rho1) << "\n";
        std::cout << "  Status:        " << (std::abs(E0_at_rho1 - my_E0_at_rho1) < 1e-6 ? "✓ PASS" : "✗ FAIL") << "\n\n";
    }

    std::cout << "================================================================================\n";
    std::cout << "VALIDATION COMPLETE\n";
    std::cout << "================================================================================\n";

    return 0;
}
