#!/usr/bin/env python3
"""
Benchmark E(R) computation with:
- Tolerance: 1e-6 (0.000001)
- N = 20 (Gauss-Hermite nodes)
- No smart boundary check (commented out)
"""

import numpy as np
from scipy.special import roots_hermite
from scipy.optimize import minimize_scalar
import time

# ==============================================================================
# E₀ computation
# ==============================================================================

def compute_E0(rho, SNR, N=20):
    """
    Compute E₀(ρ) for 2-PAM AWGN channel.
    """
    SNR_eff = 2.0 * SNR
    sigma_sq = 1.0 / SNR_eff

    nodes, weights = roots_hermite(N)

    I_total = 0.0
    for x in [-1, +1]:
        I_x = 0.0
        for t, w in zip(nodes, weights):
            z = np.sqrt(2 * sigma_sq) * t

            inner = 0.0
            for x_bar in [-1, +1]:
                delta = -(z + x - x_bar)**2 + z**2
                inner += 0.5 * np.exp(delta / (2 * sigma_sq * (1 + rho)))

            I_x += w * inner**rho

        I_total += 0.5 * I_x

    I_total /= np.sqrt(np.pi)
    return -np.log2(I_total)

# ==============================================================================
# E(R) computation WITHOUT smart boundary check
# ==============================================================================

def compute_E_of_R(R, SNR, N=20, tol=1e-6):
    """
    Compute E(R) = max_{ρ∈[0,1]} {E₀(ρ) - ρR}

    WITHOUT smart boundary check optimization.
    """
    eval_count = [0]

    def objective(rho):
        """Negative of E₀(ρ) - ρR for minimization."""
        eval_count[0] += 1
        E0 = compute_E0(rho, SNR, N)
        return -(E0 - rho * R)

    # Standard Brent's method optimization
    result = minimize_scalar(
        objective,
        bounds=(0, 1),
        method='bounded',
        options={'xatol': tol}
    )

    rho_opt = result.x
    E_R = -result.fun
    n_evals = eval_count[0]

    return E_R, rho_opt, n_evals

# ==============================================================================
# Version WITH smart check (for comparison)
# ==============================================================================

def compute_E_of_R_smart(R, SNR, N=20, tol=1e-6):
    """
    WITH smart boundary check (original optimization).
    """
    eval_count = [0]

    # Evaluate at boundaries
    E0_at_0 = compute_E0(0.0, SNR, N)
    eval_count[0] += 1

    E0_at_1 = compute_E0(1.0, SNR, N)
    eval_count[0] += 1

    # SMART CHECK (enabled for comparison)
    if E0_at_1 - R >= E0_at_0:
        return E0_at_1 - R, 1.0, eval_count[0]

    if E0_at_0 >= E0_at_1 - R:
        return E0_at_0, 0.0, eval_count[0]

    # Need to search interior
    def objective(rho):
        eval_count[0] += 1
        return -(compute_E0(rho, SNR, N) - rho * R)

    result = minimize_scalar(objective, bounds=(0, 1), method='bounded',
                            options={'xatol': tol})
    return -result.fun, result.x, eval_count[0]

# ==============================================================================
# Benchmark
# ==============================================================================

if __name__ == "__main__":
    print("="*80)
    print("E(R) BENCHMARK: N=20, tol=1e-6, NO smart boundary check")
    print("="*80)
    print()

    SNR = 4.0
    N = 20
    tol = 1e-6

    print("PARAMETERS:")
    print(f"  SNR = {SNR} (linear) = {10*np.log10(SNR):.2f} dB")
    print(f"  N (Gauss-Hermite nodes) = {N}")
    print(f"  Tolerance (xatol) = {tol}")
    print(f"  Smart boundary check: DISABLED")
    print()

    # First, time single E₀ evaluation
    print("Single E₀ evaluation timing:")
    times_E0 = []
    for _ in range(10):
        start = time.perf_counter()
        E0 = compute_E0(1.0, SNR, N)
        elapsed = time.perf_counter() - start
        times_E0.append(elapsed)

    avg_E0_time = np.mean(times_E0)
    print(f"  E₀(ρ=1): {E0:.10f}")
    print(f"  Average time: {avg_E0_time*1e6:.2f} μs")
    print()

    # Compute E(R) curve WITHOUT smart check
    print("="*80)
    print("COMPUTING E(R) CURVE - WITHOUT SMART CHECK")
    print("="*80)
    print()

    R_values = np.linspace(0, 0.9, 20)

    start_total = time.perf_counter()
    results_no_smart = []
    total_evals = 0

    for i, R in enumerate(R_values):
        start = time.perf_counter()
        E_R, rho_opt, n_evals = compute_E_of_R(R, SNR, N, tol)
        elapsed = time.perf_counter() - start

        results_no_smart.append((R, E_R, rho_opt, n_evals, elapsed))
        total_evals += n_evals

        if i < 5 or i >= 15:  # Show first 5 and last 5
            print(f"[{i+1:2d}/20] R={R:.4f}: E(R)={E_R:.8f}, ρ*={rho_opt:.6f}, "
                  f"{n_evals:2d} evals, {elapsed*1e3:.2f} ms")
        elif i == 5:
            print("  ...")

    total_time_no_smart = time.perf_counter() - start_total
    avg_evals = total_evals / len(R_values)
    avg_time = total_time_no_smart / len(R_values)

    print()
    print(f"Total time: {total_time_no_smart*1e3:.2f} ms")
    print(f"Average per point: {avg_time*1e3:.2f} ms")
    print(f"Total E₀ evaluations: {total_evals}")
    print(f"Average evals per point: {avg_evals:.1f}")
    print()

    # Compare WITH smart check
    print("="*80)
    print("COMPUTING E(R) CURVE - WITH SMART CHECK (for comparison)")
    print("="*80)
    print()

    start_total = time.perf_counter()
    results_smart = []
    total_evals_smart = 0

    for i, R in enumerate(R_values):
        start = time.perf_counter()
        E_R, rho_opt, n_evals = compute_E_of_R_smart(R, SNR, N, tol)
        elapsed = time.perf_counter() - start

        results_smart.append((R, E_R, rho_opt, n_evals, elapsed))
        total_evals_smart += n_evals

        if i < 5 or i >= 15:
            print(f"[{i+1:2d}/20] R={R:.4f}: E(R)={E_R:.8f}, ρ*={rho_opt:.6f}, "
                  f"{n_evals:2d} evals, {elapsed*1e3:.2f} ms")
        elif i == 5:
            print("  ...")

    total_time_smart = time.perf_counter() - start_total
    avg_evals_smart = total_evals_smart / len(R_values)
    avg_time_smart = total_time_smart / len(R_values)

    print()
    print(f"Total time: {total_time_smart*1e3:.2f} ms")
    print(f"Average per point: {avg_time_smart*1e3:.2f} ms")
    print(f"Total E₀ evaluations: {total_evals_smart}")
    print(f"Average evals per point: {avg_evals_smart:.1f}")
    print()

    # Summary comparison
    print("="*80)
    print("SUMMARY COMPARISON")
    print("="*80)
    print()

    print(f"{'Method':<30} {'Total Time':<15} {'Avg Time/pt':<15} {'Total Evals':<15} {'Avg Evals/pt':<15}")
    print("-"*90)
    print(f"{'Without smart check':<30} {total_time_no_smart*1e3:<14.2f}ms {avg_time*1e3:<14.2f}ms "
          f"{total_evals:<15} {avg_evals:<15.1f}")
    print(f"{'With smart check':<30} {total_time_smart*1e3:<14.2f}ms {avg_time_smart*1e3:<14.2f}ms "
          f"{total_evals_smart:<15} {avg_evals_smart:<15.1f}")
    print()

    speedup_time = total_time_no_smart / total_time_smart
    speedup_evals = total_evals / total_evals_smart

    print(f"Speedup (time): {speedup_time:.1f}×")
    print(f"Speedup (evals): {speedup_evals:.1f}×")
    print()

    # Detailed breakdown
    print("="*80)
    print("DETAILED BREAKDOWN (N=20, no smart check)")
    print("="*80)
    print()

    print(f"Single E₀ evaluation: {avg_E0_time*1e6:.2f} μs")
    print(f"Expected time for {avg_evals:.1f} evals: {avg_evals * avg_E0_time*1e3:.2f} ms")
    print(f"Actual time per E(R): {avg_time*1e3:.2f} ms")
    print(f"Optimization overhead: {(avg_time - avg_evals*avg_E0_time)*1e3:.2f} ms")
    print()

    # Sample results table
    print("Sample E(R) values:")
    print(f"{'R':<10} {'E(R)':<15} {'ρ*':<10} {'Evals':<10}")
    print("-"*50)
    for i in [0, 5, 10, 15, 19]:
        R, E_R, rho, n_evals, t = results_no_smart[i]
        print(f"{R:<10.4f} {E_R:<15.10f} {rho:<10.6f} {n_evals:<10}")
