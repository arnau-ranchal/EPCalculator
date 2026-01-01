#include <iostream>
#include <iomanip>
#include <chrono>

// Include our exact implementation
#include "exponents/functions_wasm.cpp"

using namespace std;
using namespace std::chrono;

int main() {
    cout << "Testing exact implementation with simple case..." << endl;

    try {
        // Simple test case
        int M = 4;
        const char* typeM = "PAM";
        double SNR_dB = 10.0;
        double R = 0.5;

        cout << "Initializing..." << endl;

        // Convert SNR from dB to linear scale
        double SNR = pow(10.0, SNR_dB / 10.0);
        cout << "SNR linear: " << SNR << endl;

        // Initialize parameters one by one
        cout << "Setting modulation..." << endl;
        setMod(M, typeM);

        cout << "Setting R..." << endl;
        setR(R);

        cout << "Setting SNR..." << endl;
        setSNR(SNR);

        cout << "Setting N..." << endl;
        setN(15);

        cout << "Running gradient descent..." << endl;
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

        auto end = high_resolution_clock::now();
        auto duration = duration_cast<microseconds>(end - start);

        double Pe = pow(2, -15 * error_exponent);

        cout << "Results:" << endl;
        cout << "  Error Exponent: " << fixed << setprecision(10) << error_exponent << endl;
        cout << "  Pe: " << scientific << setprecision(6) << Pe << endl;
        cout << "  Optimal rho: " << fixed << setprecision(6) << rho_gd << endl;
        cout << "  Computation time: " << duration.count() << " microseconds" << endl;

        cout << "Test completed successfully!" << endl;

    } catch (const exception& e) {
        cout << "Exception caught: " << e.what() << endl;
        return 1;
    } catch (...) {
        cout << "Unknown exception caught!" << endl;
        return 1;
    }

    return 0;
}