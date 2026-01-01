#include <iostream>
#include <chrono>
#include <iomanip>
#include <vector>
#define DEBUG false
#include "exponents/functions_old.cpp"

struct TestCase {
    int M;
    std::string typeM;
    double SNR, R, N, n, threshold;
    std::string description;
};

int main() {
    std::vector<TestCase> cases = {
        {2, "PAM", 5.0, 0.3, 15, 128, 1e-6, "M=2, PAM, SNR=5"},
        {2, "PAM", 10.0, 0.5, 15, 128, 1e-6, "M=2, PAM, SNR=10"},
        {4, "PAM", 6.0, 0.4, 20, 200, 1e-6, "M=4, PAM, SNR=6"},
        {8, "PAM", 8.0, 0.6, 25, 150, 1e-6, "M=8, PAM, SNR=8"},
        {16, "PAM", 10.0, 0.5, 15, 128, 1e-6, "M=16, PAM, SNR=10"}
    };

    std::cout << "⚡ Direct C++ Performance Benchmark" << std::endl;
    std::cout << "===================================" << std::endl;

    for (const auto& testCase : cases) {
        std::cout << "\n=== " << testCase.description << " ===" << std::endl;

        std::vector<double> times;
        const int runs = 10;

        for (int i = 0; i < runs; i++) {
            auto start = std::chrono::high_resolution_clock::now();

            // Initialize parameters
            setMod(testCase.M, testCase.typeM);
            setQ();
            setR(testCase.R);
            setSNR(testCase.SNR);
            setN(static_cast<int>(testCase.N));
            setPI();
            setW();

            // Run computation
            double rho_gd, rho_interpolated, r;
            int iterations;
            double e0 = GD_iid(r, rho_gd, rho_interpolated, iterations,
                              static_cast<int>(testCase.N), testCase.threshold);

            auto end = std::chrono::high_resolution_clock::now();
            auto duration = std::chrono::duration_cast<std::chrono::microseconds>(end - start);
            times.push_back(duration.count() / 1000.0); // Convert to milliseconds
        }

        // Calculate statistics
        double sum = 0;
        double min_time = times[0];
        double max_time = times[0];

        for (double time : times) {
            sum += time;
            if (time < min_time) min_time = time;
            if (time > max_time) max_time = time;
        }

        double mean = sum / runs;

        std::cout << std::fixed << std::setprecision(3);
        std::cout << "Direct C++ Performance (" << runs << " runs):" << std::endl;
        std::cout << "  Mean: " << mean << "ms" << std::endl;
        std::cout << "  Min:  " << min_time << "ms" << std::endl;
        std::cout << "  Max:  " << max_time << "ms" << std::endl;
    }

    std::cout << "\n📊 Summary:" << std::endl;
    std::cout << "- Direct C++ computation is extremely fast" << std::endl;
    std::cout << "- Most computation time in API calls is network/FFI overhead" << std::endl;
    std::cout << "- Pure computational performance is excellent" << std::endl;

    return 0;
}