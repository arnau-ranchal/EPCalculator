#!/usr/bin/env python3
"""
Algorithm to compute E(R) = max_{ρ∈[0,1]} {E₀(ρ) - ρR}

For each rate R, we optimize over ρ to find the maximum error exponent.
"""

import numpy as np
from scipy.special import roots_hermite
from scipy.optimize import minimize_scalar, brentq
import time
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt

# ==============================================================================
# E₀ computation (optimized)
# ==============================================================================

def compute_E0(rho, SNR, N=30):
    """
    Compute E₀(ρ) for 2-PAM AWGN channel.

    Uses Gauss-Hermite quadrature with N nodes.
    """
    # Factor-of-2 correction for standard AWGN
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
# E(R) computation via optimization
# ==============================================================================

def compute_E_of_R(R, SNR, N=30, verbose=False):
    """
    Compute E(R) = max_{ρ∈[0,1]} {E₀(ρ) - ρR}

    Parameters:
    -----------
    R : float
        Rate in bits per channel use
    SNR : float
        Signal-to-noise ratio (linear)
    N : int
        Gauss-Hermite nodes
    verbose : bool
        Print optimization details

    Returns:
    --------
    E_R : float
        Error exponent at rate R
    rho_opt : float
        Optimal ρ value
    n_evals : int
        Number of E₀ evaluations
    """
    # Counter for function evaluations
    eval_count = [0]

    def objective(rho):
        """Negative of E₀(ρ) - ρR for minimization."""
        eval_count[0] += 1
        E0 = compute_E0(rho, SNR, N)
        return -(E0 - rho * R)

    # Use Brent's method (bounded optimization)
    result = minimize_scalar(
        objective,
        bounds=(0, 1),
        method='bounded',
        options={'xatol': 1e-6}  # Tolerance on ρ
    )

    rho_opt = result.x
    E_R = -result.fun  # Convert back from negative
    n_evals = eval_count[0]

    if verbose:
        print(f"  R={R:.3f}: E(R)={E_R:.6f}, ρ*={rho_opt:.6f}, {n_evals} evals")

    return E_R, rho_opt, n_evals

# ==============================================================================
# Compute E(R) curve
# ==============================================================================

def compute_E_R_curve(SNR, R_min=0.0, R_max=0.9, n_points=20, N=30):
    """
    Compute E(R) for multiple rate values.

    Parameters:
    -----------
    SNR : float
        Signal-to-noise ratio
    R_min, R_max : float
        Range of rates to evaluate
    n_points : int
        Number of points
    N : int
        Gauss-Hermite nodes

    Returns:
    --------
    results : list of tuples
        [(R, E_R, rho_opt, time), ...]
    """
    R_values = np.linspace(R_min, R_max, n_points)
    results = []

    print(f"Computing E(R) curve for SNR={SNR}")
    print(f"R range: [{R_min}, {R_max}], {n_points} points")
    print()

    total_time_start = time.perf_counter()
    total_evals = 0

    for i, R in enumerate(R_values):
        start = time.perf_counter()
        E_R, rho_opt, n_evals = compute_E_of_R(R, SNR, N)
        elapsed = time.perf_counter() - start

        total_evals += n_evals
        results.append((R, E_R, rho_opt, elapsed))

        print(f"[{i+1:2d}/{n_points}] R={R:.4f}: E(R)={E_R:.8f}, ρ*={rho_opt:.6f}, "
              f"time={elapsed*1e3:.1f}ms, {n_evals} evals")

    total_time = time.perf_counter() - total_time_start

    print()
    print(f"Total time: {total_time:.3f} s")
    print(f"Average time per point: {total_time/n_points*1e3:.1f} ms")
    print(f"Total E₀ evaluations: {total_evals}")
    print(f"Average evals per point: {total_evals/n_points:.1f}")

    return results

# ==============================================================================
# Find critical rate R_crit where E(R_crit) = 0
# ==============================================================================

def find_critical_rate(SNR, N=30, R_max=1.0):
    """
    Find R_crit such that E(R_crit) = 0.

    This is the maximum achievable rate with exponentially decreasing error.
    """
    def E_of_R_func(R):
        E_R, _, _ = compute_E_of_R(R, SNR, N, verbose=False)
        return E_R

    # Check if E(R_max) > 0 (R_crit might be beyond R_max)
    E_max = E_of_R_func(R_max)
    if E_max > 1e-6:
        print(f"Warning: E({R_max}) = {E_max:.6f} > 0")
        print(f"R_crit may be > {R_max}")
        return R_max, E_max

    # Use bisection to find R_crit
    try:
        R_crit = brentq(E_of_R_func, 0, R_max, xtol=1e-6)
        return R_crit, 0.0
    except ValueError as e:
        print(f"Could not find R_crit: {e}")
        return None, None

# ==============================================================================
# Main execution for SNR = 4
# ==============================================================================

if __name__ == "__main__":
    print("="*80)
    print("E(R) COMPUTATION ALGORITHM")
    print("="*80)
    print()

    # Parameters
    SNR = 4.0
    N = 30  # Gauss-Hermite nodes (sufficient for machine precision)

    print("ALGORITHM:")
    print("  1. For each rate R:")
    print("     2. Optimize: max_{ρ∈[0,1]} {E₀(ρ) - ρR}")
    print("     3. Use Brent's method (golden section + parabolic)")
    print("  4. E₀(ρ) computed via Gauss-Hermite quadrature (N=30)")
    print()

    print("PARAMETERS:")
    print(f"  SNR = {SNR} (linear) = {10*np.log10(SNR):.2f} dB")
    print(f"  Constellation: 2-PAM")
    print(f"  Gauss-Hermite nodes: N = {N}")
    print()

    # First, compute E₀(ρ) for ρ=1 as reference
    print("Reference computation:")
    start = time.perf_counter()
    E0_rho1 = compute_E0(1.0, SNR, N)
    t_E0 = time.perf_counter() - start
    print(f"  E₀(ρ=1) = {E0_rho1:.10f}")
    print(f"  Time: {t_E0*1e6:.1f} μs")
    print()

    # Compute E(R) curve
    print("="*80)
    print("COMPUTING E(R) CURVE")
    print("="*80)
    print()

    results = compute_E_R_curve(SNR, R_min=0.0, R_max=0.9, n_points=20, N=N)

    # Extract data
    R_vals = [r[0] for r in results]
    E_vals = [r[1] for r in results]
    rho_vals = [r[2] for r in results]

    # Find critical rate
    print()
    print("="*80)
    print("CRITICAL RATE (where E(R) = 0)")
    print("="*80)
    print()

    R_crit, E_crit = find_critical_rate(SNR, N, R_max=1.5)
    if R_crit is not None:
        print(f"R_crit = {R_crit:.6f} bits/channel use")
        print(f"E(R_crit) = {E_crit:.10f}")
    print()

    # Summary table
    print("="*80)
    print("SUMMARY TABLE")
    print("="*80)
    print()
    print(f"{'R (bits)':<12} {'E(R)':<15} {'ρ*':<12} {'Time (ms)':<12}")
    print("-"*55)
    for R, E_R, rho, t in results:
        print(f"{R:<12.4f} {E_R:<15.10f} {rho:<12.6f} {t*1e3:<12.1f}")

    # Key observations
    print()
    print("="*80)
    print("KEY RESULTS FOR SNR=4")
    print("="*80)
    print()
    print(f"E(R=0.0) = {results[0][1]:.10f}  (ρ* = {results[0][2]:.6f})")
    print(f"E(R=0.5) = {results[10][1]:.10f}  (ρ* = {results[10][2]:.6f})")
    print(f"E(R=0.9) = {results[-1][1]:.10f}  (ρ* = {results[-1][2]:.6f})")
    if R_crit is not None:
        print(f"R_crit ≈ {R_crit:.6f}")
    print()

    # Computational efficiency
    avg_time = np.mean([r[3] for r in results])
    print("COMPUTATIONAL EFFICIENCY:")
    print(f"  Average time per E(R): {avg_time*1e3:.1f} ms")
    print(f"  Single E₀ evaluation: {t_E0*1e3:.3f} ms")
    print(f"  Optimization overhead: ~{len(results[0])} E₀ calls per R")
    print()

    # Plot E(R) curve
    print("Generating plot...")
    plt.figure(figsize=(10, 6))
    plt.plot(R_vals, E_vals, 'b-', linewidth=2, label='E(R)')
    plt.plot(R_vals, E_vals, 'ro', markersize=4)
    plt.xlabel('Rate R (bits/channel use)', fontsize=12)
    plt.ylabel('Error Exponent E(R) (bits)', fontsize=12)
    plt.title(f'Error Exponent E(R) for 2-PAM, SNR={SNR} ({10*np.log10(SNR):.2f} dB)',
              fontsize=14)
    plt.grid(True, alpha=0.3)
    plt.legend(fontsize=11)

    # Add R_crit marker if found
    if R_crit is not None and R_crit <= max(R_vals):
        plt.axvline(R_crit, color='r', linestyle='--', alpha=0.5,
                   label=f'R_crit = {R_crit:.3f}')
        plt.legend(fontsize=11)

    plt.tight_layout()
    plt.savefig('E_of_R_curve.png', dpi=150, bbox_inches='tight')
    print("Saved plot to: E_of_R_curve.png")
    print()

    # Also plot ρ*(R)
    plt.figure(figsize=(10, 6))
    plt.plot(R_vals, rho_vals, 'g-', linewidth=2)
    plt.plot(R_vals, rho_vals, 'go', markersize=4)
    plt.xlabel('Rate R (bits/channel use)', fontsize=12)
    plt.ylabel('Optimal ρ*(R)', fontsize=12)
    plt.title(f'Optimal Gallager Parameter ρ*(R) for 2-PAM, SNR={SNR}', fontsize=14)
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig('rho_opt_vs_R.png', dpi=150, bbox_inches='tight')
    print("Saved plot to: rho_opt_vs_R.png")
    print()
