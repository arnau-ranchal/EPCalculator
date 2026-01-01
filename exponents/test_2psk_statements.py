#!/usr/bin/env python3
"""
Test Statement 1 vs Statement 2 for 2-PSK
"""

import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

# Read 2-PSK data
df = pd.read_csv('convergence_2-PSK.csv')

print("="*80)
print("2-PSK ANALYSIS: Testing Statement 1 vs Statement 2")
print("="*80)
print()
print(f"2-PSK CV = 36.1% (HIGH - ρ-dependent)")
print()

# Extract N values
N_cols = [col for col in df.columns if col.startswith('error_N')]
N_values = [int(col.replace('error_N', '')) for col in N_cols]

# Create comprehensive visualization
fig = plt.figure(figsize=(18, 12))
gs = fig.add_gridspec(3, 3, hspace=0.3, wspace=0.3)

# Plot 1: Error vs ρ for all N (log scale) - TOP ROW, SPAN 2 COLUMNS
ax1 = fig.add_subplot(gs[0, :2])
colors = plt.cm.viridis(np.linspace(0, 1, len(N_cols)))

for i, (N_col, N, color) in enumerate(zip(N_cols, N_values, colors)):
    errors = df[N_col].values
    errors_nonzero = np.where(errors > 0, errors, 1e-16)
    linewidth = 2.5 if N in [6, 12] else 1.5
    alpha = 1.0 if N in [6, 12] else 0.6
    ax1.semilogy(df['rho'], errors_nonzero, '-o', label=f'N={N}', color=color,
                 linewidth=linewidth, alpha=alpha, markersize=5)

ax1.set_xlabel('ρ', fontsize=13)
ax1.set_ylabel('Error (log scale)', fontsize=13)
ax1.set_title('2-PSK: Error vs ρ for Different N (Test for Statement 1 vs 2)',
              fontsize=14, fontweight='bold')
ax1.legend(bbox_to_anchor=(1.02, 1), loc='upper left', fontsize=8, ncol=2)
ax1.grid(True, alpha=0.3, which='both')

# Highlight specific ρ values to check
for rho_val in [0.3, 0.5, 0.7]:
    ax1.axvline(rho_val, color='red', linestyle='--', alpha=0.3, linewidth=1)

# Plot 2: Convergence rates vs ρ - TOP RIGHT
ax2 = fig.add_subplot(gs[0, 2])
ax2.plot(df['rho'], df['convergence_rate'], 'bo-', linewidth=2, markersize=8)
ax2.set_xlabel('ρ', fontsize=12)
ax2.set_ylabel('Convergence Rate α', fontsize=12)
ax2.set_title('α varies dramatically!', fontsize=13, fontweight='bold')
ax2.grid(True, alpha=0.3)
mean_rate = df['convergence_rate'].mean()
ax2.axhline(mean_rate, color='red', linestyle='--', alpha=0.5)
ax2.text(0.5, mean_rate, f'Mean: {mean_rate:.1f}', fontsize=10)

# Plot 3-5: Check Statement 1 at specific ρ values - MIDDLE ROW
test_rho_values = [0.3, 0.5, 0.7]

for idx, test_rho in enumerate(test_rho_values):
    ax = fig.add_subplot(gs[1, idx])

    # Find closest ρ
    rho_idx = np.argmin(np.abs(df['rho'].values - test_rho))
    actual_rho = df['rho'].iloc[rho_idx]

    # Get errors for all N at this ρ
    errors_at_rho = [df.loc[rho_idx, col] for col in N_cols]
    errors_nonzero = [e if e > 0 else 1e-16 for e in errors_at_rho]

    ax.semilogy(N_values, errors_nonzero, 'o-', linewidth=2, markersize=8, color='blue')
    ax.set_xlabel('N', fontsize=11)
    ax.set_ylabel('Error (log)', fontsize=11)
    ax.set_title(f'At ρ={actual_rho:.1f}: Do all N dip together?', fontsize=11, fontweight='bold')
    ax.grid(True, alpha=0.3, which='both')

    # Mark dips (local minima in the error vs N curve)
    for i in range(1, len(errors_nonzero) - 1):
        if errors_nonzero[i] < errors_nonzero[i-1] and errors_nonzero[i] < errors_nonzero[i+1]:
            ax.plot(N_values[i], errors_nonzero[i], 'r*', markersize=15)
            ax.text(N_values[i], errors_nonzero[i], 'dip', fontsize=8, ha='center', va='top')

# Plot 6-8: Check Statement 2 for specific N values - BOTTOM ROW
test_N_values = [6, 10, 15]

for idx, test_N in enumerate(test_N_values):
    ax = fig.add_subplot(gs[2, idx])

    N_col = f'error_N{test_N}'
    errors = df[N_col].values
    errors_nonzero = np.where(errors > 0, errors, 1e-16)

    ax.semilogy(df['rho'], errors_nonzero, 'o-', linewidth=2, markersize=8, color='green')
    ax.set_xlabel('ρ', fontsize=11)
    ax.set_ylabel('Error (log)', fontsize=11)
    ax.set_title(f'N={test_N}: Same behavior across ρ?', fontsize=11, fontweight='bold')
    ax.grid(True, alpha=0.3, which='both')

    # Mark dips (local minima in the error vs ρ curve)
    for i in range(1, len(errors_nonzero) - 1):
        if errors_nonzero[i] < errors_nonzero[i-1] and errors_nonzero[i] < errors_nonzero[i+1]:
            rho_at_dip = df['rho'].iloc[i]
            ax.plot(rho_at_dip, errors_nonzero[i], 'r*', markersize=15)
            ax.text(rho_at_dip, errors_nonzero[i], f'{rho_at_dip:.1f}',
                   fontsize=8, ha='center', va='bottom')

plt.savefig('2psk_statement_test.png', dpi=150, bbox_inches='tight')
print("Plot saved to: 2psk_statement_test.png")
print()

# Quantitative analysis
print("="*80)
print("STATEMENT 1 TEST: At each ρ, do ALL N have similar behavior?")
print("="*80)
print()

# For each ρ, compute coefficient of variation of errors across N
print("Variation of errors across N at each ρ:")
print("-" * 60)
for i, rho in enumerate(df['rho']):
    errors_at_rho = [df.loc[i, col] for col in N_cols if df.loc[i, col] > 0]
    if len(errors_at_rho) > 0:
        mean_err = np.mean(errors_at_rho)
        std_err = np.std(errors_at_rho)
        cv_err = (std_err / mean_err * 100) if mean_err > 0 else 0
        print(f"  ρ={rho:.1f}: CV of errors = {cv_err:.1f}% (low=synchronized, high=not)")

print()
print("="*80)
print("STATEMENT 2 TEST: Does each N have consistent behavior across ρ?")
print("="*80)
print()

# For each N, compute coefficient of variation of errors across ρ
print("Variation of errors across ρ for each N:")
print("-" * 60)
for N_col, N in zip(N_cols, N_values):
    errors_at_N = df[N_col].values
    errors_nonzero = errors_at_N[errors_at_N > 0]
    if len(errors_nonzero) > 0:
        mean_err = np.mean(errors_nonzero)
        std_err = np.std(errors_nonzero)
        cv_err = (std_err / mean_err * 100) if mean_err > 0 else 0
        print(f"  N={N:2d}: CV of errors = {cv_err:.1f}% (low=consistent, high=varying)")

print()
print("="*80)
print("CONCLUSION")
print("="*80)
print()

# Calculate average CV across ρ (Statement 1 test)
cv_across_N_at_rho = []
for i in range(len(df)):
    errors_at_rho = [df.loc[i, col] for col in N_cols if df.loc[i, col] > 0]
    if len(errors_at_rho) > 0:
        cv = (np.std(errors_at_rho) / np.mean(errors_at_rho) * 100)
        cv_across_N_at_rho.append(cv)

# Calculate average CV across ρ (Statement 2 test)
cv_across_rho_at_N = []
for N_col in N_cols:
    errors = df[N_col].values
    errors_nonzero = errors[errors > 0]
    if len(errors_nonzero) > 0:
        cv = (np.std(errors_nonzero) / np.mean(errors_nonzero) * 100)
        cv_across_rho_at_N.append(cv)

avg_cv_statement1 = np.mean(cv_across_N_at_rho)
avg_cv_statement2 = np.mean(cv_across_rho_at_N)

print(f"Statement 1 metric (avg CV of errors across N at each ρ): {avg_cv_statement1:.1f}%")
print(f"Statement 2 metric (avg CV of errors across ρ for each N): {avg_cv_statement2:.1f}%")
print()

if avg_cv_statement1 < avg_cv_statement2:
    print("→ Statement 1 is MORE true: At each ρ, N values behave similarly")
    print("  (Horizontal synchronization)")
else:
    print("→ Statement 2 is MORE true: Each N behaves consistently across ρ")
    print("  (Vertical consistency)")
