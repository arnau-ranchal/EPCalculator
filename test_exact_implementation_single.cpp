
#include <iostream>
#include <iomanip>
#include <chrono>
#include "exponents/functions_wasm.cpp"

using namespace std;
using namespace std::chrono;

int main(int argc, char* argv[]) {
    if (argc != 5) {
        cerr << "Usage: " << argv[0] << " M typeM SNR_dB R" << endl;
        return 1;
    }

    int M = atoi(argv[1]);
    const char* typeM = argv[2];
    double SNR_dB = atof(argv[3]);
    double R = atof(argv[4]);

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

    auto end = high_resolution_clock::now();
    auto duration = duration_cast<microseconds>(end - start);

    cout << "Error Exponent: " << fixed << setprecision(10) << error_exponent << endl;
    cout << "Optimal rho: " << fixed << setprecision(6) << rho_gd << endl;
    cout << "Computation time: " << duration.count() << " microseconds" << endl;

    return 0;
}
