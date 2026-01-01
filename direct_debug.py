#!/usr/bin/env python3

import ctypes
import subprocess
import os
from ctypes import CDLL, c_double, c_int, c_char_p, byref, POINTER

def test_old_implementation():
    """Test old implementation directly"""
    try:
        # Load old implementation
        lib = CDLL('./EPCalculatorOld/EPCalculatorOld/build/libfunctions.so')

        # Set up function signature
        lib.exponents.argtypes = [c_int, c_char_p, c_double, c_double, c_int, c_double,
                                POINTER(c_double), POINTER(c_double)]
        lib.exponents.restype = c_double

        # Test case: M=2, PAM, SNR=5dB, R=0.3
        Pe = c_double()
        rho = c_double()

        result = lib.exponents(2, b"PAM", 5.0, 0.3, 15, 1e-6, byref(Pe), byref(rho))

        print(f"Old implementation results:")
        print(f"  Error exponent: {result}")
        print(f"  Pe: {Pe.value}")
        print(f"  Optimal rho: {rho.value}")

        return result, Pe.value, rho.value

    except Exception as e:
        print(f"Error with old implementation: {e}")
        return None, None, None

def build_and_test_new():
    """Build and test our new implementation"""

    # Create a simple test program for our implementation
    test_code = '''
#include <iostream>
#include <iomanip>
#include "exponents/functions_wasm.cpp"

using namespace std;

extern "C" {
    double test_our_implementation(int M, const char* typeM, double SNR_dB, double R) {
        try {
            double SNR = pow(10.0, SNR_dB / 10.0);

            setMod(M, typeM);
            setR(R);
            setSNR(SNR);
            setN(15);

            double rho_gd = 0.5;
            double rho_interpolated = 0.5;
            double r = R;

            double result = GD_iid(r, rho_gd, rho_interpolated, 20, 15, 1e-6);
            double E0 = result + rho_gd * r;

            cout << "New implementation results:" << endl;
            cout << "  Optimization result (E0-rho*R): " << result << endl;
            cout << "  Error exponent E0: " << E0 << endl;
            cout << "  Optimal rho: " << rho_gd << endl;

            return E0;
        } catch (...) {
            return -999.0;
        }
    }
}
'''

    with open('test_new_impl.cpp', 'w') as f:
        f.write(test_code)

    # Compile
    result = subprocess.run([
        'g++', '-I', 'eigen-3.4.0', '-std=c++17', '-O3', '-fPIC', '-shared',
        'test_new_impl.cpp', '-o', 'build/libtest_new.so'
    ], capture_output=True, text=True)

    if result.returncode != 0:
        print(f"Compilation error: {result.stderr}")
        return None

    # Load and test
    try:
        lib = CDLL('./build/libtest_new.so')
        lib.test_our_implementation.argtypes = [c_int, c_char_p, c_double, c_double]
        lib.test_our_implementation.restype = c_double

        result = lib.test_our_implementation(2, b"PAM", 5.0, 0.3)
        return result

    except Exception as e:
        print(f"Error with new implementation: {e}")
        return None

if __name__ == "__main__":
    print("Direct Implementation Comparison")
    print("===============================")

    # Test old implementation
    old_E0, old_Pe, old_rho = test_old_implementation()

    print()

    # Test new implementation
    new_E0 = build_and_test_new()

    print()
    print("COMPARISON:")
    if old_E0 is not None and new_E0 is not None:
        print(f"Old E0: {old_E0:.8f}")
        print(f"New E0: {new_E0:.8f}")
        print(f"Difference: {abs(old_E0 - new_E0):.8f}")
        print(f"Relative error: {abs(old_E0 - new_E0)/abs(old_E0)*100:.4f}%")

        if abs(old_E0 - new_E0) < 0.0001:
            print("✅ RESULTS MATCH!")
        else:
            print("❌ RESULTS DON'T MATCH - NEED TO DEBUG")
    else:
        print("❌ FAILED TO GET RESULTS FROM ONE OR BOTH IMPLEMENTATIONS")