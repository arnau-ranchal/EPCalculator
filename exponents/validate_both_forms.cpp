/*
 * Comprehensive validation: Form 1 and Form 2 vs EPCalculator
 *
 * Tests both integral formulations against EPCalculator for:
 *   - PAM (1D modulation)
 *   - PSK (2D modulation)
 *   - QAM (2D modulation)
 */

#include <iostream>
#include <iomanip>
#include <cmath>
#include <vector>
#include <complex>
#include <limits>
#include <string>

// EPCalculator external functions
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
extern std::vector<std::complex<double>> X;

// Gauss-Hermite nodes and weights
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

// PAM constellation
std::vector<Symbol> get_pam_constellation(int M) {
    std::vector<Symbol> constellation;
    double scale = std::sqrt(3.0 / (M*M - 1.0));
    for (int i = 0; i < M; i++) {
        double val = (2*i - M + 1) * scale;
        constellation.push_back(Symbol(val, 0));
    }
    return constellation;
}

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

//=============================================================================
// FORM 1: Standard form (marginalized over y)
//=============================================================================

double form1_1d(const std::vector<double>& nodes,
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

double form1_2d(const std::vector<double>& nodes1d,
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

//=============================================================================
// FORM 2: Conditioned on transmitted symbol
//=============================================================================

double form2_1d(const std::vector<double>& nodes,
                const std::vector<double>& weights,
                double snr, double rho,
                const std::vector<Symbol>& constellation) {
    const int M = constellation.size();
    const double Q = 1.0 / M;
    const double sqrtSNR = std::sqrt(2.0 * snr);
    const double LOG2 = std::log(2.0);

    double outer_sum = 0.0;

    // Form 2 (Conditioned): ∑ᵢ Q(xᵢ) ∫ dz φ(z) [∑ⱼ Q(xⱼ) φ(z+√SNR(xᵢ-xⱼ))^(1/(1+ρ)) / φ(z)^(1/(1+ρ))]^ρ
    // Change of variables: z = √2·t (for GH quadrature)
    // Integration: ∫ f(z)φ(z) dz = (1/√π) ∑ wₖ f(√2·tₖ)

    for (int i = 0; i < M; i++) {
        double inner_integral = 0.0;

        for (size_t k = 0; k < nodes.size(); k++) {
            double t = nodes[k];

            // For each transmitted symbol i and noise realization t:
            // Compute [∑ⱼ Q(xⱼ) φ(√2·t + √(2SNR)(const_i - const_j))^(1/(1+ρ)) / φ(√2·t)^(1/(1+ρ))]^ρ

            // The ratio simplifies to: exp(-[√2·t·√(2SNR)·d_ij + SNR·d_ij²]/(1+ρ))
            // where d_ij = const_i - const_j

            double inner_sum = 0.0;
            for (int j = 0; j < M; j++) {
                double d_ij = constellation[i].I - constellation[j].I;

                // Exponent: [√2·t·√(2SNR)·d_ij + SNR·d_ij²] / (1+ρ)
                //         = [2·√SNR·t·d_ij + SNR·d_ij²] / (1+ρ)
                double exponent = -(2.0 * std::sqrt(snr) * t * d_ij + snr * d_ij * d_ij) / (1.0 + rho);
                inner_sum += Q * std::exp(exponent);
            }

            double integrand = std::pow(inner_sum, rho);
            inner_integral += weights[k] * integrand;
        }

        // Coefficient from integration: 1/√π
        inner_integral /= std::sqrt(M_PI);

        outer_sum += Q * inner_integral;
    }

    return (outer_sum > 0) ? -std::log(outer_sum) / LOG2 : std::numeric_limits<double>::quiet_NaN();
}

double form2_2d(const std::vector<double>& nodes1d,
                const std::vector<double>& weights1d,
                double snr, double rho,
                const std::vector<Symbol>& constellation) {
    const int M = constellation.size();
    const double Q = 1.0 / M;
    const double LOG2 = std::log(2.0);
    const int N = nodes1d.size();

    double outer_sum = 0.0;

    // Form 2 (Conditioned) for 2D:
    // ∑ᵢ Q(xᵢ) ∬ dz_I dz_Q φ(z_I,z_Q) [∑ⱼ Q(xⱼ) φ(z+√SNR(xᵢ-xⱼ))^(1/(1+ρ)) / φ(z)^(1/(1+ρ))]^ρ
    // Change of variables: z_I = √2·t_I, z_Q = √2·t_Q
    // Integration: ∬ f(z)φ(z) dz = (1/π) ∑ wᵢwⱼ f(√2·tᵢ, √2·tⱼ)

    for (int idx_i = 0; idx_i < M; idx_i++) {
        double inner_integral = 0.0;

        for (int i = 0; i < N; i++) {
            double t_I = nodes1d[i];
            for (int j = 0; j < N; j++) {
                double t_Q = nodes1d[j];

                // For 2D, the ratio φ(z+Δ)^(1/(1+ρ)) / φ(z)^(1/(1+ρ)) simplifies to:
                // exp(-[√2·t·Δ + |Δ|²/2]/(1+ρ))
                // where Δ = √(2SNR)·(const_i - const_j) and t·Δ is dot product

                double inner_sum = 0.0;
                for (int idx_j = 0; idx_j < M; idx_j++) {
                    double d_ij_I = constellation[idx_i].I - constellation[idx_j].I;
                    double d_ij_Q = constellation[idx_i].Q - constellation[idx_j].Q;

                    // Dot product: √2·t · √(2SNR)·d = 2·√SNR·(t_I·d_I + t_Q·d_Q)
                    double dot_product = 2.0 * std::sqrt(snr) * (t_I * d_ij_I + t_Q * d_ij_Q);

                    // Distance squared: SNR·|d|²
                    double dist_sq = snr * (d_ij_I * d_ij_I + d_ij_Q * d_ij_Q);

                    // Exponent: [2√SNR·t·d + SNR·|d|²] / (1+ρ)
                    double exponent = -(dot_product + dist_sq) / (1.0 + rho);
                    inner_sum += Q * std::exp(exponent);
                }

                double integrand = std::pow(inner_sum, rho);
                double weight = weights1d[i] * weights1d[j];

                inner_integral += weight * integrand;
            }
        }

        // Coefficient from integration: 1/π (for 2D)
        inner_integral /= M_PI;

        outer_sum += Q * inner_integral;
    }

    return (outer_sum > 0) ? -std::log(outer_sum) / LOG2 : std::numeric_limits<double>::quiet_NaN();
}

//=============================================================================
// Test structure
//=============================================================================

struct TestCase {
    std::string name;
    int M;
    std::string type;  // "PAM", "PSK", "QAM"
    double SNR_val;
    double R_val;
    double rho_val;
    int N;
};

int main() {
    std::cout << std::fixed << std::setprecision(10);

    std::cout << "================================================================================\n";
    std::cout << "  COMPREHENSIVE VALIDATION: Form 1 and Form 2 vs EPCalculator\n";
    std::cout << "================================================================================\n\n";

    std::vector<TestCase> tests = {
        {"2-PAM at ρ=1", 2, "PAM", 0.9, 0.5, 1.0, 32},
        {"4-PAM at ρ=0.445", 4, "PAM", 0.9, 0.5, 0.445318, 32},
        {"8-PSK at ρ=1", 8, "PSK", 0.9, 0.5, 1.0, 20},
        {"16-QAM at ρ=0.563", 16, "QAM", 0.9, 0.5, 0.562862, 20},
    };

    int test_num = 0;
    for (const auto& test : tests) {
        test_num++;
        std::cout << "================================================================================\n";
        std::cout << "Test " << test_num << ": " << test.name << "\n";
        std::cout << "      M=" << test.M << ", " << test.type
                  << ", SNR=" << test.SNR_val << ", ρ=" << test.rho_val << ", N=" << test.N << "\n";
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

        // Compute EPCalculator E₀
        double E0_epc, grad;
        E_0_co(R, test.rho_val, grad, E0_epc);

        // My constellation
        std::vector<Symbol> my_constellation;
        if (test.type == "PAM") {
            my_constellation = get_pam_constellation(test.M);
        } else if (test.type == "PSK") {
            my_constellation = get_psk_constellation(test.M);
        } else {
            my_constellation = get_qam_constellation(test.M);
        }

        // My nodes and weights
        std::vector<double> my_nodes, my_weights;
        get_gauss_hermite(test.N, my_nodes, my_weights);

        // Compute Form 1 and Form 2
        double my_E0_form1, my_E0_form2;
        if (test.type == "PAM") {
            my_E0_form1 = form1_1d(my_nodes, my_weights, test.SNR_val, test.rho_val, my_constellation);
            my_E0_form2 = form2_1d(my_nodes, my_weights, test.SNR_val, test.rho_val, my_constellation);
        } else {
            my_E0_form1 = form1_2d(my_nodes, my_weights, test.SNR_val, test.rho_val, my_constellation);
            my_E0_form2 = form2_2d(my_nodes, my_weights, test.SNR_val, test.rho_val, my_constellation);
        }

        // Results
        std::cout << "Results:\n";
        std::cout << "  EPCalculator:  E₀ = " << E0_epc << "\n";
        std::cout << "  Form 1:        E₀ = " << my_E0_form1 << "\n";
        std::cout << "  Form 2:        E₀ = " << my_E0_form2 << "\n\n";

        // Comparisons
        double diff_form1_epc = std::abs(my_E0_form1 - E0_epc);
        double diff_form2_epc = std::abs(my_E0_form2 - E0_epc);
        double diff_form1_form2 = std::abs(my_E0_form1 - my_E0_form2);

        double rel_form1_epc = diff_form1_epc / std::max(std::abs(my_E0_form1), std::abs(E0_epc));
        double rel_form2_epc = diff_form2_epc / std::max(std::abs(my_E0_form2), std::abs(E0_epc));
        double rel_form1_form2 = diff_form1_form2 / std::max(std::abs(my_E0_form1), std::abs(my_E0_form2));

        std::cout << "Comparisons:\n";
        std::cout << "  Form 1 vs EPCalculator:\n";
        std::cout << "    Absolute diff: " << diff_form1_epc << "\n";
        std::cout << "    Relative diff: " << (rel_form1_epc * 100) << "%\n";
        std::cout << "    Status:        " << (diff_form1_epc < 1e-5 ? "✓ PASS" : "✗ FAIL") << "\n\n";

        std::cout << "  Form 2 vs EPCalculator:\n";
        std::cout << "    Absolute diff: " << diff_form2_epc << "\n";
        std::cout << "    Relative diff: " << (rel_form2_epc * 100) << "%\n";
        std::cout << "    Status:        " << (diff_form2_epc < 1e-5 ? "✓ PASS" : "✗ FAIL") << "\n\n";

        std::cout << "  Form 1 vs Form 2:\n";
        std::cout << "    Absolute diff: " << diff_form1_form2 << "\n";
        std::cout << "    Relative diff: " << (rel_form1_form2 * 100) << "%\n";
        std::cout << "    Status:        " << (diff_form1_form2 < 1e-5 ? "✓ PASS" : "✗ FAIL") << "\n\n";
    }

    std::cout << "================================================================================\n";
    std::cout << "VALIDATION COMPLETE\n";
    std::cout << "================================================================================\n";

    return 0;
}
