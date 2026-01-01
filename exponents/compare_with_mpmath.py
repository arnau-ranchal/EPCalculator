#!/usr/bin/env python3
"""
Compare Gauss-Hermite and Sinh-sinh implementations against mpmath high-precision

This establishes absolute ground truth and measures actual errors.
"""

import numpy as np
from scipy.special import roots_hermite
import mpmath as mp
import time

# Set mpmath to very high precision
mp.dps = 100  # 100 decimal places

SNR_test = mp.mpf(1.0)
rho_test = mp.mpf(0.5)

def h_mpmath(z, rho, SNR):
    """High-precision h(z) using mpmath"""
    z = mp.mpf(z)
    rho = mp.mpf(rho)
    SNR = mp.mpf(SNR)

    exponent = 4 * mp.sqrt(SNR) * (z - mp.sqrt(SNR)) / (1 + rho)
    h = ((1 + mp.exp(exponent)) / 2) ** rho
    return h

def integrand_mpmath(z):
    """Full integrand with Gaussian weight"""
    z = mp.mpf(z)
    gauss_weight = mp.exp(-z**2 / 2) / mp.sqrt(2 * mp.pi)
    return gauss_weight * h_mpmath(z, rho_test, SNR_test)

def gauss_hermite_numpy(rho, SNR, N):
    """Gauss-Hermite using numpy (double precision)"""
    nodes, weights = roots_hermite(N)

    integral = 0.0
    for t, w in zip(nodes, weights):
        z = np.sqrt(2) * t
        exponent = 4 * np.sqrt(SNR) * (z - np.sqrt(SNR)) / (1 + rho)
        if exponent > 500:
            h = 2.0 ** rho
        elif exponent < -500:
            h = 0.5 ** rho
        else:
            h = ((1 + np.exp(exponent)) / 2) ** rho
        integral += w * h

    return integral / np.sqrt(np.pi)

def gauss_hermite_mpmath(rho, SNR, N):
    """Gauss-Hermite using mpmath (arbitrary precision)"""
    # Get nodes and weights in high precision
    # Note: mpmath doesn't have Hermite directly, but we can use numpy nodes
    # and convert to mpmath for the computation
    nodes_np, weights_np = roots_hermite(N)

    integral = mp.mpf(0)
    for t_np, w_np in zip(nodes_np, weights_np):
        t = mp.mpf(t_np)
        w = mp.mpf(w_np)
        z = mp.sqrt(2) * t

        h = h_mpmath(z, rho, SNR)
        integral += w * h

    return integral / mp.sqrt(mp.pi)

def sinh_sinh_numpy(rho, SNR, level):
    """Sinh-sinh using numpy (double precision)"""
    h = 0.1 / (1 << (level - 3)) if level >= 3 else 0.1
    t_max = 4.0

    nodes = []
    weights = []

    k = 0
    while k * h <= t_max:
        t = k * h
        for sign in [1, -1] if k > 0 else [1]:
            t_val = sign * t
            sinh_t = np.sinh(t_val)
            cosh_t = np.cosh(t_val)
            arg = np.pi / 2 * sinh_t

            if abs(arg) > 20:
                continue

            x = np.sinh(arg)
            w = h * (np.pi / 2) * cosh_t * np.cosh(arg)

            nodes.append(x)
            weights.append(w)
        k += 1

    integral = 0.0
    for z, w in zip(nodes, weights):
        gauss_weight = np.exp(-z**2 / 2) / np.sqrt(2 * np.pi)
        exponent = 4 * np.sqrt(SNR) * (z - np.sqrt(SNR)) / (1 + rho)
        if exponent > 500:
            h = 2.0 ** rho
        elif exponent < -500:
            h = 0.5 ** rho
        else:
            h = ((1 + np.exp(exponent)) / 2) ** rho
        integral += w * gauss_weight * h

    return integral, len(nodes)

def sinh_sinh_mpmath(rho, SNR, level):
    """Sinh-sinh using mpmath (arbitrary precision)"""
    h = mp.mpf(0.1) / (1 << (level - 3)) if level >= 3 else mp.mpf(0.1)
    t_max = mp.mpf(4.0)

    nodes = []
    weights = []

    k = 0
    while k * h <= t_max:
        t = k * h
        for sign in [1, -1] if k > 0 else [1]:
            t_val = sign * t
            sinh_t = mp.sinh(t_val)
            cosh_t = mp.cosh(t_val)
            arg = mp.pi / 2 * sinh_t

            # Check for overflow (in mpmath this is less of an issue)
            if abs(float(arg)) > 50:
                continue

            x = mp.sinh(arg)
            w = h * (mp.pi / 2) * cosh_t * mp.cosh(arg)

            nodes.append(x)
            weights.append(w)
        k += 1

    integral = mp.mpf(0)
    for z, w in zip(nodes, weights):
        gauss_weight = mp.exp(-z**2 / 2) / mp.sqrt(2 * mp.pi)
        h_val = h_mpmath(z, rho, SNR)
        integral += w * gauss_weight * h_val

    return integral, len(nodes)

def main():
    print("="*80)
    print("COMPARISON WITH MPMATH HIGH-PRECISION GROUND TRUTH")
    print("="*80)
    print()

    print(f"Configuration: SNR={float(SNR_test)}, ρ={float(rho_test)}")
    print(f"mpmath precision: {mp.dps} decimal digits")
    print()

    # Compute ground truth with mpmath direct integration
    print("-"*80)
    print("Computing ground truth with mpmath.quad...")
    print("-"*80)

    start = time.time()
    I_true = mp.quad(integrand_mpmath, [-mp.inf, mp.inf])
    elapsed = time.time() - start

    print(f"Ground truth (mpmath): {mp.nstr(I_true, 25)}")
    print(f"Time: {elapsed:.2f}s")
    print()

    # Test Gauss-Hermite
    print("="*80)
    print("GAUSS-HERMITE")
    print("="*80)
    print()

    print(f"{'N':<5} {'Precision':<12} {'Result (25 digits)':<30} {'Error':<15} {'Time (ms)':<12}")
    print("-"*80)

    for N in [10, 20, 30, 40, 50]:
        # Double precision
        start = time.time()
        I_np = gauss_hermite_numpy(float(rho_test), float(SNR_test), N)
        elapsed_np = (time.time() - start) * 1000
        error_np = abs(mp.mpf(I_np) - I_true)

        print(f"{N:<5} {'double':<12} {mp.nstr(mp.mpf(I_np), 25):<30} {mp.nstr(error_np, 10):<15} {elapsed_np:<12.3f}")

        # Arbitrary precision
        start = time.time()
        I_mp = gauss_hermite_mpmath(rho_test, SNR_test, N)
        elapsed_mp = (time.time() - start) * 1000
        error_mp = abs(I_mp - I_true)

        print(f"{N:<5} {'mpmath':<12} {mp.nstr(I_mp, 25):<30} {mp.nstr(error_mp, 10):<15} {elapsed_mp:<12.3f}")
        print()

    # Test Sinh-sinh
    print("="*80)
    print("SINH-SINH")
    print("="*80)
    print()

    print(f"{'Level':<5} {'Nodes':<7} {'Precision':<12} {'Result (25 digits)':<30} {'Error':<15} {'Time (ms)':<12}")
    print("-"*80)

    for level in [4, 5, 6, 7]:
        # Double precision
        start = time.time()
        I_np, n_nodes = sinh_sinh_numpy(float(rho_test), float(SNR_test), level)
        elapsed_np = (time.time() - start) * 1000
        error_np = abs(mp.mpf(I_np) - I_true)

        print(f"{level:<5} {n_nodes:<7} {'double':<12} {mp.nstr(mp.mpf(I_np), 25):<30} {mp.nstr(error_np, 10):<15} {elapsed_np:<12.3f}")

        # Arbitrary precision
        start = time.time()
        I_mp, n_nodes_mp = sinh_sinh_mpmath(rho_test, SNR_test, level)
        elapsed_mp = (time.time() - start) * 1000
        error_mp = abs(I_mp - I_true)

        print(f"{level:<5} {n_nodes_mp:<7} {'mpmath':<12} {mp.nstr(I_mp, 25):<30} {mp.nstr(error_mp, 10):<15} {elapsed_mp:<12.3f}")
        print()

    print("="*80)
    print("ANALYSIS")
    print("="*80)
    print()

    # Find best from each method
    print("Best achievable accuracy (double precision):")
    print("-"*80)

    gh_best = gauss_hermite_numpy(float(rho_test), float(SNR_test), 50)
    gh_error = abs(mp.mpf(gh_best) - I_true)
    print(f"Gauss-Hermite (N=50):  error = {mp.nstr(gh_error, 10)}")

    ss_best, _ = sinh_sinh_numpy(float(rho_test), float(SNR_test), 7)
    ss_error = abs(mp.mpf(ss_best) - I_true)
    print(f"Sinh-sinh (level=7):   error = {mp.nstr(ss_error, 10)}")
    print()

    print("Best achievable accuracy (arbitrary precision):")
    print("-"*80)

    gh_mp_best = gauss_hermite_mpmath(rho_test, SNR_test, 50)
    gh_mp_error = abs(gh_mp_best - I_true)
    print(f"Gauss-Hermite (N=50):  error = {mp.nstr(gh_mp_error, 10)}")

    ss_mp_best, _ = sinh_sinh_mpmath(rho_test, SNR_test, 7)
    ss_mp_error = abs(ss_mp_best - I_true)
    print(f"Sinh-sinh (level=7):   error = {mp.nstr(ss_mp_error, 10)}")
    print()

    print("="*80)
    print("CONCLUSIONS")
    print("="*80)
    print()

    print("1. Double-precision implementations:")
    if ss_error < gh_error:
        print(f"   Sinh-sinh is MORE accurate: {float(gh_error / ss_error):.1f}× better")
    else:
        print(f"   Gauss-Hermite is MORE accurate: {float(ss_error / gh_error):.1f}× better")

    print()
    print("2. Arbitrary-precision implementations:")
    if ss_mp_error < gh_mp_error:
        print(f"   Sinh-sinh is MORE accurate: {float(gh_mp_error / ss_mp_error):.1f}× better")
    else:
        print(f"   Gauss-Hermite is MORE accurate: {float(ss_mp_error / gh_mp_error):.1f}× better")

    print()
    print("3. Limiting factor:")
    if float(ss_error) < 1e-14 and float(gh_error) > 1e-10:
        print("   Sinh-sinh reaches machine precision, Gauss-Hermite is limited")
        print("   by inherent approximation error (width mismatch).")
    elif float(gh_error) < 1e-14 and float(ss_error) > 1e-10:
        print("   Gauss-Hermite reaches machine precision, Sinh-sinh is limited.")
    else:
        print("   Both methods reach machine precision (~1e-15).")

if __name__ == "__main__":
    main()
