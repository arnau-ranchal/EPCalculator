/*
 * Extended validation: PSK and QAM modulations (2D)
 *
 * Tests:
 *   1. 8-PSK at ρ=1 (Bhattacharyya bound)
 *   2. 8-PSK at ρ<1 (optimal ρ for R=0.5)
 *   3. 16-QAM at ρ=1 (Bhattacharyya bound)
 *   4. 16-QAM at ρ<1 (optimal ρ for R=0.5)
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

// My Gauss-Hermite implementation for 2D
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
    double dist2(const Symbol& other) const {
        double dI = I - other.I, dQ = Q - other.Q;
        return dI*dI + dQ*dQ;
    }
};

// PSK constellation
std::vector<Symbol> get_psk_constellation(int M) {
    std::vector<Symbol> constellation;
    for (int k = 0; k < M; k++) {
        double angle = 2.0 * M_PI * k / M;
        constellation.push_back(Symbol(std::cos(angle), std::sin(angle)));
    }
    return constellation;
}

// QAM constellation
std::vector<Symbol> get_qam_constellation(int M) {
    std::vector<Symbol> constellation;
    int sqrtM = (int)std::sqrt(M);

    // Calculate normalization factor for unit average power
    double sum_power = 0.0;
    for (int i = 0; i < sqrtM; i++) {
        for (int q = 0; q < sqrtM; q++) {
            int iVal = 2*i - sqrtM + 1;
            int qVal = 2*q - sqrtM + 1;
            sum_power += iVal*iVal + qVal*qVal;
        }
    }
    double scale = std::sqrt(M / sum_power);

    for (int i = 0; i < sqrtM; i++) {
        for (int q = 0; q < sqrtM; q++) {
            int iVal = 2*i - sqrtM + 1;
            int qVal = 2*q - sqrtM + 1;
            constellation.push_back(Symbol(iVal * scale, qVal * scale));
        }
    }
    return constellation;
}

// My Form 1 implementation for 2D
double my_compute_E0_2d(const std::vector<double>& nodes1d,
                        const std::vector<double>& weights1d,
                        double snr, double rho,
                        const std::vector<Symbol>& constellation) {
    const int M = constellation.size();
    const double Q = 1.0 / M;
    const double sqrtSNR = std::sqrt(2.0 * snr);
    const double scale = std::sqrt(2.0 * (1.0 + rho));
    const double exp_val = 1.0 / (1.0 + rho);
    const double coeff = std::pow(1.0 / (2.0 * M_PI), exp_val);
    const double LOG2 = std::log(2.0);

    double result = 0.0;
    const int N = nodes1d.size();

    for (int i = 0; i < N; i++) {
        double yI = scale * nodes1d[i];
        for (int j = 0; j < N; j++) {
            double yQ = scale * nodes1d[j];

            double inner_sum = 0.0;
            for (int k = 0; k < M; k++) {
                double xI = sqrtSNR * constellation[k].I;
                double xQ = sqrtSNR * constellation[k].Q;
                double dI = yI - xI, dQ = yQ - xQ;
                double phi_power = std::exp(-(dI*dI + dQ*dQ) / (2.0 * (1.0 + rho)));
                inner_sum += Q * coeff * phi_power;
            }

            double integrand = std::pow(inner_sum, 1.0 + rho);
            double weight = weights1d[i] * weights1d[j];
            double exp_factor = std::exp(nodes1d[i]*nodes1d[i] + nodes1d[j]*nodes1d[j]);

            result += weight * integrand * exp_factor;
        }
    }

    double gallager_exp = result * scale * scale;
    return (gallager_exp > 0) ? -std::log(gallager_exp) / LOG2 : std::numeric_limits<double>::quiet_NaN();
}

struct TestCase {
    std::string name;
    int M;
    std::string type;  // "PSK" or "QAM"
    double SNR_val;
    double R_val;
    double rho_val;    // -1 means find optimal
    int N;
};

int main() {
    std::cout << std::fixed << std::setprecision(10);

    std::cout << "================================================================================\n";
    std::cout << "  EXTENDED VALIDATION: PSK and QAM (2D Modulations)\n";
    std::cout << "================================================================================\n\n";

    std::vector<TestCase> tests = {
        {"8-PSK at ρ=1", 8, "PSK", 0.9, 0.5, 1.0, 20},
        {"8-PSK optimal ρ", 8, "PSK", 0.9, 0.5, -1.0, 20},
        {"16-QAM at ρ=1", 16, "QAM", 0.9, 0.5, 1.0, 20},
        {"16-QAM optimal ρ", 16, "QAM", 0.9, 0.5, -1.0, 20},
    };

    for (const auto& test : tests) {
        std::cout << "================================================================================\n";
        std::cout << "Test: " << test.name << "\n";
        std::cout << "      M=" << test.M << ", " << test.type
                  << ", SNR=" << test.SNR_val << ", R=" << test.R_val << ", N=" << test.N << "\n";
        std::cout << "================================================================================\n\n";

        // Setup EPCalculator
        SNR = test.SNR_val;
        R = test.R_val;

        setX(test.M, test.type);
        setQ("uniform", 0.0);
        normalizeX_for_Q();
        setN(test.N);
        compute_hweights(test.N, 1);
        setPI();
        setW();

        std::cout << "EPCalculator constellation (first 4 points):\n";
        for (int i = 0; i < std::min(4, test.M); i++) {
            std::cout << "  X[" << i << "] = " << std::real(X[i])
                     << " + " << std::imag(X[i]) << "i\n";
        }
        std::cout << "\n";

        double rho_test, E0_epc, grad;

        if (test.rho_val < 0) {
            // Find optimal rho using gradient descent
            double rho_start = 0.5;
            double rho_opt = rho_start;
            double rho_interpolated = rho_start;
            double E_R = GD_co(R, rho_opt, rho_interpolated, 100, test.N, false, 1e-10);

            std::cout << "EPCalculator Results (Optimal ρ):\n";
            std::cout << "  Optimal ρ:     " << rho_opt << "\n";
            std::cout << "  E(R):          " << E_R << "\n";
            std::cout << "  ρ * R:         " << (rho_opt * R) << "\n";
            std::cout << "  E₀(ρ_opt):     " << (E_R + rho_opt * R) << "\n\n";

            rho_test = rho_opt;
            E0_epc = E_R + rho_opt * R;
        } else {
            // Test at fixed rho
            E_0_co(R, test.rho_val, grad, E0_epc);

            std::cout << "EPCalculator Results (ρ=" << test.rho_val << "):\n";
            std::cout << "  E₀(ρ):         " << E0_epc << "\n\n";

            rho_test = test.rho_val;
        }

        // My implementation
        std::vector<double> my_nodes, my_weights;
        get_gauss_hermite(test.N, my_nodes, my_weights);

        std::vector<Symbol> my_constellation;
        if (test.type == "PSK") {
            my_constellation = get_psk_constellation(test.M);
        } else {
            my_constellation = get_qam_constellation(test.M);
        }

        std::cout << "My constellation (first 4 points):\n";
        for (int i = 0; i < std::min(4, test.M); i++) {
            std::cout << "  X[" << i << "] = " << my_constellation[i].I
                     << " + " << my_constellation[i].Q << "i\n";
        }
        std::cout << "\n";

        // Verify average power
        double avg_power = 0.0;
        for (const auto& sym : my_constellation) {
            avg_power += (sym.I * sym.I + sym.Q * sym.Q) / test.M;
        }
        std::cout << "My constellation average power: " << avg_power << "\n\n";

        double my_E0 = my_compute_E0_2d(my_nodes, my_weights, test.SNR_val, rho_test, my_constellation);

        std::cout << "My Implementation Results:\n";
        std::cout << "  E₀(ρ=" << rho_test << "): " << my_E0 << "\n\n";

        // Comparison
        double diff = std::abs(my_E0 - E0_epc);
        double rel_diff = diff / std::max(std::abs(my_E0), std::abs(E0_epc));

        std::cout << "Comparison:\n";
        std::cout << "  EPCalculator:  E₀ = " << E0_epc << "\n";
        std::cout << "  My code:       E₀ = " << my_E0 << "\n";
        std::cout << "  Difference:    Δ  = " << diff << "\n";
        std::cout << "  Relative diff: δ  = " << (rel_diff * 100) << "%\n";

        // More lenient threshold for 2D (10^-5 instead of 10^-6)
        bool pass = diff < 1e-5;
        std::cout << "  Status:        " << (pass ? "✓ PASS" : "✗ FAIL");
        if (!pass) {
            std::cout << " (difference exceeds 10^-5)";
        }
        std::cout << "\n\n";

        // If this was an optimal rho test, also check at rho=1
        if (test.rho_val < 0) {
            double E0_at_rho1_epc;
            E_0_co(R, 1.0, grad, E0_at_rho1_epc);

            double my_E0_at_rho1 = my_compute_E0_2d(my_nodes, my_weights, test.SNR_val, 1.0, my_constellation);

            std::cout << "Additional Check at ρ=1 (Bhattacharyya bound):\n";
            std::cout << "  EPCalculator:  E₀(1) = " << E0_at_rho1_epc << "\n";
            std::cout << "  My code:       E₀(1) = " << my_E0_at_rho1 << "\n";
            std::cout << "  Difference:    Δ     = " << std::abs(E0_at_rho1_epc - my_E0_at_rho1) << "\n";
            std::cout << "  Status:        " << (std::abs(E0_at_rho1_epc - my_E0_at_rho1) < 1e-5 ? "✓ PASS" : "✗ FAIL") << "\n\n";
        }
    }

    std::cout << "================================================================================\n";
    std::cout << "VALIDATION COMPLETE\n";
    std::cout << "================================================================================\n";

    return 0;
}
