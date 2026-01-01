#include <iostream>
#include <iomanip>
#include <chrono>
#include "functions.h"

using namespace std;
using namespace chrono;

void run_benchmark(const char* name, int M, const char* type, double SNR, double R, int N, int iterations) {
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
    for (int i = 0; i < 5; i++) {
        double e0 = GD_iid(r, rho, rho_interp, 20, N, 1e-6);
    }
    
    // Reset for actual benchmark
    rho = 1.0;
    
    // Benchmark
    auto start = high_resolution_clock::now();
    double result = 0.0;
    for (int i = 0; i < iterations; i++) {
        rho = 1.0;  // Reset rho
        double e0 = GD_iid(r, rho, rho_interp, 20, N, 1e-6);
        result = e0;
    }
    auto end = high_resolution_clock::now();
    auto duration = duration_cast<microseconds>(end - start);
    
    cout << fixed << setprecision(6);
    cout << name << ":" << endl;
    cout << "  Parameters: M=" << M << ", SNR=" << SNR << ", R=" << R << ", N=" << N << endl;
    cout << "  Result: E0=" << result << ", rho=" << rho << endl;
    cout << "  Total time: " << duration.count() << " μs" << endl;
    cout << "  Avg per iteration: " << (duration.count() / iterations) << " μs" << endl;
    cout << endl;
}

int main() {
    cout << "===========================================================" << endl;
    cout << "     PERFORMANCE COMPARISON: clean vs clean_old" << endl;
    cout << "===========================================================" << endl;
    cout << endl;
    
    // Test case 1: Low SNR, Small N
    run_benchmark("Test 1: Low SNR, Small N", 2, "PAM", 5.0, 0.5, 15, 100);
    
    // Test case 2: Moderate SNR, Medium N
    run_benchmark("Test 2: Moderate SNR, Medium N", 4, "PAM", 20.0, 0.5, 20, 50);
    
    // Test case 3: High SNR, Large N
    run_benchmark("Test 3: High SNR, Large N", 2, "PAM", 50.0, 0.5, 30, 20);
    
    // Test case 4: Very High SNR
    run_benchmark("Test 4: Very High SNR", 2, "PAM", 90.0, 0.5, 30, 10);
    
    return 0;
}
