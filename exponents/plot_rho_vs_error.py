#!/usr/bin/env python3
"""
Plot ρ vs error for different N values (the correct way to see dips!)
"""

import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

# Read 32-PAM data
df = pd.read_csv('convergence_32-PAM.csv')

print("="*80)
print("PLOTTING ρ vs ERROR FOR DIFFERENT N VALUES")
print("="*80)
print()

# Extract N values from column names
N_cols = [col for col in df.columns if col.startswith('error_N')]
N_values = [int(col.replace('error_N', '')) for col in N_cols]

# Create figure with multiple subplots
fig, axes = plt.subplots(2, 2, figsize=(16, 12))

# Plot 1: ρ vs error for all N (regular scale)
ax1 = axes[0, 0]
colors = plt.cm.viridis(np.linspace(0, 1, len(N_cols)))

for i, (N_col, N, color) in enumerate(zip(N_cols, N_values, colors)):
    errors = df[N_col].values
    linewidth = 3 if N == 12 else 2
    alpha = 1.0 if N == 12 else 0.7
    ax1.plot(df['rho'], errors, '-o', label=f'N={N}', color=color,
             linewidth=linewidth, alpha=alpha, markersize=6)

ax1.set_xlabel('ρ', fontsize=14)
ax1.set_ylabel('|E₀(ρ, N) - E₀(ρ, 40)|', fontsize=14)
ax1.set_title('Error vs ρ for Different N (32-PAM) - Regular Scale',
              fontsize=15, fontweight='bold')
ax1.legend(bbox_to_anchor=(1.05, 1), loc='upper left', fontsize=9, ncol=2)
ax1.grid(True, alpha=0.3)

# Plot 2: ρ vs error for all N (log scale)
ax2 = axes[0, 1]
for i, (N_col, N, color) in enumerate(zip(N_cols, N_values, colors)):
    errors = df[N_col].values
    errors_nonzero = np.where(errors > 0, errors, 1e-16)
    linewidth = 3 if N == 12 else 2
    alpha = 1.0 if N == 12 else 0.7
    ax2.semilogy(df['rho'], errors_nonzero, '-o', label=f'N={N}', color=color,
                 linewidth=linewidth, alpha=alpha, markersize=6)

ax2.set_xlabel('ρ', fontsize=14)
ax2.set_ylabel('|E₀(ρ, N) - E₀(ρ, 40)| (log scale)', fontsize=14)
ax2.set_title('Error vs ρ for Different N (32-PAM) - Log Scale',
              fontsize=15, fontweight='bold')
ax2.legend(bbox_to_anchor=(1.05, 1), loc='upper left', fontsize=9, ncol=2)
ax2.grid(True, alpha=0.3, which='both')

# Highlight ρ=0.7
ax2.axvline(0.7, color='red', linestyle='--', alpha=0.5, linewidth=2)
ax2.text(0.7, ax2.get_ylim()[1], 'ρ=0.7\n(mentioned dip)',
         ha='center', va='top', fontsize=10, color='red',
         bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))

# Plot 3: Focus on specific N values
ax3 = axes[1, 0]
focus_N = [4, 6, 8, 10, 12, 15, 20]
for N in focus_N:
    N_col = f'error_N{N}'
    errors = df[N_col].values
    errors_nonzero = np.where(errors > 0, errors, 1e-16)
    linewidth = 3 if N == 12 else 2
    marker = 'o' if N == 12 else 's'
    markersize = 10 if N == 12 else 7
    ax3.semilogy(df['rho'], errors_nonzero, f'-{marker}', label=f'N={N}',
                 linewidth=linewidth, markersize=markersize)

ax3.set_xlabel('ρ', fontsize=14)
ax3.set_ylabel('Error (log scale)', fontsize=14)
ax3.set_title('Error vs ρ - Focus on Key N Values', fontsize=15, fontweight='bold')
ax3.legend(fontsize=11)
ax3.grid(True, alpha=0.3, which='both')

# Mark the dip at ρ=0.7, N=12
rho_07_idx = np.argmin(np.abs(df['rho'].values - 0.7))
error_at_dip = df.loc[rho_07_idx, 'error_N12']
ax3.plot(0.7, error_at_dip, 'r*', markersize=25, markeredgecolor='white', markeredgewidth=2)
ax3.annotate('Dip at ρ=0.7\nN=12', xy=(0.7, error_at_dip),
             xytext=(0.5, error_at_dip * 100),
             arrowprops=dict(arrowstyle='->', color='red', lw=2),
             fontsize=11, color='red', fontweight='bold',
             bbox=dict(boxstyle='round', facecolor='yellow', alpha=0.8))

# Plot 4: Show where dips occur in (ρ, N) space
ax4 = axes[1, 1]

# Create a matrix to show local minima (dips)
dip_matrix = np.zeros((len(df), len(N_values)))

for rho_idx in range(len(df)):
    for n_idx in range(len(N_values)):
        error = df.loc[rho_idx, N_cols[n_idx]]

        # Check if this is a local minimum compared to neighbors
        is_dip = False

        # Compare with neighbors in ρ direction
        if 0 < rho_idx < len(df) - 1:
            prev_error = df.loc[rho_idx - 1, N_cols[n_idx]]
            next_error = df.loc[rho_idx + 1, N_cols[n_idx]]
            if error > 0 and error < prev_error and error < next_error:
                dip_matrix[rho_idx, n_idx] = 1

        # Or very small absolute error (< 1e-10)
        if error < 1e-10 and error > 0:
            dip_matrix[rho_idx, n_idx] = 2

im = ax4.imshow(dip_matrix, aspect='auto', cmap='RdYlGn', interpolation='nearest', vmin=0, vmax=2)
ax4.set_xlabel('N', fontsize=14)
ax4.set_ylabel('ρ', fontsize=14)
ax4.set_title('Location of "Dips" in (ρ, N) Space', fontsize=15, fontweight='bold')
ax4.set_xticks(range(len(N_values)))
ax4.set_xticklabels(N_values, rotation=45)
ax4.set_yticks(range(len(df)))
ax4.set_yticklabels([f"{rho:.1f}" for rho in df['rho']])

# Mark ρ=0.7, N=12
n12_idx = N_values.index(12)
ax4.plot(n12_idx, rho_07_idx, 'r*', markersize=25, markeredgecolor='white', markeredgewidth=3)

cbar = plt.colorbar(im, ax=ax4)
cbar.set_label('0=normal, 1=local min, 2=very small', fontsize=10)

plt.tight_layout()
plt.savefig('rho_vs_error_32pam.png', dpi=150, bbox_inches='tight')
print("Plot saved to: rho_vs_error_32pam.png")
print()

# Analysis: Where do dips occur?
print("="*80)
print("DIP ANALYSIS")
print("="*80)
print()

print("Looking at N=12 curve specifically:")
print("-" * 60)
errors_n12 = df['error_N12'].values
for i, (rho, error) in enumerate(zip(df['rho'], errors_n12)):
    if i > 0 and i < len(df) - 1:
        prev = errors_n12[i-1]
        next_err = errors_n12[i+1]
        if error > 0 and error < prev and error < next_err:
            print(f"  Local minimum at ρ={rho:.1f}: error={error:.3e}")
        elif error < 1e-12:
            print(f"  Very small error at ρ={rho:.1f}: error={error:.3e}")

print()
print("The key insight:")
print("-" * 60)
print("If you see 'dips' at specific ρ values for a given N,")
print("that means the error DEPENDS on ρ for that N!")
print()
print("A perfectly ρ-independent case would have smooth curves")
print("(no bumps/dips) when plotting error vs ρ for fixed N.")
