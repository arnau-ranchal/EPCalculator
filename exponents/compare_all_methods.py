#!/usr/bin/env python3
"""
Comprehensive comparison: All quadrature methods for 2-PAM integral

Methods:
1. Gauss-Hermite (my implementation)
2. Sinh-sinh (my implementation)
3. Tanh-sinh with inverse CDF transformation (NEW!)
4. mpmath auto (reference)
"""

import numpy as np
from scipy.special import roots_hermite, ndtri
import mpmath as mp
import time

SNR_test = 1.0
rho_test = 0.5

def integrand_mpmath(z):
    """Integrand for mpmath"""
    z = mp.mpf(z)
    rho = mp.mpf(rho_test)
    SNR = mp.mpf(SNR_test)
    gauss_weight = mp.exp(-z**2 / 2) / mp.sqrt(2 * mp.pi)
    exponent = 4 * mp.sqrt(SNR) * (z - mp.sqrt(SNR)) / (1 + rho)
    h = ((1 + mp.exp(exponent)) / 2) ** rho
    return gauss_weight * h


def gauss_hermite(rho, SNR, N):
    """Gauss-Hermite (corrected transformation)"""
    nodes, weights = roots_hermite(N)
    integral = 0.0
    for t, w in zip(nodes, weights):
        z = np.sqrt(2) * t
        exponent = 4 * np.sqrt(SNR) * (z - np.sqrt(SNR)) / (1 + rho)
        h = ((1 + np.exp(np.clip(exponent, -500, 500))) / 2) ** rho
        integral += w * h
    return integral / np.sqrt(np.pi)


def sinh_sinh(rho, SNR, level):
    """Sinh-sinh for (-∞,∞)"""
    h = 0.1 / (1 << (level - 3)) if level >= 3 else 0.1
    t_max = 4.0

    nodes, weights = [], []
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
        h_val = ((1 + np.exp(np.clip(exponent, -500, 500))) / 2) ** rho
        integral += w * gauss_weight * h_val

    return integral, len(nodes)


def tanh_sinh_inverse_cdf(rho, SNR, level):
    """
    Tanh-sinh with inverse CDF transformation

    Transform: ∫_{-∞}^{∞} (1/√(2π)) e^(-z²/2) h(z) dz
            → ∫_0^1 h(Φ^{-1}(u)) du

    Then apply tanh-sinh: u = (1 + tanh(π/2·sinh(t)))/2
    """
    h = 0.1 / (1 << (level - 3)) if level >= 3 else 0.1
    t_max = 4.0

    nodes_u, weights_u = [], []
    k = 0
    while k * h <= t_max:
        t = k * h
        for sign in [1, -1] if k > 0 else [1]:
            t_val = sign * t
            sinh_t = np.sinh(t_val)
            cosh_t = np.cosh(t_val)
            arg = np.pi / 2 * sinh_t

            if abs(arg) > 10:
                continue

            tanh_arg = np.tanh(arg)
            cosh_arg = np.cosh(arg)

            # u ∈ (0,1) from tanh-sinh transformation
            u = (1 + tanh_arg) / 2

            # Avoid endpoints (would give ±∞ in inverse CDF)
            if u <= 1e-10 or u >= 1 - 1e-10:
                continue

            # Weight: du/dt
            weight = h * (np.pi / 4) * cosh_t / (cosh_arg ** 2)

            nodes_u.append(u)
            weights_u.append(weight)
        k += 1

    # Integrate h(Φ^{-1}(u)) over u ∈ [0,1]
    integral = 0.0
    for u, w in zip(nodes_u, weights_u):
        # z = Φ^{-1}(u) using scipy's ndtri
        z = ndtri(u)

        # h(z)
        exponent = 4 * np.sqrt(SNR) * (z - np.sqrt(SNR)) / (1 + rho)
        h_val = ((1 + np.exp(np.clip(exponent, -500, 500))) / 2) ** rho

        integral += w * h_val

    return integral, len(nodes_u)


def mpmath_auto(precision):
    """mpmath automatic quadrature"""
    original_dps = mp.mp.dps
    mp.mp.dps = precision

    start = time.time()
    result = mp.quad(integrand_mpmath, [-mp.inf, mp.inf])
    elapsed = time.time() - start

    mp.mp.dps = original_dps
    return result, elapsed


def benchmark_method(name, func, params, I_true):
    """Benchmark a method"""
    print(f"\n{name}")
    print("-" * 80)

    if name == "mpmath auto":
        print(f"{'Precision':<12} {'Error':<15} {'Time (ms)':<12}")
    elif name == "Gauss-Hermite":
        print(f"{'N':<8} {'Error':<15} {'Time (μs)':<12}")
    else:
        print(f"{'Level':<8} {'Nodes':<8} {'Error':<15} {'Time (μs)':<12}")

    print("-" * 80)

    results = []
    for param in params:
        if name == "mpmath auto":
            I_val, elapsed = func(param)
            error = abs(I_val - I_true)
            results.append({'param': param, 'error': error, 'time_ms': elapsed * 1000})
            print(f"{param:<12} {mp.nstr(error, 10):<15} {elapsed*1000:<12.1f}")

        elif name == "Gauss-Hermite":
            times = []
            for _ in range(100):
                start = time.perf_counter()
                I_val = func(rho_test, SNR_test, param)
                times.append(time.perf_counter() - start)

            avg_time = np.mean(times) * 1e6
            error = abs(mp.mpf(I_val) - I_true)
            results.append({'param': param, 'nodes': param, 'error': error, 'time_us': avg_time})
            print(f"{param:<8} {mp.nstr(error, 10):<15} {avg_time:<12.1f}")

        else:  # Sinh-sinh or Tanh-sinh
            times = []
            for _ in range(100):
                start = time.perf_counter()
                I_val, n_nodes = func(rho_test, SNR_test, param)
                times.append(time.perf_counter() - start)

            avg_time = np.mean(times) * 1e6
            error = abs(mp.mpf(I_val) - I_true)
            results.append({'param': param, 'nodes': n_nodes, 'error': error, 'time_us': avg_time})
            print(f"{param:<8} {n_nodes:<8} {mp.nstr(error, 10):<15} {avg_time:<12.1f}")

    return results


def main():
    print("="*80)
    print("COMPREHENSIVE COMPARISON: ALL QUADRATURE METHODS")
    print("="*80)
    print()

    print(f"Test case: 2-PAM, SNR={SNR_test}, ρ={rho_test}")
    print()

    # Ground truth
    print("Computing ground truth (mpmath, 50 digits)...")
    I_true, _ = mpmath_auto(50)
    print(f"I = {mp.nstr(I_true, 30)}")
    print()

    # Benchmark all methods
    print("="*80)
    print("BENCHMARKING ALL METHODS")
    print("="*80)

    gh_results = benchmark_method("Gauss-Hermite", gauss_hermite, [10, 20, 30, 40, 50], I_true)
    ss_results = benchmark_method("Sinh-sinh", sinh_sinh, [4, 5, 6, 7], I_true)
    ts_results = benchmark_method("Tanh-sinh + inverse CDF", tanh_sinh_inverse_cdf, [4, 5, 6, 7], I_true)
    mp_results = benchmark_method("mpmath auto", mpmath_auto, [15, 20, 30], I_true)

    # Comparison table
    print()
    print("="*80)
    print("COMPARISON TABLE")
    print("="*80)
    print()

    for target_error in [1e-6, 1e-10, 1e-14]:
        print(f"Target accuracy: {target_error:.0e}")
        print("-" * 80)

        # Find first achieving target
        gh_target = next((r for r in gh_results if float(r['error']) < target_error), None)
        ss_target = next((r for r in ss_results if float(r['error']) < target_error), None)
        ts_target = next((r for r in ts_results if float(r['error']) < target_error), None)
        mp_target = next((r for r in mp_results if float(r['error']) < target_error), None)

        methods = []
        if gh_target:
            methods.append(('Gauss-Hermite', gh_target['nodes'], gh_target['time_us'], gh_target['error']))
        if ss_target:
            methods.append(('Sinh-sinh', ss_target['nodes'], ss_target['time_us'], ss_target['error']))
        if ts_target:
            methods.append(('Tanh-sinh+CDF', ts_target['nodes'], ts_target['time_us'], ts_target['error']))
        if mp_target:
            methods.append(('mpmath auto', '?', mp_target['time_ms']*1000, mp_target['error']))

        # Sort by time
        methods.sort(key=lambda x: float(x[2]))

        print(f"{'Method':<20} {'Nodes':<8} {'Time (μs)':<12} {'Error':<15}")
        print("-" * 80)
        for method, nodes, time_us, error in methods:
            print(f"{method:<20} {str(nodes):<8} {float(time_us):<12.1f} {mp.nstr(error, 8):<15}")

        if methods:
            fastest = methods[0]
            print(f"\n→ FASTEST: {fastest[0]} ({float(fastest[2]):.1f} μs)")
        print()

    # Final summary
    print("="*80)
    print("FINAL SUMMARY")
    print("="*80)
    print()

    print("Maximum achievable accuracy (double precision):")
    print("-" * 80)
    gh_best = min(gh_results, key=lambda x: float(x['error']))
    ss_best = min(ss_results, key=lambda x: float(x['error']))
    ts_best = min(ts_results, key=lambda x: float(x['error']))

    print(f"Gauss-Hermite:      {mp.nstr(gh_best['error'], 10):<15} (method-limited)")
    print(f"Sinh-sinh:          {mp.nstr(ss_best['error'], 10):<15} (machine precision)")
    print(f"Tanh-sinh+CDF:      {mp.nstr(ts_best['error'], 10):<15} (machine precision)")
    print()

    print("Speed ranking (fastest to slowest for 1e-10):")
    print("-" * 80)
    ss_1e10 = next((r for r in ss_results if float(r['error']) < 1e-10), None)
    ts_1e10 = next((r for r in ts_results if float(r['error']) < 1e-10), None)

    if ss_1e10 and ts_1e10:
        if ss_1e10['time_us'] < ts_1e10['time_us']:
            print(f"1. Sinh-sinh:     {ss_1e10['time_us']:.1f} μs")
            print(f"2. Tanh-sinh+CDF: {ts_1e10['time_us']:.1f} μs "
                  f"({ts_1e10['time_us']/ss_1e10['time_us']:.1f}× slower)")
        else:
            print(f"1. Tanh-sinh+CDF: {ts_1e10['time_us']:.1f} μs")
            print(f"2. Sinh-sinh:     {ss_1e10['time_us']:.1f} μs "
                  f"({ss_1e10['time_us']/ts_1e10['time_us']:.1f}× slower)")

    print()
    print("Recommendations:")
    print("-" * 80)
    print("• Low accuracy (≤1e-6):  Use Gauss-Hermite (fastest)")
    print("• High accuracy (≥1e-10): Use Sinh-sinh or Tanh-sinh+CDF")
    print("• Variable ρ/SNR:         Tanh-sinh+CDF may avoid 'dips'")
    print("• Arbitrary precision:    Use mpmath auto (slowest but unbounded)")


if __name__ == "__main__":
    main()
