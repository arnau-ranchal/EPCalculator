#!/usr/bin/env python3
"""
Analyze quadrature convergence dependence on rho
"""

import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
from scipy.optimize import curve_fit

# Read data
df = pd.read_csv('rho_convergence_results.csv')

print("="*80)
print("CONVERGENCE ANALYSIS: Does quadrature convergence depend on rho?")
print("="*80)
print()

# Filter out N_ref from analysis
df_analysis = df[df['N'] < 40].copy()

# Create figure with multiple subplots
fig = plt.figure(figsize=(18, 12))
gs = fig.add_gridspec(3, 3, hspace=0.3, wspace=0.3)

# Plot 1: Error vs N for each rho (log-log)
ax1 = fig.add_subplot(gs[0, :2])
for rho in df_analysis['rho'].unique():
    data = df_analysis[df_analysis['rho'] == rho]
    ax1.loglog(data['N'], data['error_vs_ref'] + 1e-16,
               marker='o', label=f'ρ={rho:.1f}', linewidth=2, markersize=6)

ax1.set_xlabel('N (number of quadrature nodes)', fontsize=12)
ax1.set_ylabel('|E0(N) - E0(40)|', fontsize=12)
ax1.set_title('Convergence Rate: Error vs N for Different ρ', fontsize=14, fontweight='bold')
ax1.legend(bbox_to_anchor=(1.05, 1), loc='upper left', fontsize=9)
ax1.grid(True, which='both', alpha=0.3)

# Plot 2: Convergence rate (slope) vs rho
ax2 = fig.add_subplot(gs[0, 2])
slopes = []
rho_vals = []

for rho in df_analysis['rho'].unique():
    if rho == 0.0:
        continue  # Skip rho=0 (near machine precision)

    data = df_analysis[(df_analysis['rho'] == rho) & (df_analysis['N'] <= 20)]
    # Filter out machine precision values
    data = data[data['error_vs_ref'] > 1e-14]

    if len(data) > 3:
        log_N = np.log(data['N'])
        log_error = np.log(data['error_vs_ref'])

        try:
            coeffs = np.polyfit(log_N, log_error, 1)
            slopes.append(coeffs[0])
            rho_vals.append(rho)
        except:
            pass

if len(slopes) > 0:
    ax2.plot(rho_vals, slopes, 'o-', markersize=10, linewidth=2, color='#2E86AB')
    ax2.axhline(y=np.mean(slopes), color='r', linestyle='--', linewidth=2,
                label=f'Mean: {np.mean(slopes):.2f}')
    ax2.set_xlabel('ρ', fontsize=12)
    ax2.set_ylabel('Convergence Rate\n(slope in log-log)', fontsize=12)
    ax2.set_title('Convergence Rate vs ρ', fontsize=13, fontweight='bold')
    ax2.grid(True, alpha=0.3)
    ax2.legend(fontsize=10)

# Plot 3: Required N for target error
ax3 = fig.add_subplot(gs[1, :])
target_errors = [1e-4, 1e-6, 1e-8, 1e-10, 1e-12]
colors = plt.cm.viridis(np.linspace(0, 1, len(target_errors)))

for target_error, color in zip(target_errors, colors):
    required_N = []
    rho_vals2 = []

    for rho in df_analysis['rho'].unique():
        if rho == 0.0:
            continue

        data = df_analysis[df_analysis['rho'] == rho].sort_values('N')
        valid = data[data['error_vs_ref'] < target_error]

        if not valid.empty:
            required_N.append(valid['N'].min())
            rho_vals2.append(rho)

    if required_N:
        ax3.plot(rho_vals2, required_N, 'o-', markersize=8, linewidth=2,
                 color=color, label=f'ε < {target_error:.0e}')

ax3.set_xlabel('ρ', fontsize=12)
ax3.set_ylabel('Required N', fontsize=12)
ax3.set_title('Minimum N Required to Achieve Target Error', fontsize=14, fontweight='bold')
ax3.legend(fontsize=10)
ax3.grid(True, alpha=0.3)

# Plot 4: Heatmap of errors
ax4 = fig.add_subplot(gs[2, :2])
pivot = df_analysis.pivot(index='N', columns='rho', values='error_vs_ref')
pivot_log = np.log10(pivot + 1e-16)

im = ax4.imshow(pivot_log, aspect='auto', cmap='RdYlGn_r', origin='lower')
ax4.set_xticks(range(len(pivot.columns)))
ax4.set_xticklabels([f'{x:.1f}' for x in pivot.columns], fontsize=9)
ax4.set_yticks(range(len(pivot.index)))
ax4.set_yticks(range(0, len(pivot.index), 2))
ax4.set_yticklabels([pivot.index[i] for i in range(0, len(pivot.index), 2)], fontsize=9)
ax4.set_xlabel('ρ', fontsize=12)
ax4.set_ylabel('N', fontsize=12)
ax4.set_title('Error Heatmap: log₁₀(error)', fontsize=13, fontweight='bold')
cbar = plt.colorbar(im, ax=ax4)
cbar.set_label('log₁₀(error)', fontsize=10)

# Plot 5: Statistical summary
ax5 = fig.add_subplot(gs[2, 2])
ax5.axis('off')

# Calculate statistics
if len(slopes) > 0:
    slope_mean = np.mean(slopes)
    slope_std = np.std(slopes)
    slope_cv = (slope_std / abs(slope_mean)) * 100 if slope_mean != 0 else np.inf

    summary_text = f"""
    STATISTICAL ANALYSIS
    {'='*35}

    Convergence Rate (slopes):
      Mean:  {slope_mean:.3f}
      Std:   {slope_std:.3f}
      CV:    {slope_cv:.1f}%
      Range: [{min(slopes):.3f}, {max(slopes):.3f}]

    """

    # Determine if convergence is rho-independent
    if slope_cv < 15:  # Less than 15% coefficient of variation
        conclusion = "✅ CONVERGENCE IS ρ-INDEPENDENT"
        explanation = """
        The convergence rates are nearly
        constant across all ρ values.

        IMPLICATION:
        → Same N works for all ρ
        → CAN use polynomial approximation
        → Fix N, then fit E0(ρ) as polynomial
        → Get O(1) evaluation!
        """
        color = 'green'
    else:
        conclusion = "❌ CONVERGENCE IS ρ-DEPENDENT"
        explanation = """
        Convergence rates vary significantly
        with ρ.

        IMPLICATION:
        → Different ρ needs different N
        → Polynomial approximation complex
        → Need adaptive N(ρ) strategy
        """
        color = 'red'

    summary_text += f"\n    {conclusion}\n"
    summary_text += explanation

    ax5.text(0.05, 0.95, summary_text, transform=ax5.transAxes,
             fontsize=10, verticalalignment='top', fontfamily='monospace',
             bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.3))

plt.suptitle('Quadrature Convergence Analysis for Channel Coding Error Exponent E0(ρ)',
             fontsize=16, fontweight='bold', y=0.995)

plt.savefig('rho_convergence_analysis.png', dpi=150, bbox_inches='tight')
print("Plot saved to: rho_convergence_analysis.png")
print()

# Print detailed analysis
print("DETAILED ANALYSIS")
print("="*80)
print()

if len(slopes) > 0:
    print("Convergence rates (power law exponent) for each ρ:")
    print("-"*50)
    for rho, slope in zip(rho_vals, slopes):
        print(f"  ρ = {rho:.1f}:  slope = {slope:.3f}  (error ∝ N^{slope:.2f})")
    print()

    print(f"Statistics:")
    print(f"  Mean slope: {slope_mean:.3f}")
    print(f"  Std dev:    {slope_std:.3f}")
    print(f"  CV:         {slope_cv:.1f}%")
    print()

    if slope_cv < 15:
        print("✅ CONCLUSION: Convergence is ρ-INDEPENDENT")
        print()
        print("The coefficient of variation is < 15%, indicating that")
        print("convergence rates are nearly constant across all ρ values.")
        print()
        print("PRACTICAL IMPLICATIONS:")
        print("  1. Can choose fixed N based on desired accuracy")
        print("  2. Once N is fixed, E0(ρ) is just a function of ρ")
        print("  3. Can fit polynomial: E0(ρ) ≈ Σ cᵢ ρⁱ")
        print("  4. Evaluation becomes O(1) - just polynomial evaluation!")
        print()
        print("RECOMMENDED STRATEGY:")
        print("  Step 1: Choose N for desired accuracy (e.g., N=15 for ε<10⁻¹⁰)")
        print("  Step 2: Compute E0(ρ) at many ρ values with fixed N=15")
        print("  Step 3: Fit polynomial of degree ~10-20 in ρ")
        print("  Step 4: Store polynomial coefficients")
        print("  Step 5: At runtime, just evaluate polynomial!")
        print()
        print("This is EXACTLY the strategy we discussed for the simple integral!")
    else:
        print("❌ CONCLUSION: Convergence is ρ-DEPENDENT")
        print()
        print(f"The coefficient of variation is {slope_cv:.1f}%, indicating")
        print("significant variation in convergence rates across ρ values.")
        print()
        print("PRACTICAL IMPLICATIONS:")
        print("  1. Cannot use single fixed N for all ρ")
        print("  2. Need adaptive strategy:")
        print("     - Option A: Use piecewise polynomials with different N per region")
        print("     - Option B: Use conservative (high) N for all ρ")
        print("     - Option C: Create lookup table N(ρ)")
        print()
        print("The polynomial approximation approach is more complex but still feasible.")

print()
print("="*80)
print("DATA SAVED TO: rho_convergence_results.csv")
print("PLOT SAVED TO: rho_convergence_analysis.png")
print("="*80)
