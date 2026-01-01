#!/usr/bin/env python3
"""
Optimized E(R) computation - reduce number of E₀ calls.

Current: ~30 E₀ calls per E(R)
Target: <10 E₀ calls per E(R)
"""

import numpy as np
from scipy.special import roots_hermite
from scipy.optimize import minimize_scalar
import time

def compute_E0(rho, SNR, N=30):
    """E₀ computation (same as before)."""
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
# Strategy 1: Relax tolerance
# ==============================================================================

def compute_E_of_R_relaxed_tol(R, SNR, N=30):
    """With relaxed tolerance (1e-4 instead of 1e-6)."""
    eval_count = [0]

    def objective(rho):
        eval_count[0] += 1
        return -(compute_E0(rho, SNR, N) - rho * R)

    result = minimize_scalar(objective, bounds=(0, 1), method='bounded',
                            options={'xatol': 1e-4})  # Relaxed
    return -result.fun, result.x, eval_count[0]

# ==============================================================================
# Strategy 2: Check if ρ*=1 (boundary solution)
# ==============================================================================

def compute_E_of_R_smart(R, SNR, N=30):
    """
    Smart evaluation: Check if ρ*=1 first (common case).

    If E₀(1) - R > E₀(0), then ρ*=1 is optimal.
    This reduces to just 2 E₀ calls!
    """
    eval_count = [0]

    # Evaluate at boundaries
    E0_at_0 = compute_E0(0.0, SNR, N)
    eval_count[0] += 1

    E0_at_1 = compute_E0(1.0, SNR, N)
    eval_count[0] += 1

    # Check if ρ=1 is optimal
    if E0_at_1 - R >= E0_at_0:
        # ρ*=1 is optimal (boundary solution)
        return E0_at_1 - R, 1.0, eval_count[0]

    # Check if ρ=0 is optimal
    if E0_at_0 >= E0_at_1 - R:
        # ρ*=0 is optimal
        return E0_at_0, 0.0, eval_count[0]

    # Need to search interior
    def objective(rho):
        eval_count[0] += 1
        return -(compute_E0(rho, SNR, N) - rho * R)

    result = minimize_scalar(objective, bounds=(0, 1), method='bounded',
                            options={'xatol': 1e-4})
    return -result.fun, result.x, eval_count[0]

# ==============================================================================
# Strategy 3: Cache E₀(1) if always optimal
# ==============================================================================

class CachedE0Computer:
    """Cache E₀(1) since it's often optimal."""

    def __init__(self, SNR, N=30):
        self.SNR = SNR
        self.N = N
        self.E0_cache = {}
        self.eval_count = 0

    def compute_E0_cached(self, rho):
        """Compute E₀ with caching."""
        # Round to avoid floating point issues
        rho_key = round(rho, 6)

        if rho_key not in self.E0_cache:
            self.E0_cache[rho_key] = compute_E0(rho, self.SNR, self.N)
            self.eval_count += 1

        return self.E0_cache[rho_key]

    def compute_E_of_R(self, R):
        """Compute E(R) with caching."""
        evals_before = self.eval_count

        # Check if ρ=1 is optimal
        E0_1 = self.compute_E0_cached(1.0)

        if R <= 0:
            # For R=0, always ρ*=1
            return E0_1, 1.0, self.eval_count - evals_before

        # Check ρ=0
        E0_0 = self.compute_E0_cached(0.0)

        # If E₀(1) - R >= E₀(0), then ρ*=1
        if E0_1 - R >= E0_0:
            return E0_1 - R, 1.0, self.eval_count - evals_before

        # Need full optimization
        def objective(rho):
            return -self.compute_E0_cached(rho) + rho * R

        result = minimize_scalar(objective, bounds=(0, 1), method='bounded',
                                options={'xatol': 1e-4})

        return -result.fun, result.x, self.eval_count - evals_before

# ==============================================================================
# Compare strategies
# ==============================================================================

if __name__ == "__main__":
    print("="*80)
    print("E(R) OPTIMIZATION STRATEGIES COMPARISON")
    print("="*80)
    print()

    SNR = 4.0
    N = 30
    test_R_values = [0.0, 0.2, 0.5, 0.8]

    # Strategy 0: Original (strict tolerance)
    print("STRATEGY 0: Original (xatol=1e-6)")
    print("-"*80)
    total_evals_0 = 0
    for R in test_R_values:
        eval_count = [0]

        def objective(rho):
            eval_count[0] += 1
            return -(compute_E0(rho, SNR, N) - rho * R)

        result = minimize_scalar(objective, bounds=(0, 1), method='bounded',
                                options={'xatol': 1e-6})
        E_R = -result.fun
        rho_opt = result.x
        n_evals = eval_count[0]
        total_evals_0 += n_evals

        print(f"R={R:.1f}: E(R)={E_R:.6f}, ρ*={rho_opt:.4f}, {n_evals} evals")

    print(f"Average: {total_evals_0/len(test_R_values):.1f} evals/point")
    print()

    # Strategy 1: Relaxed tolerance
    print("STRATEGY 1: Relaxed tolerance (xatol=1e-4)")
    print("-"*80)
    total_evals_1 = 0
    for R in test_R_values:
        E_R, rho_opt, n_evals = compute_E_of_R_relaxed_tol(R, SNR, N)
        total_evals_1 += n_evals
        print(f"R={R:.1f}: E(R)={E_R:.6f}, ρ*={rho_opt:.4f}, {n_evals} evals")

    print(f"Average: {total_evals_1/len(test_R_values):.1f} evals/point")
    print(f"Reduction: {(1 - total_evals_1/total_evals_0)*100:.1f}%")
    print()

    # Strategy 2: Smart boundary check
    print("STRATEGY 2: Smart boundary check")
    print("-"*80)
    total_evals_2 = 0
    for R in test_R_values:
        E_R, rho_opt, n_evals = compute_E_of_R_smart(R, SNR, N)
        total_evals_2 += n_evals
        print(f"R={R:.1f}: E(R)={E_R:.6f}, ρ*={rho_opt:.4f}, {n_evals} evals")

    print(f"Average: {total_evals_2/len(test_R_values):.1f} evals/point")
    print(f"Reduction: {(1 - total_evals_2/total_evals_0)*100:.1f}%")
    print()

    # Strategy 3: Caching
    print("STRATEGY 3: Caching")
    print("-"*80)
    computer = CachedE0Computer(SNR, N)
    total_evals_3 = 0
    for R in test_R_values:
        E_R, rho_opt, n_evals = computer.compute_E_of_R(R)
        total_evals_3 += n_evals
        print(f"R={R:.1f}: E(R)={E_R:.6f}, ρ*={rho_opt:.4f}, {n_evals} evals")

    print(f"Average: {total_evals_3/len(test_R_values):.1f} evals/point")
    print(f"Reduction: {(1 - total_evals_3/total_evals_0)*100:.1f}%")
    print(f"Total unique E₀ evals: {len(computer.E0_cache)}")
    print()

    # Full curve with best strategy
    print("="*80)
    print("FULL CURVE WITH OPTIMIZED STRATEGY (20 points)")
    print("="*80)
    print()

    R_values = np.linspace(0, 0.9, 20)
    computer = CachedE0Computer(SNR, N)

    start_time = time.perf_counter()
    results = []
    for R in R_values:
        E_R, rho_opt, n_evals = computer.compute_E_of_R(R)
        results.append((R, E_R, rho_opt, n_evals))

    total_time = time.perf_counter() - start_time

    print(f"Total time: {total_time*1e3:.1f} ms")
    print(f"Total E₀ evaluations: {computer.eval_count}")
    print(f"Average per point: {computer.eval_count/len(R_values):.1f} evals")
    print(f"Time per point: {total_time/len(R_values)*1e3:.2f} ms")
    print()

    # Show first few
    print("Sample results:")
    for i in [0, 5, 10, 15, 19]:
        R, E_R, rho, n = results[i]
        print(f"  R={R:.3f}: E(R)={E_R:.6f}, ρ*={rho:.4f}, {n} evals")

    print()
    print("="*80)
    print("SUMMARY")
    print("="*80)
    print()
    print(f"Original method:  ~30 evals/point, ~5.7 ms/point")
    print(f"Optimized method: ~{computer.eval_count/len(R_values):.1f} evals/point, "
          f"~{total_time/len(R_values)*1e3:.2f} ms/point")
    print()
    print(f"Speedup: {(30*20)/(computer.eval_count):.1f}× fewer E₀ calls")
    print(f"Time reduction: {(1 - total_time/0.114)*100:.1f}%")
