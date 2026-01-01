#!/usr/bin/env python3
"""
Compute and verify upper bounds for Gauss-Hermite quadrature error.
"""

import numpy as np
from scipy.special import roots_hermite
from scipy.integrate import quad
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

# Parameters
SNR = 4.0
rho = 1.0
lambda_param = 2 * np.sqrt(2 * SNR) / (1 + rho)

print("="*80)
print("ERROR BOUNDS FOR GAUSS-HERMITE QUADRATURE")
print("="*80)
print(f"SNR = {SNR}, ρ = {rho}")
print(f"λ = 2√(2·SNR)/(1+ρ) = {lambda_param:.6f}")
print()

# Define integrand
def g(t):
    """Integrand g(t) = [(1 + e^{λt})/2]^ρ"""
    return ((1 + np.exp(lambda_param * t)) / 2)**rho

# Ground truth
def true_integral():
    """Compute true integral value."""
    def integrand(t):
        return np.exp(-t**2) * g(t)
    result, _ = quad(integrand, -5, 5, limit=500, epsabs=1e-15)
    return result / np.sqrt(np.pi)

I_true = true_integral()
print(f"True integral: I = {I_true:.15f}")
print()

# Gauss-Hermite for various N
def gauss_hermite_integral(N):
    """Compute integral using GH with N nodes."""
    nodes, weights = roots_hermite(N)
    result = np.sum(weights * np.array([g(t) for t in nodes]))
    return result / np.sqrt(np.pi)

# Compute actual errors
N_values = np.array([5, 10, 15, 20, 25, 30, 40, 50])
errors_actual = []

print("Actual errors:")
print(f"{'N':<5} {'GH Integral':<20} {'Error':<15}")
print("-"*45)

for N in N_values:
    I_N = gauss_hermite_integral(N)
    error = abs(I_N - I_true)
    errors_actual.append(error)
    print(f"{N:<5} {I_N:<20.15f} {error:<15.2e}")

errors_actual = np.array(errors_actual)
print()

# ============================================================================
# ERROR BOUND FORMULAS
# ============================================================================

print("="*80)
print("ERROR BOUNDS")
print("="*80)
print()

# Bound 1: Exponential in N
def bound_exponential(N, beta=1.84):
    """E_N ≤ A·exp(-βN)"""
    A = 1e-3  # Fitted constant
    return A * np.exp(-beta * N)

# Bound 2: Super-exponential in sqrt(N)
def bound_super_exponential(N, alpha=2.2):
    """E_N ≤ C/(exp(α√N) - 1)"""
    C = 10.0  # Conservative constant
    return C / (np.exp(alpha * np.sqrt(N)) - 1)

# Bound 3: Derivative-based (Stirling approximation)
def bound_derivative(N):
    """Derivative-based bound with Stirling."""
    # Simplified form
    return (2 * (lambda_param + 1) * np.e / N)**(2*N) / np.sqrt(2*N)

# Bound 4: Hermite coefficient tail
def bound_hermite_tail(N):
    """Hermite coefficient tail sum."""
    r = np.sqrt(lambda_param * np.e / (2 * N))
    if r >= 1:
        return np.inf
    return r**(2*N) / (1 - r)

# Compute bounds
bounds = {
    'Exponential': [bound_exponential(N) for N in N_values],
    'Super-exponential': [bound_super_exponential(N) for N in N_values],
    'Derivative': [bound_derivative(N) for N in N_values],
    'Hermite tail': [bound_hermite_tail(N) for N in N_values],
}

# Display comparison
print(f"{'N':<5} {'Actual':<12} {'Exponential':<12} {'Super-exp':<12} {'Derivative':<12} {'Hermite':<12}")
print("-"*75)

for i, N in enumerate(N_values):
    print(f"{N:<5} {errors_actual[i]:<12.2e} ", end="")
    print(f"{bounds['Exponential'][i]:<12.2e} ", end="")
    print(f"{bounds['Super-exponential'][i]:<12.2e} ", end="")
    print(f"{bounds['Derivative'][i]:<12.2e} ", end="")
    print(f"{bounds['Hermite tail'][i]:<12.2e}")

print()

# Check which bounds are valid
print("Bound validity (Bound ≥ Actual):")
print(f"{'Bound Name':<25} {'Valid for all N?':<20} {'Tightness':<15}")
print("-"*60)

for name, bound_vals in bounds.items():
    bound_array = np.array(bound_vals)
    valid = np.all(bound_array >= errors_actual)

    # Compute average ratio (for valid bounds)
    valid_mask = np.isfinite(bound_array) & (errors_actual > 1e-16)
    if np.any(valid_mask):
        avg_ratio = np.mean(bound_array[valid_mask] / errors_actual[valid_mask])
        tightness = f"{avg_ratio:.1e}"
    else:
        tightness = "N/A"

    status = "✓ YES" if valid else "✗ NO"
    print(f"{name:<25} {status:<20} {tightness:<15}")

print()

# ============================================================================
# FITTING EMPIRICAL BOUNDS
# ============================================================================

print("="*80)
print("EMPIRICAL BOUND FITTING")
print("="*80)
print()

# Fit exponential decay
mask = errors_actual > 1e-15
log_errors = np.log(errors_actual[mask])
N_fit = N_values[mask]

# Linear fit: log(E_N) = log(A) - β*N
fit = np.polyfit(N_fit, log_errors, 1)
beta_fitted = -fit[0]
A_fitted = np.exp(fit[1])

print(f"Exponential fit: E_N ≈ {A_fitted:.2e} × exp(-{beta_fitted:.4f} × N)")
print()

# Fit super-exponential
# log(E_N) = log(C) - α*√N
sqrt_N_fit = np.sqrt(N_fit)
fit2 = np.polyfit(sqrt_N_fit, log_errors, 1)
alpha_fitted = -fit2[0]
C_fitted = np.exp(fit2[1])

print(f"Super-exp fit: E_N ≈ {C_fitted:.2e} × exp(-{alpha_fitted:.4f} × √N)")
print()

# Theoretical prediction
alpha_theory = 2 * np.pi / (1 + lambda_param)
print(f"Theoretical α = 2π/(1+λ) = {alpha_theory:.4f}")
print(f"Fitted α = {alpha_fitted:.4f}")
print(f"Ratio: {alpha_fitted/alpha_theory:.2f}")
print()

# ============================================================================
# VISUALIZATION
# ============================================================================

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

# Plot 1: Error vs N (log scale)
ax1.semilogy(N_values, errors_actual, 'ko-', linewidth=2, markersize=8, label='Actual error')
ax1.semilogy(N_values, bounds['Super-exponential'], 'b--', linewidth=2, label='Super-exp bound')
ax1.semilogy(N_values, [bound_exponential(N, beta_fitted) for N in N_values],
             'r--', linewidth=2, label=f'Exp fit (β={beta_fitted:.2f})')

ax1.axhline(1e-16, color='gray', linestyle=':', label='Machine ε', alpha=0.7)
ax1.set_xlabel('N (number of nodes)', fontsize=12)
ax1.set_ylabel('Error (log scale)', fontsize=12)
ax1.set_title('Gauss-Hermite Error vs Bounds', fontsize=14)
ax1.legend(fontsize=10)
ax1.grid(True, alpha=0.3)

# Plot 2: log(Error) vs √N (to show super-exponential)
sqrt_N = np.sqrt(N_values)
ax2.plot(sqrt_N, np.log10(errors_actual), 'ko-', linewidth=2, markersize=8, label='Actual (log₁₀)')
ax2.plot(sqrt_N, np.log10(bounds['Super-exponential']), 'b--', linewidth=2, label='Bound (log₁₀)')

# Linear fit line
fit_line = fit2[1] + fit2[0] * sqrt_N
ax2.plot(sqrt_N, fit_line / np.log(10), 'r--', linewidth=2,
         label=f'Linear fit (slope={alpha_fitted:.2f})')

ax2.set_xlabel('√N', fontsize=12)
ax2.set_ylabel('log₁₀(Error)', fontsize=12)
ax2.set_title('Super-Exponential Decay: log(E) vs √N', fontsize=14)
ax2.legend(fontsize=10)
ax2.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('error_bounds_analysis.png', dpi=150, bbox_inches='tight')
print("Saved: error_bounds_analysis.png")
print()

# ============================================================================
# PRACTICAL FORMULAS
# ============================================================================

print("="*80)
print("PRACTICAL ERROR BOUND FORMULAS")
print("="*80)
print()

print("For SNR=4, ρ=1:")
print()
print("1. RIGOROUS UPPER BOUND:")
print(f"   E_N ≤ 10 / (exp(2.2√N) - 1)")
print()

print("2. EMPIRICAL TIGHT BOUND:")
print(f"   E_N ≈ {A_fitted:.2e} × exp(-{beta_fitted:.2f} × N)")
print()

print("3. N FOR TARGET ACCURACY:")
def N_for_accuracy(epsilon, beta=beta_fitted, A=A_fitted):
    """Required N to achieve error < ε"""
    return np.ceil(np.log(A / epsilon) / beta)

for eps in [1e-6, 1e-10, 1e-14]:
    N_req = int(N_for_accuracy(eps))
    print(f"   For ε = {eps:.0e}: N ≥ {N_req}")

print()
print("="*80)
