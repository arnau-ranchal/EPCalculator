/*
 * Comprehensive test: Does ρ-independence hold across different constellations?
 *
 * Tests multiple (M, constellation_type) configurations to verify that
 * quadrature convergence is ρ-independent regardless of constellation.
 */

#include <iostream>
#include <iomanip>
#include <fstream>
#include <vector>
#include <cmath>
#include <string>
#include <sstream>

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

struct ConstellationConfig {
    int M;
    std::string type;  // "PSK", "PAM", "QAM"

    std::string name() const {
        return std::to_string(M) + "-" + type;
    }
};

struct ConvergenceResult {
    std::string config_name;
    int M;
    std::string type;
    std::vector<double> convergence_rates;  // One per rho value
    double mean_rate;
    double std_rate;
    double cv_percent;
    bool is_rho_independent;  // CV < 15%
};

double compute_convergence_rate(const std::vector<double>& errors, const std::vector<int>& N_values) {
    // Fit log(error) vs log(N) to get slope (convergence rate)
    // Only use data points where error > machine epsilon

    std::vector<double> log_N, log_err;

    for (size_t i = 0; i < N_values.size() && i < errors.size(); ++i) {
        if (errors[i] > 1e-14) {  // Above numerical noise
            log_N.push_back(std::log(N_values[i]));
            log_err.push_back(std::log(errors[i]));
        }
    }

    if (log_N.size() < 3) return 0.0;  // Not enough data

    // Linear regression: log(err) = slope * log(N) + intercept
    double sum_x = 0, sum_y = 0, sum_xx = 0, sum_xy = 0;
    int n_points = log_N.size();

    for (size_t i = 0; i < log_N.size(); ++i) {
        sum_x += log_N[i];
        sum_y += log_err[i];
        sum_xx += log_N[i] * log_N[i];
        sum_xy += log_N[i] * log_err[i];
    }

    double slope = (n_points * sum_xy - sum_x * sum_y) / (n_points * sum_xx - sum_x * sum_x);
    return slope;
}

int main() {
    std::cout << std::fixed << std::setprecision(6);

    std::cout << "================================================================================\n";
    std::cout << "COMPREHENSIVE CONVERGENCE TEST ACROSS CONSTELLATIONS\n";
    std::cout << "================================================================================\n\n";

    // Configuration
    const double SNR_linear = 1.0;
    const double R_val = 0.5;

    // rho range: [0, 1] (valid operating range only)
    std::vector<double> rho_values;
    for (int i = 0; i <= 10; ++i) {
        rho_values.push_back(i * 0.1);
    }

    // N values for convergence test
    std::vector<int> N_values = {2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 30, 40};
    const int N_ref = 40;

    // Constellation configurations to test
    std::vector<ConstellationConfig> configs;

    // PSK: M = 2, 4, 8, 16, 32, 64
    for (int M : {2, 4, 8, 16, 32, 64}) {
        configs.push_back({M, "PSK"});
    }

    // PAM: M = 2, 4, 8, 16, 32, 64, 128
    for (int M : {2, 4, 8, 16, 32, 64, 128}) {
        configs.push_back({M, "PAM"});
    }

    // QAM: M = 4, 16, 64, 256 (must be perfect squares)
    for (int M : {4, 16, 64, 256}) {
        configs.push_back({M, "QAM"});
    }

    // Set global parameters
    SNR = SNR_linear;
    R = R_val;

    std::cout << "Test configuration:\n";
    std::cout << "  SNR: " << SNR_linear << " (linear)\n";
    std::cout << "  Code rate R: " << R_val << "\n";
    std::cout << "  rho range: [0, 1]\n";
    std::cout << "  rho points: " << rho_values.size() << "\n";
    std::cout << "  N values: " << N_values.size() << "\n";
    std::cout << "  N_ref: " << N_ref << "\n";
    std::cout << "  Constellations to test: " << configs.size() << "\n\n";

    // Results storage
    std::vector<ConvergenceResult> results;

    // Open summary CSV
    std::ofstream summary_csv("constellation_convergence_summary.csv");
    summary_csv << "M,type,mean_rate,std_rate,cv_percent,is_rho_independent\n";

    int test_num = 0;
    int total_tests = configs.size();

    // Run test for each constellation
    for (const auto& config : configs) {
        test_num++;

        std::cout << "================================================================================\n";
        std::cout << "TEST " << test_num << "/" << total_tests << ": " << config.name() << "\n";
        std::cout << "================================================================================\n\n";

        // Initialize constellation
        try {
            setX(config.M, config.type);
            setQ("uniform", 0.0);
            normalizeX_for_Q();
        } catch (...) {
            std::cout << "ERROR: Failed to initialize " << config.name() << " - skipping\n\n";
            continue;
        }

        ConvergenceResult result;
        result.config_name = config.name();
        result.M = config.M;
        result.type = config.type;

        // Open detailed CSV for this configuration
        std::string csv_filename = "convergence_" + config.name() + ".csv";
        std::ofstream csv(csv_filename);
        csv << std::scientific << std::setprecision(16);

        csv << "rho";
        for (int N : N_values) {
            csv << ",error_N" << N;
        }
        csv << ",convergence_rate\n";

        // Test each rho value
        for (double rho : rho_values) {
            if (rho == 0.0) {
                // Skip rho=0 as it may have degeneracies
                continue;
            }

            // Compute reference E0 with N=N_ref
            setN(N_ref);
            compute_hweights(N_ref, 1);
            setPI();
            setW();

            double E0_ref, grad_rho_ref;
            E0_ref = E_0_co(R_val, rho, grad_rho_ref, E0_ref);

            // Compute E0 for each N and store errors
            std::vector<double> errors;

            for (int N : N_values) {
                setN(N);
                compute_hweights(N, 1);
                setPI();
                setW();

                double E0_N, grad_rho_N;
                E0_N = E_0_co(R_val, rho, grad_rho_N, E0_N);

                double error = std::abs(E0_N - E0_ref);
                errors.push_back(error);
            }

            // Compute convergence rate for this rho
            double conv_rate = compute_convergence_rate(errors, N_values);
            result.convergence_rates.push_back(conv_rate);

            // Write to CSV
            csv << rho;
            for (double err : errors) {
                csv << "," << err;
            }
            csv << "," << conv_rate << "\n";
        }

        csv.close();

        // Compute statistics
        if (!result.convergence_rates.empty()) {
            double sum = 0, sum_sq = 0;
            for (double rate : result.convergence_rates) {
                sum += rate;
                sum_sq += rate * rate;
            }

            result.mean_rate = sum / result.convergence_rates.size();
            double variance = (sum_sq / result.convergence_rates.size()) - (result.mean_rate * result.mean_rate);
            result.std_rate = std::sqrt(variance);
            result.cv_percent = (result.std_rate / std::abs(result.mean_rate)) * 100.0;
            result.is_rho_independent = (result.cv_percent < 15.0);

            std::cout << "Results for " << config.name() << ":\n";
            std::cout << "  Mean convergence rate: " << result.mean_rate << "\n";
            std::cout << "  Std deviation: " << result.std_rate << "\n";
            std::cout << "  CV: " << result.cv_percent << "%\n";
            std::cout << "  ρ-independent: " << (result.is_rho_independent ? "YES ✓" : "NO ✗") << "\n\n";

            // Write to summary CSV
            summary_csv << config.M << "," << config.type << ","
                       << result.mean_rate << "," << result.std_rate << ","
                       << result.cv_percent << "," << (result.is_rho_independent ? "YES" : "NO") << "\n";

            results.push_back(result);
        }
    }

    summary_csv.close();

    // Final summary
    std::cout << "\n";
    std::cout << "================================================================================\n";
    std::cout << "FINAL SUMMARY: ρ-INDEPENDENCE ACROSS ALL CONSTELLATIONS\n";
    std::cout << "================================================================================\n\n";

    std::cout << std::setw(15) << "Constellation"
              << std::setw(15) << "Mean Rate"
              << std::setw(12) << "CV (%)"
              << std::setw(20) << "ρ-Independent?\n";
    std::cout << std::string(62, '-') << "\n";

    int num_independent = 0;
    for (const auto& result : results) {
        std::cout << std::setw(15) << result.config_name
                  << std::setw(15) << result.mean_rate
                  << std::setw(12) << result.cv_percent
                  << std::setw(20) << (result.is_rho_independent ? "YES ✓" : "NO ✗") << "\n";

        if (result.is_rho_independent) num_independent++;
    }

    std::cout << "\n";
    std::cout << "CONCLUSION:\n";
    std::cout << "  Configurations tested: " << results.size() << "\n";
    std::cout << "  ρ-independent (CV < 15%): " << num_independent << " ("
              << (100.0 * num_independent / results.size()) << "%)\n\n";

    if (num_independent == results.size()) {
        std::cout << "✓ CONVERGENCE IS ρ-INDEPENDENT FOR ALL CONSTELLATIONS!\n";
        std::cout << "  Polynomial approximation strategy is universally applicable.\n";
    } else {
        std::cout << "⚠ CONVERGENCE IS ρ-DEPENDENT FOR SOME CONSTELLATIONS!\n";
        std::cout << "  Polynomial approximation may need constellation-specific tuning.\n";
    }

    std::cout << "\nOutput files:\n";
    std::cout << "  - constellation_convergence_summary.csv (summary table)\n";
    std::cout << "  - convergence_<M>-<TYPE>.csv (detailed data for each constellation)\n\n";

    return 0;
}
