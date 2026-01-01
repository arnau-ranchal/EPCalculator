#!/usr/bin/env python3
"""
Final comparison between old and new exact C++ implementations
"""

import ctypes
import time
from ctypes import CDLL, c_double, c_int, c_char_p, byref

def load_libraries():
    """Load both old and new implementation libraries"""
    try:
        # Load old implementation
        old_lib = CDLL('./EPCalculatorOld/EPCalculatorOld/build/libfunctions.so')
        old_lib.exponents.argtypes = [c_int, c_char_p, c_double, c_double, c_int, c_double,
                                    ctypes.POINTER(c_double), ctypes.POINTER(c_double)]
        old_lib.exponents.restype = c_double

        # Load new implementation
        new_lib = CDLL('./build/libnew_functions.so')
        new_lib.test_new_implementation.argtypes = [c_int, c_char_p, c_double, c_double, c_int, c_double,
                                                  ctypes.POINTER(c_double), ctypes.POINTER(c_double)]
        new_lib.test_new_implementation.restype = c_double

        return old_lib, new_lib
    except Exception as e:
        print(f"Error loading libraries: {e}")
        return None, None

def run_comparison():
    """Run comprehensive comparison"""
    old_lib, new_lib = load_libraries()
    if not old_lib or not new_lib:
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
        (16, "QAM", 12.0, 0.7),
        (8, "QAM", 8.0, 0.3),
        (4, "PSK", 12.0, 0.8)
    ]

    print("Final Comparison: Old vs New Exact Implementation")
    print("=" * 100)
    print(f"{'M':<4} {'Type':<6} {'SNR(dB)':<8} {'R':<6} {'Old E0':<15} {'New E0':<15} {'Error %':<10} {'Old rho':<10} {'New rho':<10} {'Speedup':<8}")
    print("-" * 100)

    total_error = 0.0
    total_speedup = 0.0
    valid_comparisons = 0

    for M, typeM, SNR_dB, R in test_cases:
        # Test old implementation
        Pe_old = c_double()
        rho_old = c_double()
        start_time_old = time.time()
        E0_old = old_lib.exponents(M, typeM.encode(), SNR_dB, R, 15, 1e-6, byref(Pe_old), byref(rho_old))
        time_old = time.time() - start_time_old

        # Test new implementation
        Pe_new = c_double()
        rho_new = c_double()
        start_time_new = time.time()
        E0_new = new_lib.test_new_implementation(M, typeM.encode(), SNR_dB, R, 15, 1e-6, byref(Pe_new), byref(rho_new))
        time_new = time.time() - start_time_new

        # Skip failed tests
        if E0_old == -999 or E0_new == -999:
            print(f"{M:<4} {typeM:<6} {SNR_dB:<8.1f} {R:<6.1f} ERROR - test failed")
            continue

        # Calculate relative error and speedup
        rel_error = 0.0
        if abs(E0_old) > 1e-10:
            rel_error = 100.0 * abs(E0_new - E0_old) / abs(E0_old)

        speedup = time_old / time_new if time_new > 0 else 0

        total_error += rel_error
        total_speedup += speedup
        valid_comparisons += 1

        print(f"{M:<4} {typeM:<6} {SNR_dB:<8.1f} {R:<6.1f} {E0_old:<15.8f} {E0_new:<15.8f} {rel_error:<10.4f} {rho_old.value:<10.6f} {rho_new.value:<10.6f} {speedup:<8.2f}x")

    print("-" * 100)

    if valid_comparisons > 0:
        mean_error = total_error / valid_comparisons
        mean_speedup = total_speedup / valid_comparisons

        print(f"Mean Relative Error: {mean_error:.6f}%")
        print(f"Mean Speedup: {mean_speedup:.2f}x")
        print()

        if mean_error < 0.001:
            print("✅ PERFECT: Results match within 0.001% - exact implementation is mathematically identical!")
        elif mean_error < 0.01:
            print("✅ EXCELLENT: Results match within 0.01% - exact implementation successful!")
        elif mean_error < 1.0:
            print("✅ GOOD: Results match within 1% - implementation is accurate!")
        elif mean_error < 10.0:
            print("⚠️  WARNING: Results differ - needs investigation")
        else:
            print("❌ ERROR: Large discrepancy - implementation incorrect")

        if mean_speedup >= 1.0:
            print(f"✅ PERFORMANCE: New implementation is {mean_speedup:.1f}x faster!")
        elif mean_speedup >= 0.8:
            print("✅ PERFORMANCE: Performance is comparable")
        else:
            print("⚠️  PERFORMANCE: New implementation is slower")

if __name__ == "__main__":
    run_comparison()