#include <iostream>
#include <iomanip>
#include <chrono>
#include "functions.h"

using namespace std;
using namespace std::chrono;

void test_case(const char* name, int M, const char* type, double SNR, double R, int N, int iterations) {
    cout << "\n=== " << name << " ===" << endl;
    cout << "Parameters: M=" << M << ", type=" << type << ", SNR=" << SNR << ", R=" << R << ", N=" << N << endl;
    
    // Setup
    setN(N);
    setMod(M, type);
    setSNR(SNR);
    setR(R);
    setQ();
    setPI();
    setW();
    
    double r = R;
    double rho = 1.0;
    double rho_interp = 0.0;
    
    // Warm-up
    GD_iid(r, rho, rho_interp, 20, N, 1e-6);
    
    // Benchmark
    auto start = high_resolution_clock::now();
    for (int i = 0; i < iterations; i++) {
        r = R;
        rho = 1.0;
        rho_interp = 0.0;
        double e0 = GD_iid(r, rho, rho_interp, 20, N, 1e-6);
    }
    auto end = high_resolution_clock::now();
    auto duration = duration_cast<microseconds>(end - start);
    
    // Final result
    r = R;
    rho = 1.0;
    rho_interp = 0.0;
    double e0 = GD_iid(r, rho, rho_interp, 20, N, 1e-6);
    
    cout << "Result: E0 = " << fixed << setprecision(6) << e0 << ", rho = " << rho << endl;
    cout << "Total time for " << iterations << " iterations: " << duration.count() << " μs" << endl;
    cout << "Average time per iteration: " << (duration.count() / iterations) << " μs" << endl;
}

int main() {
    cout << "===========================================================" << endl;
    cout << "            PERFORMANCE COMPARISON BENCHMARK               " << endl;
    cout << "===========================================================" << endl;
    
    // Test 1: Low SNR, small N
    test_case("Low SNR, Small N", 2, "PAM", 5.0, 0.5, 15, 100);
    
    // Test 2: Moderate SNR, medium N
    test_case("Moderate SNR, Medium N", 4, "PAM", 20.0, 0.5, 20, 50);
    
    // Test 3: High SNR, large N
    test_case("High SNR, Large N", 2, "PAM", 50.0, 0.5, 30, 20);
    
    // Test 4: Very high SNR (where old version might overflow)
    test_case("Very High SNR", 2, "PAM", 90.0, 0.5, 30, 10);
    
    cout << "\n===========================================================" << endl;
    cout << "                 BENCHMARK COMPLETE                        " << endl;
    cout << "===========================================================" << endl;
    
    return 0;
}
