#!/usr/bin/env python3
"""
Create multiline plot: |E0(ρ, N) - E0(ρ, 20)| vs ρ for N = 2, 3, ..., 19
"""

import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

# Read data
df = pd.read_csv('convergence_vs_rho.csv')

print("="*80)
print("CREATING CONVERGENCE PLOT")
print("="*80)
print()

# Create figure
fig, axes = plt.subplots(2, 1, figsize=(14, 10))

# Color map
N_values = range(2, 20)
colors = plt.cm.viridis(np.linspace(0, 1, len(N_values)))

# Plot 1: Regular scale
ax1 = axes[0]
for i, N in enumerate(N_values):
    col_name = f'error_N{N}'
    ax1.plot(df['rho'], df[col_name],
             label=f'N={N}', color=colors[i], linewidth=2, alpha=0.8)

ax1.set_xlabel('ρ', fontsize=14)
ax1.set_ylabel('|E₀(ρ, N) - E₀(ρ, 20)|', fontsize=14)
ax1.set_title('Convergence Error vs ρ for Different Quadrature Nodes (2-PSK, SNR=1)',
              fontsize=15, fontweight='bold')
ax1.grid(True, alpha=0.3)
ax1.legend(bbox_to_anchor=(1.05, 1), loc='upper left', fontsize=9, ncol=2)

# Plot 2: Log scale
ax2 = axes[1]
for i, N in enumerate(N_values):
    col_name = f'error_N{N}'
    # Add small offset to avoid log(0)
    ax2.semilogy(df['rho'], df[col_name] + 1e-16,
                 label=f'N={N}', color=colors[i], linewidth=2, alpha=0.8)

ax2.set_xlabel('ρ', fontsize=14)
ax2.set_ylabel('|E₀(ρ, N) - E₀(ρ, 20)| (log scale)', fontsize=14)
ax2.set_title('Convergence Error vs ρ (Log Scale)',
              fontsize=15, fontweight='bold')
ax2.grid(True, alpha=0.3, which='both')
ax2.legend(bbox_to_anchor=(1.05, 1), loc='upper left', fontsize=9, ncol=2)

plt.tight_layout()
plt.savefig('convergence_vs_rho.png', dpi=150, bbox_inches='tight')
print("Plot saved to: convergence_vs_rho.png")
print()

# Additional analysis
print("="*80)
print("ANALYSIS")
print("="*80)
print()

# Find maximum error for each N across all rho
print("Maximum error across ρ ∈ [-1, 2] for each N:")
print("-"*50)
for N in N_values:
    col_name = f'error_N{N}'
    max_error = df[col_name].max()
    max_rho = df.loc[df[col_name].idxmax(), 'rho']
    print(f"  N={N:2d}: max_error = {max_error:.3e} at ρ = {max_rho:+.2f}")

print()

# Check if error depends on rho
print("Error variation analysis:")
print("-"*50)

for N in [2, 5, 10, 15, 19]:
    col_name = f'error_N{N}'
    errors = df[col_name]

    mean_err = errors.mean()
    std_err = errors.std()
    cv = (std_err / mean_err * 100) if mean_err > 0 else 0

    print(f"N={N:2d}: mean={mean_err:.3e}, std={std_err:.3e}, CV={cv:.1f}%")

print()

# Find critical rho regions
print("Error behavior in different ρ regions:")
print("-"*50)

regions = [
    ('ρ < 0 (extrapolation)', df[df['rho'] < 0]),
    ('ρ ∈ [0, 1] (main)', df[(df['rho'] >= 0) & (df['rho'] <= 1)]),
    ('ρ > 1 (extrapolation)', df[df['rho'] > 1])
]

for region_name, region_df in regions:
    print(f"\n{region_name}:")
    for N in [5, 10, 15]:
        col_name = f'error_N{N}'
        max_err = region_df[col_name].max()
        print(f"  N={N:2d}: max_error = {max_err:.3e}")

print()
print("="*80)
print("CONCLUSION")
print("="*80)
print()

# Check if errors are rho-dependent
col_N10 = 'error_N10'
errors_N10 = df[col_N10]
cv_N10 = (errors_N10.std() / errors_N10.mean() * 100) if errors_N10.mean() > 0 else 0

if cv_N10 > 50:
    print("⚠️  Error varies significantly with ρ (CV > 50%)")
    print("   Convergence appears to be ρ-DEPENDENT")
    print("   Different ρ regions may need different N values")
else:
    print("✅ Error relatively stable across ρ (CV < 50%)")
    print("   Convergence appears to be ρ-INDEPENDENT")
    print("   Can use polynomial approximation strategy")

print()
print(f"Coefficient of variation for N=10: {cv_N10:.1f}%")
print()

# Create additional plot: Error at specific rho values
fig2, ax = plt.subplots(1, 1, figsize=(12, 7))

# Select specific rho values to highlight
highlight_rho = [-1, -0.5, 0, 0.5, 1.0, 1.5, 2.0]
markers = ['o', 's', '^', 'v', 'D', '*', 'p']

for rho_val, marker in zip(highlight_rho, markers):
    # Find closest rho in data
    idx = (df['rho'] - rho_val).abs().idxmin()
    actual_rho = df.loc[idx, 'rho']

    errors_at_rho = [df.loc[idx, f'error_N{N}'] for N in N_values]

    ax.semilogy(list(N_values), errors_at_rho,
                marker=marker, markersize=8, linewidth=2,
                label=f'ρ = {actual_rho:.2f}', alpha=0.8)

ax.set_xlabel('N (number of quadrature nodes)', fontsize=14)
ax.set_ylabel('|E₀(ρ, N) - E₀(ρ, 20)|', fontsize=14)
ax.set_title('Convergence Rate: Error vs N for Specific ρ Values',
             fontsize=15, fontweight='bold')
ax.grid(True, alpha=0.3, which='both')
ax.legend(fontsize=11)

plt.tight_layout()
plt.savefig('convergence_vs_N_specific_rho.png', dpi=150, bbox_inches='tight')
print("Additional plot saved to: convergence_vs_N_specific_rho.png")
print()
