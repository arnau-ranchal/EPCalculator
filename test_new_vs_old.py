#!/usr/bin/env python3

import subprocess
import json
import sys
import time
from ctypes import CDLL, c_double, c_int, c_char_p, byref

def load_old_implementation():
    """Load the old C++ implementation"""
    try:
        lib = CDLL('./EPCalculatorOld/EPCalculatorOld/build/libfunctions.so')
        lib.exponents.argtypes = [c_int, c_char_p, c_double, c_double, c_int, c_double,
                                 byref(c_double), byref(c_double)]
        lib.exponents.restype = c_double
        return lib
    except Exception as e:
        print(f"Error loading old implementation: {e}")
        return None

def call_new_implementation(M, typeM, SNR_dB, R):
    """Call our new exact C++ implementation"""
    try:
        result = subprocess.run([
            './test_exact_implementation_single',
            str(M), typeM, str(SNR_dB), str(R)
        ], capture_output=True, text=True, timeout=30)

        if result.returncode != 0:
            print(f"Error in new implementation: {result.stderr}")
            return None

        # Parse the output to extract results
        lines = result.stdout.split('\n')
        error_exponent = None
        rho = None
        time_us = None

        for line in lines:
            if "Error Exponent:" in line:
                error_exponent = float(line.split(":")[1].strip())
            elif "Optimal rho:" in line:
                rho = float(line.split(":")[1].strip())
            elif "Computation time:" in line:
                time_us = int(line.split(":")[1].strip().replace(" microseconds", ""))

        return {"error_exponent": error_exponent, "rho": rho, "time_us": time_us}
    except Exception as e:
        print(f"Error calling new implementation: {e}")
        return None

def compare_implementations():
    """Compare old vs new implementations"""

    # Create a single-test version of our test program
    single_test_code = '''
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
'''

    # Write and compile the single test program
    with open('test_exact_implementation_single.cpp', 'w') as f:
        f.write(single_test_code)

    result = subprocess.run(['g++', '-I', 'eigen-3.4.0', '-std=c++17', '-O3',
                           'test_exact_implementation_single.cpp', '-o',
                           'test_exact_implementation_single'],
                          capture_output=True, text=True)

    if result.returncode != 0:
        print(f"Compilation error: {result.stderr}")
        return

    # Load old implementation
    old_lib = load_old_implementation()
    if not old_lib:
        return

    # Test cases
    test_cases = [
        (4, "PAM", 10.0, 0.5),
        (8, "PAM", 10.0, 0.5),
        (4, "PSK", 10.0, 0.5),
        (8, "PSK", 10.0, 0.5),
        (16, "QAM", 10.0, 0.5),
        (4, "PAM", 5.0, 0.1),
        (4, "PAM", 15.0, 0.9),
        (16, "QAM", 12.0, 0.7)
    ]

    print("Comparison of Old vs New (Exact) Implementation")
    print("=" * 90)
    print(f"{'M':<4} {'Type':<6} {'SNR(dB)':<8} {'R':<6} {'Old E0':<15} {'New E0':<15} {'Error %':<10} {'Old rho':<10} {'New rho':<10}")
    print("-" * 90)

    total_error = 0.0
    valid_comparisons = 0

    for M, typeM, SNR_dB, R in test_cases:
        # Test old implementation
        Pe_old = c_double()
        rho_old = c_double()
        start_time_old = time.time()
        E0_old = old_lib.exponents(M, typeM.encode(), SNR_dB, R, 15, 1e-6, byref(Pe_old), byref(rho_old))
        time_old = (time.time() - start_time_old) * 1000000  # Convert to microseconds

        # Test new implementation
        new_result = call_new_implementation(M, typeM, SNR_dB, R)
        if not new_result:
            continue

        E0_new = new_result["error_exponent"]
        rho_new = new_result["rho"]
        time_new = new_result["time_us"]

        # Calculate relative error
        rel_error = 0.0
        if abs(E0_old) > 1e-10:
            rel_error = 100.0 * abs(E0_new - E0_old) / abs(E0_old)
            total_error += rel_error
            valid_comparisons += 1

        print(f"{M:<4} {typeM:<6} {SNR_dB:<8.1f} {R:<6.1f} {E0_old:<15.8f} {E0_new:<15.8f} {rel_error:<10.4f} {rho_old.value:<10.6f} {rho_new:<10.6f}")

    print("-" * 90)

    if valid_comparisons > 0:
        mean_error = total_error / valid_comparisons
        print(f"Mean Relative Error: {mean_error:.4f}%")

        if mean_error < 0.01:
            print("✅ EXCELLENT: Results match within 0.01% - exact implementation successful!")
        elif mean_error < 1.0:
            print("✅ GOOD: Results match within 1% - implementation is accurate!")
        elif mean_error < 10.0:
            print("⚠️  WARNING: Results differ - needs investigation")
        else:
            print("❌ ERROR: Large discrepancy - implementation incorrect")

if __name__ == "__main__":
    compare_implementations()