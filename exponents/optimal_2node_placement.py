#!/usr/bin/env python3
"""
Find optimal placement for 2 nodes to approximate the E₀ integral.

Compares:
1. Standard Gauss-Hermite nodes (optimal for polynomials)
2. Adaptive nodes (optimal for our specific integrand)
"""

import numpy as np
from scipy.special import roots_hermite
from scipy.optimize import minimize
from scipy.integrate import quad
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

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

# Define integrand
def g(t):
    """Integrand g(t) = [(1 + e^{λt})/2]^ρ"""
    return ((1 + np.exp(lambda_param * t)) / 2)**rho

def weighted_integrand(t):
    """Full integrand including Gaussian weight."""
    return np.exp(-t**2) * g(t)

# Ground truth
I_true, _ = quad(weighted_integrand, -np.inf, np.inf)
I_true /= np.sqrt(np.pi)

print(f"True integral: I = {I_true:.15f}")
print()

# ===========================================================================
# OPTION 1: Standard Gauss-Hermite nodes for N=2
# ===========================================================================

print("="*80)
print("OPTION 1: STANDARD GAUSS-HERMITE (N=2)")
print("="*80)
print()

nodes_gh, weights_gh = roots_hermite(2)

print("Gauss-Hermite nodes are zeros of H₂(t) = 4t² - 2:")
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
print(f"Relative error: {error_gh/I_true:.10e}")
print()

# ===========================================================================
# OPTION 2: Analyze where the integrand is concentrated
# ===========================================================================

print("="*80)
print("OPTION 2: ANALYZE INTEGRAND DISTRIBUTION")
print("="*80)
print()

# Find the mean and variance of the weighted integrand
def compute_moments():
    """Compute mean and variance of the distribution."""
    # Mean
    def integrand_t(t):
        return t * weighted_integrand(t)

    mean, _ = quad(integrand_t, -np.inf, np.inf)
    mean /= I_true * np.sqrt(np.pi)

    # Variance
    def integrand_t2(t):
        return (t - mean)**2 * weighted_integrand(t)

    variance, _ = quad(integrand_t2, -np.inf, np.inf)
    variance /= I_true * np.sqrt(np.pi)

    return mean, np.sqrt(variance)

mean, std = compute_moments()

print(f"Weighted integrand distribution:")
print(f"  Mean: {mean:.6f}")
print(f"  Std dev: {std:.6f}")
print()

print("For comparison, standard Gaussian e^(-t²):")
print(f"  Mean: 0.0")
print(f"  Std dev: {1/np.sqrt(2):.6f} = 1/√2")
print()

# The shift shows the integrand is NOT symmetric!
if abs(mean) > 0.01:
    print(f"⚠ Integrand is SKEWED by {mean:.3f} to the {'right' if mean > 0 else 'left'}!")
    print("  Standard GH nodes may be suboptimal!")
else:
    print("✓ Integrand is approximately symmetric.")
print()

# ===========================================================================
# OPTION 3: Optimal 2-node placement via optimization
# ===========================================================================

print("="*80)
print("OPTION 3: OPTIMIZED 2-NODE PLACEMENT")
print("="*80)
print()

def quadrature_2node(params):
    """
    Compute integral with 2 nodes.

    params = [t1, t2, w1, w2] (4 parameters)
    But we have constraint: w1 + w2 = √π
    So use params = [t1, t2, w1], w2 = √π - w1
    """
    t1, t2, w1 = params
    w2 = np.sqrt(np.pi) - w1

    return (w1 * g(t1) + w2 * g(t2)) / np.sqrt(np.pi)

def error_2node(params):
    """Error for 2-node quadrature."""
    I_approx = quadrature_2node(params)
    return abs(I_approx - I_true)

# Optimize: minimize error
print("Optimizing node positions and weights...")

# Try multiple initial conditions
best_result = None
best_error = np.inf

initial_guesses = [
    [nodes_gh[0], nodes_gh[1], weights_gh[0]],  # Start from GH
    [-1.0, 1.0, np.sqrt(np.pi)/2],  # Symmetric
    [mean - std, mean + std, np.sqrt(np.pi)/2],  # Based on distribution
    [-0.5, 0.5, np.sqrt(np.pi)/2],  # Closer
    [-1.5, 1.5, np.sqrt(np.pi)/2],  # Wider
]

for i, x0 in enumerate(initial_guesses):
    result = minimize(error_2node, x0, method='Nelder-Mead',
                     options={'maxiter': 10000, 'xatol': 1e-10})

    if result.fun < best_error:
        best_error = result.fun
        best_result = result

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

I_opt = quadrature_2node([t1_opt, t2_opt, w1_opt])
error_opt = abs(I_opt - I_true)

print(f"Optimized approximation: I ≈ {I_opt:.15f}")
print(f"Error: {error_opt:.10e}")
print(f"Relative error: {error_opt/I_true:.10e}")
print()

# ===========================================================================
# COMPARISON
# ===========================================================================

print("="*80)
print("COMPARISON")
print("="*80)
print()

improvement = error_gh / error_opt if error_opt > 0 else np.inf

print(f"{'Method':<30} {'Node 1':<12} {'Node 2':<12} {'Error':<15} {'Rel. Error':<15}")
print("-"*85)
print(f"{'Standard GH':<30} {nodes_gh[0]:<12.6f} {nodes_gh[1]:<12.6f} {error_gh:<15.2e} {error_gh/I_true:<15.2e}")
print(f"{'Optimized':<30} {t1_opt:<12.6f} {t2_opt:<12.6f} {error_opt:<15.2e} {error_opt/I_true:<15.2e}")
print()

if improvement > 1.1:
    print(f"✓ Optimized placement is {improvement:.1f}× better!")
elif improvement > 1.01:
    print(f"✓ Optimized placement is {improvement:.2f}× better (small improvement)")
else:
    print(f"✗ Standard GH is already optimal (or very close)")
print()

# ===========================================================================
# VISUALIZE
# ===========================================================================

print("Generating visualization...")

fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 10))

# Plot 1: Integrand and node placement
t_vals = np.linspace(-3, 3, 500)
g_vals = [g(t) for t in t_vals]
weighted_vals = [weighted_integrand(t) / np.sqrt(np.pi) for t in t_vals]

ax1.plot(t_vals, weighted_vals, 'b-', linewidth=2, label='Weighted integrand')
ax1.axvline(0, color='gray', linestyle=':', alpha=0.5)

# Mark GH nodes
for i, t in enumerate(nodes_gh):
    ax1.axvline(t, color='green', linestyle='--', alpha=0.7, linewidth=1.5)
    ax1.plot(t, weighted_integrand(t) / np.sqrt(np.pi), 'go', markersize=10,
            label=f'GH node {i+1}' if i == 0 else '')

# Mark optimized nodes
for i, t in enumerate([t1_opt, t2_opt]):
    ax1.axvline(t, color='red', linestyle='--', alpha=0.7, linewidth=1.5)
    ax1.plot(t, weighted_integrand(t) / np.sqrt(np.pi), 'ro', markersize=10,
            label=f'Opt node {i+1}' if i == 0 else '')

# Mark mean
ax1.axvline(mean, color='purple', linestyle=':', linewidth=2, label=f'Mean = {mean:.3f}')

ax1.set_xlabel('t', fontsize=12)
ax1.set_ylabel('Weighted integrand', fontsize=12)
ax1.set_title(f'2-Node Placement (SNR={SNR}, ρ={rho})', fontsize=14)
ax1.legend(fontsize=10)
ax1.grid(True, alpha=0.3)

# Plot 2: Error analysis
ax2.semilogy(t_vals, np.abs([g(t) - I_gh*np.sqrt(np.pi)/np.sum(weights_gh) for t in t_vals]),
            'g--', linewidth=2, label='GH approximation error', alpha=0.7)

ax2.set_xlabel('t', fontsize=12)
ax2.set_ylabel('Local error (log scale)', fontsize=12)
ax2.set_title('Approximation Quality', fontsize=14)
ax2.legend(fontsize=10)
ax2.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('optimal_2node_placement.png', dpi=150, bbox_inches='tight')
print("Saved: optimal_2node_placement.png")
print()

# ===========================================================================
# THEORETICAL INSIGHT
# ===========================================================================

print("="*80)
print("THEORETICAL INSIGHT")
print("="*80)
print()

print("Why standard GH might be suboptimal:")
print()
print("1. GH nodes at ±1/√2 are optimal for POLYNOMIAL integrands")
print("   with Gaussian weight e^(-t²)")
print()
print("2. Our integrand g(t) = [(1+e^(λt))/2]^ρ is NOT a polynomial!")
print(f"   - It contains exponential e^({lambda_param:.2f}·t)")
print("   - This makes it ASYMMETRIC (skewed to the right)")
print()
print("3. The weighted integrand has:")
print(f"   - Mean = {mean:.6f} (shifted from 0)")
print(f"   - Std = {std:.6f} (vs 1/√2 = 0.707 for Gaussian)")
print()
print("4. Optimal nodes should account for this asymmetry!")
print()

if abs(t1_opt - nodes_gh[0]) > 0.05 or abs(t2_opt - nodes_gh[1]) > 0.05:
    print("✓ Optimization confirms: shifted nodes are better!")
else:
    print("✗ GH nodes are already near-optimal (integrand nearly symmetric)")

print()
print("="*80)
print("RECOMMENDATION")
print("="*80)
print()

if improvement > 2:
    print(f"Use OPTIMIZED nodes: t = [{t1_opt:.6f}, {t2_opt:.6f}]")
    print(f"  → {improvement:.1f}× better than standard GH")
elif improvement > 1.1:
    print(f"Use OPTIMIZED nodes: t = [{t1_opt:.6f}, {t2_opt:.6f}]")
    print(f"  → {(improvement-1)*100:.1f}% improvement over GH")
else:
    print(f"Use STANDARD GH nodes: t = ±1/√2 = ±{1/np.sqrt(2):.6f}")
    print(f"  → Already near-optimal for this integrand")
