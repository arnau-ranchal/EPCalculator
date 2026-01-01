/*
 * Systematic investigation: What causes dips?
 *
 * Test matrix:
 * - Constellation: 2-PSK, 4-PSK, 8-PAM, 16-PAM, 32-PAM
 * - SNR: 0.5, 1.0, 2.0 (linear)
 * - ρ range: [0.1, 1.0]
 * - N range: [2, 20]
 *
 * Goal: Identify if dip locations depend on:
 *   1. Constellation type/size (M)
 *   2. SNR
 *   3. Some fundamental property
 */

#include <iostream>
#include <iomanip>
#include <fstream>
#include <vector>
#include <cmath>
#include <string>

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

struct TestConfig {
    int M;
    std::string constellation;
    double SNR_linear;

    std::string name() const {
        std::stringstream ss;
        ss << M << "-" << constellation << "_SNR" << std::fixed << std::setprecision(1) << SNR_linear;
        return ss.str();
    }
};

int main() {
    std::cout << std::fixed << std::setprecision(6);

    std::cout << "================================================================================\n";
    std::cout << "INVESTIGATING DIP CAUSES\n";
    std::cout << "================================================================================\n\n";

    // Test configurations
    std::vector<TestConfig> configs;

    // Vary constellation at SNR=1.0
    configs.push_back({2, "PSK", 1.0});
    configs.push_back({4, "PSK", 1.0});
    configs.push_back({8, "PAM", 1.0});
    configs.push_back({16, "PAM", 1.0});
    configs.push_back({32, "PAM", 1.0});

    // Vary SNR for 32-PAM
    configs.push_back({32, "PAM", 0.5});
    configs.push_back({32, "PAM", 2.0});

    // Vary SNR for 2-PSK
    configs.push_back({2, "PSK", 0.5});
    configs.push_back({2, "PSK", 2.0});

    const double R_val = 0.5;
    const int N_ref = 20;

    // ρ and N values
    std::vector<double> rho_values;
    for (int i = 1; i <= 10; ++i) {
        rho_values.push_back(i * 0.1);
    }

    std::vector<int> N_values = {2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20};

    // Summary file
    std::ofstream summary("dip_investigation_summary.csv");
    summary << "config,M,constellation,SNR,num_dips,dip_locations\n";

    for (const auto& config : configs) {
        std::cout << "Testing: " << config.name() << "\n";

        // Set up constellation
        SNR = config.SNR_linear;
        R = R_val;

        setX(config.M, config.constellation);
        setQ("uniform", 0.0);
        normalizeX_for_Q();

        // Output file for this config
        std::string filename = "dips_" + config.name() + ".csv";
        std::ofstream csv(filename);
        csv << std::scientific << std::setprecision(16);

        csv << "rho";
        for (int N : N_values) {
            csv << ",error_N" << N;
        }
        csv << "\n";

        // Compute errors
        for (double rho : rho_values) {
            // Reference
            setN(N_ref);
            compute_hweights(N_ref, 1);
            setPI();
            setW();

            double E0_ref, grad_ref;
            E0_ref = E_0_co(R_val, rho, grad_ref, E0_ref);

            // Each N
            csv << rho;
            for (int N : N_values) {
                setN(N);
                compute_hweights(N, 1);
                setPI();
                setW();

                double E0_N, grad_N;
                E0_N = E_0_co(R_val, rho, grad_N, E0_N);

                double error = std::abs(E0_N - E0_ref);
                csv << "," << error;
            }
            csv << "\n";
        }

        csv.close();

        std::cout << "  Written: " << filename << "\n";
    }

    summary.close();

    std::cout << "\n";
    std::cout << "================================================================================\n";
    std::cout << "Data generation complete!\n";
    std::cout << "================================================================================\n\n";

    std::cout << "To analyze dip patterns, run:\n";
    std::cout << "  python3 analyze_dip_causes.py\n\n";

    return 0;
}
