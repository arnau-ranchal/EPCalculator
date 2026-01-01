#!/usr/bin/env python3
"""
Compare my implementations vs mpmath's automatic quadrature

mpmath.quad() automatically chooses the best algorithm.
This tests: Are my implementations correct and competitive?
"""

import numpy as np
from scipy.special import roots_hermite
import mpmath as mp
import time

# Configuration
SNR_test = 1.0
rho_test = 0.5

def integrand_mpmath(z):
    """The integrand in mpmath format"""
    z = mp.mpf(z)
    rho = mp.mpf(rho_test)
    SNR = mp.mpf(SNR_test)

    # Gaussian weight
    gauss_weight = mp.exp(-z**2 / 2) / mp.sqrt(2 * mp.pi)

    # h(z) = ([1 + exp(4√SNR(z-√SNR)/(1+ρ))]/2)^ρ
    exponent = 4 * mp.sqrt(SNR) * (z - mp.sqrt(SNR)) / (1 + rho)
    h = ((1 + mp.exp(exponent)) / 2) ** rho

    return gauss_weight * h


def gauss_hermite_double(rho, SNR, N):
    """My Gauss-Hermite implementation (double precision)"""
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


def sinh_sinh_double(rho, SNR, level):
    """My Sinh-sinh implementation (double precision)"""
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
            h_val = 2.0 ** rho
        elif exponent < -500:
            h_val = 0.5 ** rho
        else:
            h_val = ((1 + np.exp(exponent)) / 2) ** rho
        integral += w * gauss_weight * h_val

    return integral, len(nodes)


def mpmath_auto(precision, verbose=True):
    """
    Let mpmath choose the algorithm automatically

    Args:
        precision: decimal digits of precision
    """
    original_dps = mp.mp.dps
    mp.mp.dps = precision

    start = time.time()
    result = mp.quad(
        integrand_mpmath,
        [-mp.inf, mp.inf],
        error=True,
        verbose=verbose
    )
    elapsed = time.time() - start

    mp.mp.dps = original_dps

    if isinstance(result, tuple):
        return result[0], result[1], elapsed  # value, error estimate, time
    else:
        return result, None, elapsed


def main():
    print("="*80)
    print("MY IMPLEMENTATIONS vs MPMATH AUTO-QUADRATURE")
    print("="*80)
    print()

    print(f"Configuration: SNR={SNR_test}, ρ={rho_test}")
    print()

    # Part 1: Get ground truth from mpmath with very high precision
    print("-"*80)
    print("GROUND TRUTH (mpmath with 50 digits)")
    print("-"*80)

    I_true, error_est, time_true = mpmath_auto(50, verbose=False)
    print(f"Result: {mp.nstr(I_true, 30)}")
    print(f"Estimated error: {mp.nstr(error_est, 10) if error_est else 'N/A'}")
    print(f"Time: {time_true:.3f}s")
    print()

    # Part 2: Test mpmath at different precisions
    print("="*80)
    print("MPMATH AUTO-QUADRATURE (varying precision)")
    print("="*80)
    print()

    print(f"{'Precision':<12} {'Result (20 digits)':<25} {'Error vs Truth':<15} {'Time (s)':<10}")
    print("-"*80)

    mpmath_results = []
    for prec in [15, 20, 30, 40]:
        I_mp, err_est, t_mp = mpmath_auto(prec, verbose=False)
        error_actual = abs(I_mp - I_true)

        mpmath_results.append({
            'precision': prec,
            'result': I_mp,
            'error': error_actual,
            'time': t_mp
        })

        print(f"{prec:<12} {mp.nstr(I_mp, 20):<25} {mp.nstr(error_actual, 10):<15} {t_mp:<10.3f}")

    print()

    # Part 3: Test my Gauss-Hermite
    print("="*80)
    print("MY GAUSS-HERMITE IMPLEMENTATION")
    print("="*80)
    print()

    print(f"{'N':<5} {'Result (20 digits)':<25} {'Error vs Truth':<15} {'Time (μs)':<10}")
    print("-"*80)

    gh_results = []
    for N in [10, 20, 30, 40, 50]:
        # Run multiple times for timing
        times = []
        for _ in range(100):
            start = time.perf_counter()
            I_gh = gauss_hermite_double(rho_test, SNR_test, N)
            times.append(time.perf_counter() - start)

        avg_time = np.mean(times) * 1e6  # microseconds
        error = abs(mp.mpf(I_gh) - I_true)

        gh_results.append({
            'N': N,
            'result': I_gh,
            'error': error,
            'time_us': avg_time
        })

        print(f"{N:<5} {mp.nstr(mp.mpf(I_gh), 20):<25} {mp.nstr(error, 10):<15} {avg_time:<10.1f}")

    print()

    # Part 4: Test my Sinh-sinh
    print("="*80)
    print("MY SINH-SINH IMPLEMENTATION")
    print("="*80)
    print()

    print(f"{'Level':<5} {'Nodes':<7} {'Result (20 digits)':<25} {'Error vs Truth':<15} {'Time (μs)':<10}")
    print("-"*80)

    ss_results = []
    for level in [4, 5, 6, 7]:
        # Run multiple times for timing
        times = []
        for _ in range(100):
            start = time.perf_counter()
            I_ss, n_nodes = sinh_sinh_double(rho_test, SNR_test, level)
            times.append(time.perf_counter() - start)

        avg_time = np.mean(times) * 1e6  # microseconds
        error = abs(mp.mpf(I_ss) - I_true)

        ss_results.append({
            'level': level,
            'nodes': n_nodes,
            'result': I_ss,
            'error': error,
            'time_us': avg_time
        })

        print(f"{level:<5} {n_nodes:<7} {mp.nstr(mp.mpf(I_ss), 20):<25} {mp.nstr(error, 10):<15} {avg_time:<10.1f}")

    print()

    # Part 5: Summary comparison
    print("="*80)
    print("COMPARISON SUMMARY")
    print("="*80)
    print()

    print("Accuracy comparison (target: 1e-10):")
    print("-"*80)

    # Find which methods achieve 1e-10
    mp_1e10 = next((r for r in mpmath_results if float(r['error']) < 1e-10), None)
    gh_1e10 = next((r for r in gh_results if float(r['error']) < 1e-10), None)
    ss_1e10 = next((r for r in ss_results if float(r['error']) < 1e-10), None)

    if mp_1e10:
        print(f"mpmath (auto):      precision={mp_1e10['precision']}, "
              f"error={mp.nstr(mp_1e10['error'], 8)}, time={mp_1e10['time']*1e6:.0f} μs")

    if gh_1e10:
        print(f"Gauss-Hermite:      N={gh_1e10['N']}, "
              f"error={mp.nstr(gh_1e10['error'], 8)}, time={gh_1e10['time_us']:.0f} μs")
    else:
        print(f"Gauss-Hermite:      Does not reach 1e-10 (best: {mp.nstr(gh_results[-1]['error'], 8)})")

    if ss_1e10:
        print(f"Sinh-sinh:          level={ss_1e10['level']}, nodes={ss_1e10['nodes']}, "
              f"error={mp.nstr(ss_1e10['error'], 8)}, time={ss_1e10['time_us']:.0f} μs")

    print()
    print("Accuracy comparison (target: 1e-14):")
    print("-"*80)

    mp_1e14 = next((r for r in mpmath_results if float(r['error']) < 1e-14), None)
    gh_1e14 = next((r for r in gh_results if float(r['error']) < 1e-14), None)
    ss_1e14 = next((r for r in ss_results if float(r['error']) < 1e-14), None)

    if mp_1e14:
        print(f"mpmath (auto):      precision={mp_1e14['precision']}, "
              f"error={mp.nstr(mp_1e14['error'], 8)}, time={mp_1e14['time']*1e6:.0f} μs")
    else:
        print(f"mpmath (auto):      Does not reach 1e-14 (increase precision)")

    if gh_1e14:
        print(f"Gauss-Hermite:      N={gh_1e14['N']}, "
              f"error={mp.nstr(gh_1e14['error'], 8)}, time={gh_1e14['time_us']:.0f} μs")
    else:
        print(f"Gauss-Hermite:      Cannot reach 1e-14 (method-limited)")

    if ss_1e14:
        print(f"Sinh-sinh:          level={ss_1e14['level']}, nodes={ss_1e14['nodes']}, "
              f"error={mp.nstr(ss_1e14['error'], 8)}, time={ss_1e14['time_us']:.0f} μs")
    else:
        print(f"Sinh-sinh:          Does not reach 1e-14 yet")

    print()
    print("="*80)
    print("CONCLUSIONS")
    print("="*80)
    print()

    # Speed comparison at 1e-10
    if mp_1e10 and ss_1e10:
        speedup = (mp_1e10['time'] * 1e6) / ss_1e10['time_us']
        if speedup > 1.5:
            print(f"1. For 1e-10 accuracy: My sinh-sinh is {speedup:.0f}× FASTER than mpmath auto")
        elif speedup < 0.67:
            print(f"1. For 1e-10 accuracy: mpmath auto is {1/speedup:.0f}× FASTER than my sinh-sinh")
        else:
            print(f"1. For 1e-10 accuracy: Similar speed (speedup={speedup:.1f}×)")

    # Best accuracy
    best_gh = float(gh_results[-1]['error'])
    best_ss = float(ss_results[-1]['error'])

    print()
    print(f"2. Best achievable accuracy:")
    print(f"   My Gauss-Hermite: {best_gh:.2e} (method-limited by width mismatch)")
    print(f"   My Sinh-sinh:     {best_ss:.2e} (machine precision!)")

    print()
    print(f"3. Implementation quality:")
    if best_ss < 1e-15:
        print(f"   ✓ My sinh-sinh reaches machine precision - implementation is CORRECT")
    if abs(ss_1e10['time_us'] - mp_1e10['time']*1e6) < mp_1e10['time']*1e6:
        print(f"   ✓ My sinh-sinh is competitive with mpmath's auto algorithm")


if __name__ == "__main__":
    main()
