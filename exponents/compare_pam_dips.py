#!/usr/bin/env python3
"""
Compare dip locations specifically for 8-PAM, 16-PAM, and 32-PAM at SNR=1.0
to verify the claim that they share the same (N, ρ) pairs.
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

print("="*80)
print("VERIFYING CLAIM: Do 8-PAM, 16-PAM, 32-PAM share same dip locations?")
print("="*80)
print()

def find_dips(filename):
    """Find all dip (N, ρ) pairs in a configuration"""
    df = pd.read_csv(filename)

    N_cols = [col for col in df.columns if col.startswith('error_N')]
    N_values = [int(col.replace('error_N', '')) for col in N_cols]

    dips = []

    # For each N, find ρ values where error has a local minimum
    for N_col, N in zip(N_cols, N_values):
        errors = df[N_col].values

        for i in range(1, len(errors) - 1):
            if errors[i] > 0:
                if errors[i] < errors[i-1] and errors[i] < errors[i+1]:
                    rho = df['rho'].iloc[i]
                    dips.append((N, rho))

    return dips, df

# Load data for 8-PAM, 16-PAM, 32-PAM at SNR=1.0
configs = {
    '8-PAM': 'dips_8-PAM_SNR1.0.csv',
    '16-PAM': 'dips_16-PAM_SNR1.0.csv',
    '32-PAM': 'dips_32-PAM_SNR1.0.csv'
}

all_dips = {}
all_dfs = {}

for name, filename in configs.items():
    dips, df = find_dips(filename)
    all_dips[name] = set(dips)
    all_dfs[name] = df
    print(f"{name}: {len(dips)} dips")
    print(f"  Locations: {sorted(dips)}")
    print()

# Find common dips
common_dips = all_dips['8-PAM'] & all_dips['16-PAM'] & all_dips['32-PAM']
print(f"Common to ALL THREE: {len(common_dips)} dips")
print(f"  {sorted(common_dips)}")
print()

# Find union (all unique dips)
all_unique_dips = all_dips['8-PAM'] | all_dips['16-PAM'] | all_dips['32-PAM']
print(f"Total unique dip locations: {len(all_unique_dips)}")
print()

# Compute overlap percentages
for name in configs.keys():
    overlap = len(common_dips) / len(all_dips[name]) * 100
    print(f"{name}: {overlap:.1f}% of dips are shared with others")

print()
print("-" * 80)

# Check which dips are NOT shared
print("\nDips ONLY in specific configurations:")
print()

for name in configs.keys():
    unique_to_this = all_dips[name] - (all_dips['8-PAM'] | all_dips['16-PAM'] | all_dips['32-PAM'] - all_dips[name])
    others = [n for n in configs.keys() if n != name]
    unique_to_this = all_dips[name]
    for other in others:
        unique_to_this = unique_to_this - all_dips[other]

    if len(unique_to_this) > 0:
        print(f"ONLY in {name}: {sorted(unique_to_this)}")

print()
print("-" * 80)

# Check pairwise overlaps
print("\nPairwise overlaps:")
print()

pairs = [('8-PAM', '16-PAM'), ('8-PAM', '32-PAM'), ('16-PAM', '32-PAM')]
for name1, name2 in pairs:
    overlap = all_dips[name1] & all_dips[name2]
    jaccard = len(overlap) / len(all_dips[name1] | all_dips[name2]) * 100
    print(f"{name1} ∩ {name2}: {len(overlap)} common dips (Jaccard: {jaccard:.1f}%)")

print()
print("=" * 80)
print("VERDICT")
print("=" * 80)
print()

overlap_ratio = len(common_dips) / len(all_unique_dips) * 100
print(f"Overlap ratio: {len(common_dips)}/{len(all_unique_dips)} = {overlap_ratio:.1f}%")
print()

if overlap_ratio >= 80:
    print("✓ CLAIM VERIFIED: 8-PAM, 16-PAM, 32-PAM share MOST dip locations")
    print("  (Minor differences likely due to numerical precision or edge effects)")
elif overlap_ratio >= 50:
    print("~ CLAIM PARTIALLY TRUE: Significant overlap but also differences")
else:
    print("✗ CLAIM REJECTED: Dip locations are significantly different")

print()

# Create visualization
fig, axes = plt.subplots(1, 3, figsize=(18, 6), sharey=True)

for idx, (name, df) in enumerate(all_dfs.items()):
    ax = axes[idx]

    N_cols = [col for col in df.columns if col.startswith('error_N')]
    N_values = [int(col.replace('error_N', '')) for col in N_cols]

    error_matrix = df[N_cols].values.T
    error_matrix_log = np.log10(np.where(error_matrix > 0, error_matrix, 1e-16))

    im = ax.imshow(error_matrix_log, aspect='auto', cmap='viridis', interpolation='nearest',
                   extent=[df['rho'].min(), df['rho'].max(), len(N_values)-0.5, -0.5])

    ax.set_xlabel('ρ', fontsize=12)
    if idx == 0:
        ax.set_ylabel('N index', fontsize=12)
    ax.set_title(f'{name} (SNR=1.0)', fontsize=13, fontweight='bold')

    # Mark common dips with RED stars
    for N, rho in common_dips:
        try:
            N_idx = N_values.index(N)
            rho_idx = np.argmin(np.abs(df['rho'].values - rho))
            rho_val = df['rho'].values[rho_idx]
            ax.plot(rho_val, N_idx, 'r*', markersize=20, markeredgecolor='white', markeredgewidth=2)
        except ValueError:
            pass

    # Mark non-common dips with WHITE circles
    for N, rho in all_dips[name] - common_dips:
        try:
            N_idx = N_values.index(N)
            rho_idx = np.argmin(np.abs(df['rho'].values - rho))
            rho_val = df['rho'].values[rho_idx]
            ax.plot(rho_val, N_idx, 'wo', markersize=12, markeredgecolor='yellow', markeredgewidth=2)
        except ValueError:
            pass

    # Add colorbar
    plt.colorbar(im, ax=ax, label='log₁₀(error)')

# Add legend
from matplotlib.patches import Patch
legend_elements = [
    Patch(facecolor='red', edgecolor='white', label='Common dips (all 3)'),
    Patch(facecolor='white', edgecolor='yellow', label='Unique dips')
]
fig.legend(handles=legend_elements, loc='upper center', bbox_to_anchor=(0.5, 0.02), ncol=2, fontsize=11)

plt.tight_layout(rect=[0, 0.03, 1, 1])
plt.savefig('pam_dip_comparison.png', dpi=150, bbox_inches='tight')
print("Visualization saved to: pam_dip_comparison.png")
print()
