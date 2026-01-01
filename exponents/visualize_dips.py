#!/usr/bin/env python3
"""
Visualize error patterns to see "dips" and "bumps" across ρ and N
"""

import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

# Read 32-PAM data (the user mentioned this one)
df = pd.read_csv('convergence_32-PAM.csv')

print("="*80)
print("ANALYZING 32-PAM ERROR PATTERNS")
print("="*80)
print()

# Extract N values from column names
N_cols = [col for col in df.columns if col.startswith('error_N')]
N_values = [int(col.replace('error_N', '')) for col in N_cols]

print(f"ρ values: {df['rho'].values}")
print(f"N values: {N_values}")
print()

# Check the specific dip mentioned: ρ=0.7, N=12
rho_07_idx = np.argmin(np.abs(df['rho'].values - 0.7))
print(f"Checking ρ ≈ 0.7 (actual: {df['rho'].iloc[rho_07_idx]:.1f}):")
print("-" * 60)
for N_col in N_cols:
    N = int(N_col.replace('error_N', ''))
    error = df.loc[rho_07_idx, N_col]
    print(f"  N={N:3d}: error = {error:.3e}")
print()

# Look for dips: places where error drops more than expected
print("Looking for 'dips' (unusually good convergence):")
print("-" * 60)

for rho_idx, rho in enumerate(df['rho']):
    errors = [df.loc[rho_idx, col] for col in N_cols]

    # Find ratios between consecutive errors
    for i in range(len(errors) - 1):
        if errors[i] > 0 and errors[i+1] > 0:
            ratio = errors[i] / errors[i+1]
            # If error drops by more than 100x, that's a "dip"
            if ratio > 100 and errors[i+1] < 1e-10:
                print(f"  ρ={rho:.1f}: N={N_values[i]:2d}→{N_values[i+1]:2d}, "
                      f"error drops {ratio:.1f}× ({errors[i]:.2e} → {errors[i+1]:.2e})")

print()

# Create visualization
fig, axes = plt.subplots(2, 2, figsize=(16, 12))

# Plot 1: Error heatmap (log scale)
ax1 = axes[0, 0]
error_matrix = df[N_cols].values
error_matrix[error_matrix == 0] = 1e-16  # Replace zeros with small value for log
im1 = ax1.imshow(np.log10(error_matrix), aspect='auto', cmap='viridis', interpolation='nearest')
ax1.set_xlabel('N index', fontsize=12)
ax1.set_ylabel('ρ index', fontsize=12)
ax1.set_title('Error Heatmap: log₁₀(error)', fontsize=14, fontweight='bold')
ax1.set_xticks(range(len(N_values)))
ax1.set_xticklabels(N_values, rotation=45)
ax1.set_yticks(range(len(df)))
ax1.set_yticklabels([f"{rho:.1f}" for rho in df['rho']])
cbar1 = plt.colorbar(im1, ax=ax1)
cbar1.set_label('log₁₀(error)', fontsize=11)

# Highlight the ρ=0.7, N=12 point
n12_idx = N_values.index(12)
ax1.plot(n12_idx, rho_07_idx, 'r*', markersize=20, markeredgecolor='white', markeredgewidth=2)
ax1.text(n12_idx + 0.5, rho_07_idx, 'ρ=0.7, N=12\n(mentioned dip)',
         color='white', fontsize=10, va='center', bbox=dict(boxstyle='round', facecolor='red', alpha=0.7))

# Plot 2: Error vs N for specific ρ values
ax2 = axes[0, 1]
rho_samples = [0.1, 0.3, 0.5, 0.7, 0.9]
for rho_val in rho_samples:
    idx = np.argmin(np.abs(df['rho'].values - rho_val))
    actual_rho = df['rho'].iloc[idx]
    errors = [df.loc[idx, col] for col in N_cols]
    errors_nonzero = [e if e > 0 else 1e-16 for e in errors]

    style = '-o' if rho_val == 0.7 else '-'
    lw = 3 if rho_val == 0.7 else 2
    ax2.semilogy(N_values, errors_nonzero, style, label=f'ρ={actual_rho:.1f}', linewidth=lw, markersize=8)

ax2.set_xlabel('N (number of quadrature nodes)', fontsize=12)
ax2.set_ylabel('Error (log scale)', fontsize=12)
ax2.set_title('Error vs N for Different ρ', fontsize=14, fontweight='bold')
ax2.legend(fontsize=11)
ax2.grid(True, alpha=0.3, which='both')

# Highlight N=12
ax2.axvline(12, color='red', linestyle='--', alpha=0.5, linewidth=2)
ax2.text(12, 1e-2, 'N=12', color='red', fontsize=11, ha='right', va='top', rotation=90)

# Plot 3: Convergence rate vs ρ
ax3 = axes[1, 0]
ax3.plot(df['rho'], df['convergence_rate'], 'o-', linewidth=2, markersize=8)
ax3.set_xlabel('ρ', fontsize=12)
ax3.set_ylabel('Convergence Rate α', fontsize=12)
ax3.set_title('Convergence Rate vs ρ (32-PAM)', fontsize=14, fontweight='bold')
ax3.grid(True, alpha=0.3)

mean_rate = df['convergence_rate'].mean()
std_rate = df['convergence_rate'].std()
cv = (std_rate / abs(mean_rate)) * 100

ax3.axhline(mean_rate, color='red', linestyle='--', alpha=0.7, label=f'Mean: {mean_rate:.2f}')
ax3.fill_between(df['rho'], mean_rate - std_rate, mean_rate + std_rate,
                  color='red', alpha=0.2, label=f'±1 std ({cv:.1f}% CV)')
ax3.legend(fontsize=10)

# Highlight ρ=0.7
ax3.axvline(0.7, color='red', linestyle=':', alpha=0.5)
ax3.text(0.7, ax3.get_ylim()[0], 'ρ=0.7', color='red', fontsize=10, ha='center', va='bottom')

# Plot 4: Ratio of consecutive errors at ρ=0.7
ax4 = axes[1, 1]
errors_07 = [df.loc[rho_07_idx, col] for col in N_cols]
ratios = []
N_pairs = []
for i in range(len(errors_07) - 1):
    if errors_07[i] > 0 and errors_07[i+1] > 0:
        ratio = errors_07[i] / errors_07[i+1]
        ratios.append(ratio)
        N_pairs.append(f"{N_values[i]}→{N_values[i+1]}")

bars = ax4.bar(range(len(ratios)), ratios, color=['red' if '10→12' in label else 'blue' for label in N_pairs])
ax4.set_xlabel('N transition', fontsize=12)
ax4.set_ylabel('Error Reduction Ratio', fontsize=12)
ax4.set_title('Error Reduction at Each Step (ρ=0.7)', fontsize=14, fontweight='bold')
ax4.set_xticks(range(len(N_pairs)))
ax4.set_xticklabels(N_pairs, rotation=45, ha='right')
ax4.axhline(10, color='gray', linestyle='--', alpha=0.5, label='10× reduction')
ax4.axhline(100, color='orange', linestyle='--', alpha=0.5, label='100× reduction')
ax4.set_yscale('log')
ax4.legend(fontsize=10)
ax4.grid(True, alpha=0.3, which='both', axis='y')

# Highlight the big dip
for i, (ratio, label) in enumerate(zip(ratios, N_pairs)):
    if ratio > 100:
        ax4.text(i, ratio, f'{ratio:.0f}×', ha='center', va='bottom', fontsize=9, fontweight='bold', color='red')

plt.tight_layout()
plt.savefig('32pam_dips_analysis.png', dpi=150, bbox_inches='tight')
print("Plot saved to: 32pam_dips_analysis.png")
print()

# Statistical summary
print("="*80)
print("SUMMARY")
print("="*80)
print(f"32-PAM convergence rates across ρ ∈ [0.1, 1.0]:")
print(f"  Mean: {mean_rate:.2f}")
print(f"  Std:  {std_rate:.2f}")
print(f"  CV:   {cv:.1f}%")
print(f"  Range: [{df['convergence_rate'].min():.2f}, {df['convergence_rate'].max():.2f}]")
print()
print(f"ρ-independent? {'YES ✓' if cv < 15 else 'NO ✗'} (CV < 15% threshold)")
