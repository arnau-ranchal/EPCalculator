#!/usr/bin/env python3
"""
Find optimal 2-node placement with robust numerics.
"""

import numpy as np
from scipy.special import roots_hermite
from scipy.optimize import minimize
from scipy.integrate import quad

# Parameters
SNR = 4.0
rho = 1.0
lambda_param = 2 * np.sqrt(2 * SNR) / (1 + rho)

print("="*80)
print("OPTIMAL 2-NODE PLACEMENT FOR E₀ INTEGRAL")
print("="*80)
print(f"SNR = {SNR}, ρ = {rho}")
print(f"λ = {lambda_param:.6f}")
print()

# Define integrand with careful handling of exponentials
def g(t):
    """Integrand g(t) = [(1 + e^{λt})/2]^ρ"""
    x = lambda_param * t
    if x > 100:  # Avoid overflow
        # For large x: (1 + e^x)/2 ≈ e^x/2
        return np.exp(rho * (x - np.log(2)))
    elif x < -100:
        # For small x: (1 + e^x)/2 ≈ 1/2
        return 0.5**rho
    else:
        return ((1 + np.exp(x)) / 2)**rho

def weighted_integrand(t):
    """Full integrand including Gaussian weight."""
    if abs(t) > 6:  # Gaussian essentially zero
        return 0.0
    return np.exp(-t**2) * g(t)

# Ground truth using bounded integration
I_true, err = quad(weighted_integrand, -6, 6, limit=200)
I_true /= np.sqrt(np.pi)

print(f"True integral: I = {I_true:.15f}")
print(f"Integration error estimate: {err/np.sqrt(np.pi):.2e}")
print()

# ===========================================================================
# OPTION 1: Standard Gauss-Hermite nodes for N=2
# ===========================================================================

print("="*80)
print("OPTION 1: STANDARD GAUSS-HERMITE (N=2)")
print("="*80)
print()

nodes_gh, weights_gh = roots_hermite(2)

print("Gauss-Hermite nodes (zeros of H₂(t) = 4t² - 2):")
print(f"  t₁ = {nodes_gh[0]:.10f} = -1/√2")
print(f"  t₂ = {nodes_gh[1]:.10f} = +1/√2")
print()
print(f"  w₁ = {weights_gh[0]:.10f} = √π/2")
print(f"  w₂ = {weights_gh[1]:.10f} = √π/2")
print()

# Compute integral
I_gh = np.sum(weights_gh * np.array([g(t) for t in nodes_gh])) / np.sqrt(np.pi)
error_gh = abs(I_gh - I_true)

print(f"GH approximation: I ≈ {I_gh:.15f}")
print(f"Error: {error_gh:.10e}")
print(f"Relative error: {error_gh/I_true:.10e} = {100*error_gh/I_true:.6f}%")
print()

# ===========================================================================
# OPTION 2: Analyze distribution
# ===========================================================================

print("="*80)
print("OPTION 2: ANALYZE INTEGRAND DISTRIBUTION")
print("="*80)
print()

# Mean
def integrand_mean(t):
    return t * weighted_integrand(t)

mean_num, _ = quad(integrand_mean, -6, 6, limit=200)
mean = mean_num / (I_true * np.sqrt(np.pi))

# Variance
def integrand_var(t):
    return (t - mean)**2 * weighted_integrand(t)

var_num, _ = quad(integrand_var, -6, 6, limit=200)
variance = var_num / (I_true * np.sqrt(np.pi))
std = np.sqrt(variance)

print(f"Weighted integrand distribution:")
print(f"  Mean: μ = {mean:.6f}")
print(f"  Std dev: σ = {std:.6f}")
print()

print("For comparison, standard Gaussian e^(-t²):")
print(f"  Mean: 0.0")
print(f"  Std dev: {1/np.sqrt(2):.6f} = 1/√2")
print()

shift_ratio = mean / (1/np.sqrt(2))
spread_ratio = std / (1/np.sqrt(2))
print(f"Relative shift: {shift_ratio:.2f}× (mean/σ_gauss)")
print(f"Relative spread: {spread_ratio:.2f}× (σ/σ_gauss)")
print()

if abs(mean) > 0.05:
    print(f"⚠ Integrand is SKEWED by {mean:.3f} to the {'right' if mean > 0 else 'left'}!")
    print("  Standard GH nodes (symmetric) are suboptimal!")
else:
    print("✓ Integrand is approximately symmetric.")
print()

# ===========================================================================
# OPTION 3: Optimal 2-node placement
# ===========================================================================

print("="*80)
print("OPTION 3: OPTIMIZED 2-NODE PLACEMENT")
print("="*80)
print()

def quadrature_2node(t1, t2, w1):
    """Compute integral with 2 nodes. w2 = √π - w1"""
    w2 = np.sqrt(np.pi) - w1
    if w1 < 0 or w2 < 0:
        return 1e10  # Penalize negative weights
    return (w1 * g(t1) + w2 * g(t2)) / np.sqrt(np.pi)

def error_2node(params):
    """Squared error for 2-node quadrature."""
    t1, t2, w1 = params
    I_approx = quadrature_2node(t1, t2, w1)
    return (I_approx - I_true)**2

# Try multiple initial conditions
print("Optimizing node positions and weights...")
print()

best_result = None
best_error = np.inf

initial_guesses = [
    (nodes_gh[0], nodes_gh[1], weights_gh[0], "Standard GH"),
    (-1.0, 1.0, np.sqrt(np.pi)/2, "Symmetric ±1"),
    (mean - std, mean + std, np.sqrt(np.pi)/2, "Mean ± std"),
    (-0.5, 1.5, np.sqrt(np.pi)/2, "Asymmetric right"),
    (-1.5, 1.5, np.sqrt(np.pi)/2, "Wide ±1.5"),
]

for t1, t2, w1, name in initial_guesses:
    x0 = [t1, t2, w1]
    result = minimize(error_2node, x0, method='Nelder-Mead',
                     options={'maxiter': 5000, 'xatol': 1e-12})

    if result.fun < best_error:
        best_error = result.fun
        best_result = result
        best_name = name

print(f"Best initial guess: {best_name}")
print()

t1_opt, t2_opt, w1_opt = best_result.x
w2_opt = np.sqrt(np.pi) - w1_opt

print(f"Optimized nodes:")
print(f"  t₁ = {t1_opt:.10f}")
print(f"  t₂ = {t2_opt:.10f}")
print()
print(f"Optimized weights:")
print(f"  w₁ = {w1_opt:.10f}")
print(f"  w₂ = {w2_opt:.10f}")
print(f"  Sum: {w1_opt + w2_opt:.10f} (should be √π = {np.sqrt(np.pi):.10f})")
print()

I_opt = quadrature_2node(t1_opt, t2_opt, w1_opt)
error_opt = abs(I_opt - I_true)

print(f"Optimized approximation: I ≈ {I_opt:.15f}")
print(f"Error: {error_opt:.10e}")
print(f"Relative error: {error_opt/I_true:.10e} = {100*error_opt/I_true:.6f}%")
print()

# ===========================================================================
# COMPARISON
# ===========================================================================

print("="*80)
print("COMPARISON")
print("="*80)
print()

improvement = error_gh / error_opt if error_opt > 0 else np.inf

print(f"{'Method':<20} {'Node 1':>12} {'Node 2':>12} {'Weight 1':>12} {'Weight 2':>12} {'Error':>15} {'Rel.Err %':>12}")
print("-"*100)
print(f"{'Standard GH':<20} {nodes_gh[0]:>12.6f} {nodes_gh[1]:>12.6f} {weights_gh[0]:>12.6f} {weights_gh[1]:>12.6f} {error_gh:>15.2e} {100*error_gh/I_true:>12.6f}")
print(f"{'Optimized':<20} {t1_opt:>12.6f} {t2_opt:>12.6f} {w1_opt:>12.6f} {w2_opt:>12.6f} {error_opt:>15.2e} {100*error_opt/I_true:>12.6f}")
print()

if improvement > 1.5:
    print(f"✓ Optimized placement is {improvement:.2f}× better!")
elif improvement > 1.05:
    print(f"✓ Optimized placement is {(improvement-1)*100:.1f}% better")
else:
    print(f"≈ Standard GH is already near-optimal")
print()

# ===========================================================================
# SUMMARY
# ===========================================================================

print("="*80)
print("ANSWER")
print("="*80)
print()

print("For SNR=4, ρ=1:")
print()
print("1. STANDARD GAUSS-HERMITE (classical textbook answer):")
print(f"   t = ± 1/√2 = ± {1/np.sqrt(2):.6f}")
print(f"   w = √π/2 = {np.sqrt(np.pi)/2:.6f}")
print(f"   Error: {100*error_gh/I_true:.4f}%")
print()

print("2. OPTIMIZED FOR THIS INTEGRAND:")
print(f"   t₁ = {t1_opt:.6f}, t₂ = {t2_opt:.6f}")
print(f"   w₁ = {w1_opt:.6f}, w₂ = {w2_opt:.6f}")
print(f"   Error: {100*error_opt/I_true:.4f}%")
print(f"   Improvement: {improvement:.2f}×")
print()

print("3. PRACTICAL RECOMMENDATION:")
print("   Use N=10-20 with standard GH → ~10⁻⁶ to 10⁻¹⁴ error")
print("   Far better than optimizing 2 nodes!")
print()
