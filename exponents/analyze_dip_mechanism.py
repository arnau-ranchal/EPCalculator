#!/usr/bin/env python3
"""
Investigate the mathematical mechanism of dips at specific (N, ρ) values
"""

import numpy as np
import matplotlib.pyplot as plt
from scipy.special import roots_hermite

print("="*80)
print("MATHEMATICAL ANALYSIS OF DIPS")
print("="*80)
print()

# For 32-PAM with SNR=1, the integrand has form:
# f(z; ρ) = exp(-|z|² + ρ/(1+ρ) * distance_terms)

# Key insight: The effective "variance" of the integrand changes with ρ
# At ρ=0: pure Gaussian with variance=1 → perfectly matched to Gauss-Hermite!
# At ρ>0: distorted Gaussian with effective variance σ²(ρ)

# Hypothesis: Dips occur when σ²(ρ) matches well with the N-node structure

rho_values = np.linspace(0.1, 1.0, 10)

# The distance terms in 32-PAM constellation
M = 32
delta = np.sqrt(3 / (M**2 - 1))
X_pam = np.array([(2*n+1)*delta for n in range(M//2)] +
                  [-(2*n+1)*delta for n in range(M//2-1, -1, -1)])

print("32-PAM constellation points:")
print(f"  δ = {delta:.4f}")
print(f"  X range: [{X_pam.min():.3f}, {X_pam.max():.3f}]")
print(f"  Nearest neighbor distance: {2*delta:.4f}")
print()

# For SNR=1:
SNR = 1.0
print(f"SNR = {SNR}")
print()

# Gauss-Hermite quadrature nodes for N=12
N = 12
roots, weights = roots_hermite(N)

print(f"Gauss-Hermite nodes (N={N}):")
print(f"  Roots: {roots}")
print(f"  Span: [{roots.min():.3f}, {roots.max():.3f}]")
print(f"  Typical spacing: {np.diff(roots).mean():.3f}")
print()

# The integrand at different ρ involves:
# exp(-z² + ρ/(1+ρ) * |z - √SNR·Δx|²)
# = exp(-z² + ρ/(1+ρ) * (z² - 2√SNR·Δx·z + SNR·Δx²))
# = exp(z²(-1 + ρ/(1+ρ)) - 2ρ/(1+ρ)·√SNR·Δx·z + ρ/(1+ρ)·SNR·Δx²)
# = exp(z²·(-1/(1+ρ)) - 2ρ/(1+ρ)·√SNR·Δx·z + const)

# Effective variance: σ_eff² = (1+ρ)
# The integrand is Gaussian-like with variance that depends on ρ!

print("Effective variance of integrand:")
print("-" * 60)
for rho in [0.1, 0.3, 0.5, 0.7, 0.9]:
    sigma_eff_sq = 1 + rho
    sigma_eff = np.sqrt(sigma_eff_sq)
    print(f"  ρ={rho:.1f}: σ_eff² = {sigma_eff_sq:.3f}, σ_eff = {sigma_eff:.3f}")

print()

# Key insight: Gauss-Hermite quadrature is optimal for weight function exp(-x²)
# But our effective weight is exp(-x²/σ²)
# We can transform: x' = x/σ, then the integral becomes:
# ∫ f(x) exp(-x²/σ²) dx = σ ∫ f(σx') exp(-x'²) dx'

# The nodes should be at σ * (Hermite roots), not at (Hermite roots)!
# So there's a MISMATCH that depends on ρ

print("="*80)
print("THE MECHANISM:")
print("="*80)
print()
print("1. The integrand has effective Gaussian width σ_eff(ρ) = √(1+ρ)")
print()
print("2. Gauss-Hermite nodes are optimally placed for σ=1")
print()
print("3. At ρ≠0, the nodes are MISPLACED by factor √(1+ρ)")
print()
print("4. The error depends on how much this mismatch affects the")
print("   high-order derivatives of the integrand")
print()
print("5. For certain (N, ρ) combinations, accidental cancellations")
print("   occur in the quadrature error formula!")
print()

# Calculate the mismatch factor
print("Mismatch analysis:")
print("-" * 60)
print()
print("Optimal node locations (should be at)  vs  Actual nodes (are at)")
print()

for rho in [0.1, 0.3, 0.5, 0.7, 0.9]:
    sigma_eff = np.sqrt(1 + rho)
    optimal_nodes = sigma_eff * roots  # Where nodes should be
    actual_nodes = roots                # Where they actually are
    mismatch = np.abs(optimal_nodes - actual_nodes).mean()

    print(f"ρ={rho:.1f}: σ_eff={sigma_eff:.3f}")
    print(f"  Optimal span: [{optimal_nodes.min():.2f}, {optimal_nodes.max():.2f}]")
    print(f"  Actual span:  [{actual_nodes.min():.2f}, {actual_nodes.max():.2f}]")
    print(f"  Mean mismatch: {mismatch:.3f}")
    print()

# Visualization
fig, axes = plt.subplots(2, 2, figsize=(15, 12))

# Plot 1: Effective width vs ρ
ax1 = axes[0, 0]
rho_dense = np.linspace(0, 1, 100)
sigma_eff_dense = np.sqrt(1 + rho_dense)
ax1.plot(rho_dense, sigma_eff_dense, 'b-', linewidth=2)
ax1.axhline(1.0, color='gray', linestyle='--', alpha=0.5, label='Standard Gauss-Hermite (σ=1)')
ax1.axvline(0.7, color='red', linestyle='--', alpha=0.5, label='ρ=0.7 (dip location)')
ax1.set_xlabel('ρ', fontsize=12)
ax1.set_ylabel('σ_eff = √(1+ρ)', fontsize=12)
ax1.set_title('Effective Width of Integrand', fontsize=14, fontweight='bold')
ax1.legend(fontsize=10)
ax1.grid(True, alpha=0.3)

# At ρ=0.7, σ_eff = √1.7 ≈ 1.304
sigma_at_07 = np.sqrt(1.7)
ax1.plot(0.7, sigma_at_07, 'ro', markersize=12)
ax1.text(0.7, sigma_at_07 + 0.05, f'σ={sigma_at_07:.3f}', ha='center', fontsize=10)

# Plot 2: Node placement comparison
ax2 = axes[0, 1]
rho_compare = [0.1, 0.7, 1.0]
colors_compare = ['blue', 'red', 'purple']

for rho, color in zip(rho_compare, colors_compare):
    sigma_eff = np.sqrt(1 + rho)
    optimal = sigma_eff * roots

    # Plot optimal locations
    ax2.scatter(optimal, [rho]*len(optimal), c=color, marker='x', s=100,
                label=f'ρ={rho:.1f} optimal (σ={sigma_eff:.2f})', alpha=0.7)

# Plot actual node locations (same for all ρ)
ax2.scatter(roots, [0.5]*len(roots), c='black', marker='o', s=80,
            label='Actual GH nodes (σ=1)', zorder=10)

ax2.set_xlabel('Node position', fontsize=12)
ax2.set_ylabel('ρ value', fontsize=12)
ax2.set_title('Optimal vs Actual Node Positions (N=12)', fontsize=14, fontweight='bold')
ax2.legend(fontsize=9, loc='upper left')
ax2.grid(True, alpha=0.3)
ax2.axvline(0, color='gray', linestyle='-', alpha=0.3)

# Plot 3: Integrand shape at different ρ
ax3 = axes[1, 0]
z = np.linspace(-4, 4, 500)

# Simplified integrand: exp(-z²/(1+ρ))
for rho in [0.0, 0.3, 0.7, 1.0]:
    integrand = np.exp(-z**2 / (1 + rho))
    linewidth = 3 if rho == 0.7 else 2
    ax3.plot(z, integrand, linewidth=linewidth, label=f'ρ={rho:.1f}')

# Mark the N=12 Gauss-Hermite nodes
for root in roots:
    ax3.axvline(root, color='gray', linestyle=':', alpha=0.3, linewidth=1)

ax3.set_xlabel('z', fontsize=12)
ax3.set_ylabel('exp(-z²/(1+ρ))', fontsize=12)
ax3.set_title('Integrand Shape Changes with ρ', fontsize=14, fontweight='bold')
ax3.legend(fontsize=10)
ax3.grid(True, alpha=0.3)
ax3.set_ylim([0, 1.1])

# Plot 4: Mismatch metric
ax4 = axes[1, 1]
rho_range = np.linspace(0.1, 1.0, 50)
mismatches = []

for rho in rho_range:
    sigma_eff = np.sqrt(1 + rho)
    optimal_nodes = sigma_eff * roots
    mismatch = np.abs(optimal_nodes - roots).mean()
    mismatches.append(mismatch)

ax4.plot(rho_range, mismatches, 'b-', linewidth=2)
ax4.axvline(0.7, color='red', linestyle='--', alpha=0.5, linewidth=2, label='ρ=0.7')
ax4.set_xlabel('ρ', fontsize=12)
ax4.set_ylabel('Mean node mismatch', fontsize=12)
ax4.set_title('Average Distance Between Optimal and Actual Nodes', fontsize=14, fontweight='bold')
ax4.legend(fontsize=10)
ax4.grid(True, alpha=0.3)

# Mark the ρ=0.7 point
mismatch_07 = np.interp(0.7, rho_range, mismatches)
ax4.plot(0.7, mismatch_07, 'ro', markersize=12)

plt.tight_layout()
plt.savefig('dip_mechanism_analysis.png', dpi=150, bbox_inches='tight')
print("Plot saved to: dip_mechanism_analysis.png")
print()

print("="*80)
print("HYPOTHESIS FOR ρ=0.7 DIP:")
print("="*80)
print()
print(f"At ρ=0.7:")
print(f"  σ_eff = {np.sqrt(1.7):.4f}")
print(f"  Mismatch = {mismatch_07:.4f}")
print()
print("The dip might occur because:")
print("1. The mismatch creates a specific error pattern")
print("2. For N=12, this pattern has accidental cancellations in the")
print("   quadrature error formula")
print("3. These cancellations make the (2N)th derivative term unusually small")
print()
print("Further investigation needed:")
print("  - Compute actual (24th) derivative of integrand at ρ=0.7")
print("  - Check if there's a resonance with Hermite polynomial H₁₂")
print("  - Verify if constellation structure creates symmetries")
