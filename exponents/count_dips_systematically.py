#!/usr/bin/env python3
"""
Systematically count how many N values have local minima (dips) at each ρ
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# Read both 2-PSK and 32-PAM for comparison
df_2psk = pd.read_csv('convergence_2-PSK.csv')
df_32pam = pd.read_csv('convergence_32-PAM.csv')

def find_dips_along_rho(df):
    """
    For each N, find ρ values where error has a local minimum
    Returns: dict mapping N -> list of ρ values where dips occur
    """
    N_cols = [col for col in df.columns if col.startswith('error_N')]
    N_values = [int(col.replace('error_N', '')) for col in N_cols]

    dips_by_N = {}

    for N_col, N in zip(N_cols, N_values):
        errors = df[N_col].values
        dip_indices = []

        # Find local minima (interior points only)
        for i in range(1, len(errors) - 1):
            if errors[i] > 0:  # Skip zero errors
                # Check if local minimum
                if errors[i] < errors[i-1] and errors[i] < errors[i+1]:
                    dip_indices.append(i)

        # Get ρ values at dip locations
        dip_rhos = [df['rho'].iloc[i] for i in dip_indices]
        dips_by_N[N] = dip_rhos

    return dips_by_N

def find_dips_along_N(df):
    """
    For each ρ, find N values where error has a local minimum
    Returns: dict mapping ρ -> list of N values where dips occur
    """
    N_cols = [col for col in df.columns if col.startswith('error_N')]
    N_values = [int(col.replace('error_N', '')) for col in N_cols]

    dips_by_rho = {}

    for i, rho in enumerate(df['rho']):
        errors_at_rho = [df.loc[i, col] for col in N_cols]
        dip_N_indices = []

        # Find local minima along N axis
        for j in range(1, len(errors_at_rho) - 1):
            if errors_at_rho[j] > 0:
                # Check if local minimum
                if errors_at_rho[j] < errors_at_rho[j-1] and errors_at_rho[j] < errors_at_rho[j+1]:
                    dip_N_indices.append(j)

        # Get N values at dip locations
        dip_Ns = [N_values[j] for j in dip_N_indices]
        dips_by_rho[rho] = dip_Ns

    return dips_by_rho

print("="*80)
print("SYSTEMATIC DIP COUNTING")
print("="*80)
print()

# Analyze 2-PSK
print("2-PSK (CV=36.1%, ρ-dependent):")
print("="*80)
print()

dips_by_N_2psk = find_dips_along_rho(df_2psk)
dips_by_rho_2psk = find_dips_along_N(df_2psk)

print("VERTICAL ANALYSIS: For each N, where do dips occur along ρ?")
print("-" * 60)
for N in sorted(dips_by_N_2psk.keys()):
    dip_rhos = dips_by_N_2psk[N]
    if len(dip_rhos) > 0:
        print(f"  N={N:2d}: dips at ρ = {dip_rhos}")
    else:
        print(f"  N={N:2d}: no dips (monotonic)")

print()
print("HORIZONTAL ANALYSIS: For each ρ, which N values dip?")
print("-" * 60)
for rho in sorted(dips_by_rho_2psk.keys()):
    dip_Ns = dips_by_rho_2psk[rho]
    if len(dip_Ns) > 0:
        print(f"  ρ={rho:.1f}: {len(dip_Ns)} N values dip → N = {dip_Ns}")
    else:
        print(f"  ρ={rho:.1f}: 0 N values dip (all monotonic)")

print()
print("="*80)
print()

# Analyze 32-PAM
print("32-PAM (CV=9.3%, ρ-independent):")
print("="*80)
print()

dips_by_N_32pam = find_dips_along_rho(df_32pam)
dips_by_rho_32pam = find_dips_along_N(df_32pam)

print("VERTICAL ANALYSIS: For each N, where do dips occur along ρ?")
print("-" * 60)
for N in sorted(dips_by_N_32pam.keys()):
    dip_rhos = dips_by_N_32pam[N]
    if len(dip_rhos) > 0:
        print(f"  N={N:2d}: dips at ρ = {dip_rhos}")
    else:
        print(f"  N={N:2d}: no dips (monotonic)")

print()
print("HORIZONTAL ANALYSIS: For each ρ, which N values dip?")
print("-" * 60)
for rho in sorted(dips_by_rho_32pam.keys()):
    dip_Ns = dips_by_rho_32pam[rho]
    if len(dip_Ns) > 0:
        print(f"  ρ={rho:.1f}: {len(dip_Ns)} N values dip → N = {dip_Ns}")
    else:
        print(f"  ρ={rho:.1f}: 0 N values dip (all monotonic)")

print()
print("="*80)
print("SUMMARY STATISTICS")
print("="*80)
print()

# Count total dips
total_dips_2psk = sum(len(dips) for dips in dips_by_N_2psk.values())
total_dips_32pam = sum(len(dips) for dips in dips_by_N_32pam.values())

print("2-PSK:")
print(f"  Total dip events: {total_dips_2psk}")
print(f"  N values with dips: {sum(1 for dips in dips_by_N_2psk.values() if len(dips) > 0)}/13")
print()

# Check if dips are clustered at specific ρ
rho_with_multiple_dips_2psk = sum(1 for dips in dips_by_rho_2psk.values() if len(dips) > 1)
print(f"  ρ values where MULTIPLE N dip: {rho_with_multiple_dips_2psk}/10")

print()
print("32-PAM:")
print(f"  Total dip events: {total_dips_32pam}")
print(f"  N values with dips: {sum(1 for dips in dips_by_N_32pam.values() if len(dips) > 0)}/13")
print()

rho_with_multiple_dips_32pam = sum(1 for dips in dips_by_rho_32pam.values() if len(dips) > 1)
print(f"  ρ values where MULTIPLE N dip: {rho_with_multiple_dips_32pam}/10")

print()
print("="*80)
print("ANSWER TO YOUR QUESTION")
print("="*80)
print()

# Calculate subset sizes at each ρ
subset_sizes_2psk = [len(dips) for dips in dips_by_rho_2psk.values()]
subset_sizes_32pam = [len(dips) for dips in dips_by_rho_32pam.values()]

print("2-PSK: Subset sizes (how many N dip at each ρ):")
print(f"  Range: {min(subset_sizes_2psk)} to {max(subset_sizes_2psk)}")
print(f"  Average: {np.mean(subset_sizes_2psk):.1f}")
print(f"  Distribution: {subset_sizes_2psk}")

if max(subset_sizes_2psk) == 1:
    print("  → Typically SINGLE N values dip (isolated dips)")
else:
    print(f"  → Up to {max(subset_sizes_2psk)} N values dip together (subset dips)")

print()
print("32-PAM: Subset sizes (how many N dip at each ρ):")
print(f"  Range: {min(subset_sizes_32pam)} to {max(subset_sizes_32pam)}")
print(f"  Average: {np.mean(subset_sizes_32pam):.1f}")
print(f"  Distribution: {subset_sizes_32pam}")

if max(subset_sizes_32pam) == 1:
    print("  → Typically SINGLE N values dip (isolated dips)")
else:
    print(f"  → Up to {max(subset_sizes_32pam)} N values dip together (subset dips)")

# Create visualization
fig, axes = plt.subplots(1, 2, figsize=(16, 6))

# Plot 1: Dip count matrix for 2-PSK
ax1 = axes[0]
N_values = sorted(dips_by_N_2psk.keys())
rho_values = sorted(dips_by_rho_2psk.keys())

dip_matrix_2psk = np.zeros((len(N_values), len(rho_values)))
for i, N in enumerate(N_values):
    for j, rho in enumerate(rho_values):
        if rho in dips_by_N_2psk[N]:
            dip_matrix_2psk[i, j] = 1

im1 = ax1.imshow(dip_matrix_2psk, aspect='auto', cmap='RdYlGn', vmin=0, vmax=1)
ax1.set_xlabel('ρ index', fontsize=12)
ax1.set_ylabel('N', fontsize=12)
ax1.set_title('2-PSK: Dip Locations (white=dip, dark=no dip)', fontsize=13, fontweight='bold')
ax1.set_yticks(range(len(N_values)))
ax1.set_yticklabels(N_values)
ax1.set_xticks(range(len(rho_values)))
ax1.set_xticklabels([f'{r:.1f}' for r in rho_values], rotation=45)

# Add column sums (how many N dip at each ρ)
for j, rho in enumerate(rho_values):
    count = int(dip_matrix_2psk[:, j].sum())
    ax1.text(j, len(N_values), f'{count}', ha='center', va='top', fontsize=10, fontweight='bold')

# Plot 2: Dip count matrix for 32-PAM
ax2 = axes[1]

dip_matrix_32pam = np.zeros((len(N_values), len(rho_values)))
for i, N in enumerate(N_values):
    for j, rho in enumerate(rho_values):
        if rho in dips_by_N_32pam[N]:
            dip_matrix_32pam[i, j] = 1

im2 = ax2.imshow(dip_matrix_32pam, aspect='auto', cmap='RdYlGn', vmin=0, vmax=1)
ax2.set_xlabel('ρ index', fontsize=12)
ax2.set_ylabel('N', fontsize=12)
ax2.set_title('32-PAM: Dip Locations (white=dip, dark=no dip)', fontsize=13, fontweight='bold')
ax2.set_yticks(range(len(N_values)))
ax2.set_yticklabels(N_values)
ax2.set_xticks(range(len(rho_values)))
ax2.set_xticklabels([f'{r:.1f}' for r in rho_values], rotation=45)

# Add column sums
for j, rho in enumerate(rho_values):
    count = int(dip_matrix_32pam[:, j].sum())
    ax2.text(j, len(N_values), f'{count}', ha='center', va='top', fontsize=10, fontweight='bold')

plt.tight_layout()
plt.savefig('dip_locations_matrix.png', dpi=150, bbox_inches='tight')
print()
print("Visualization saved to: dip_locations_matrix.png")
