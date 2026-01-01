#include <iostream>
#include <iomanip>
#include <chrono>
#include "exponents/functions_wasm.cpp"

using namespace std;
using namespace std::chrono;

// Test function that mirrors the comparison harness
void test_parameters(int M, const char* typeM, double SNR_dB, double R) {
    cout << "\n=== Testing M=" << M << ", Type=" << typeM << ", SNR=" << SNR_dB << "dB, R=" << R << " ===" << endl;

    // Convert SNR from dB to linear scale
    double SNR = pow(10.0, SNR_dB / 10.0);

    // Initialize parameters
    setMod(M, typeM);
    setR(R);
    setSNR(SNR);
    setN(15);

    // Test parameters
    int num_iterations = 20;
    double threshold = 1e-6;
    double rho_gd = 0.5;
    double rho_interpolated = 0.5;
    double r = R;

    // Measure time
    auto start = high_resolution_clock::now();

    // Run the exact implementation
    double error_exponent = GD_iid(r, rho_gd, rho_interpolated, num_iterations, 15, threshold);
    double Pe = pow(2, -15 * error_exponent);

    auto end = high_resolution_clock::now();
    auto duration = duration_cast<microseconds>(end - start);

    cout << "Results:" << endl;
    cout << "  Error Exponent: " << fixed << setprecision(10) << error_exponent << endl;
    cout << "  Pe: " << scientific << setprecision(6) << Pe << endl;
    cout << "  Optimal rho: " << fixed << setprecision(6) << rho_gd << endl;
    cout << "  Computation time: " << duration.count() << " microseconds" << endl;
}

int main() {
    cout << "Testing Exact WASM Implementation" << endl;
    cout << "==================================" << endl;

    // Test the same parameters that were used in the comparison
    test_parameters(4, "PAM", 10.0, 0.5);
    test_parameters(8, "PAM", 10.0, 0.5);
    test_parameters(4, "PSK", 10.0, 0.5);
    test_parameters(8, "PSK", 10.0, 0.5);
    test_parameters(16, "QAM", 10.0, 0.5);

    // Test edge cases
    test_parameters(4, "PAM", 5.0, 0.1);
    test_parameters(4, "PAM", 15.0, 0.9);
    test_parameters(16, "QAM", 12.0, 0.7);

    cout << "\nAll tests completed successfully!" << endl;
    return 0;
}