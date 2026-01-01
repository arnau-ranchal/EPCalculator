#!/usr/bin/env python3
"""
Analyze dip patterns across different configurations to find the root cause
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import glob
import os

print("="*80)
print("ANALYZING DIP CAUSES ACROSS CONFIGURATIONS")
print("="*80)
print()

# Find all generated CSV files
csv_files = sorted(glob.glob('dips_*.csv'))

if len(csv_files) == 0:
    print("No data files found. Run ./investigate_dip_causes first.")
    exit(1)

print(f"Found {len(csv_files)} configuration files")
print()

def find_dips_in_config(filename):
    """Find all dip locations in a configuration"""
    df = pd.read_csv(filename)

    N_cols = [col for col in df.columns if col.startswith('error_N')]
    N_values = [int(col.replace('error_N', '')) for col in N_cols]

    dips = []  # List of (N, rho) tuples where dips occur

    # Find dips along ρ for each N
    for N_col, N in zip(N_cols, N_values):
        errors = df[N_col].values

        for i in range(1, len(errors) - 1):
            if errors[i] > 0:
                if errors[i] < errors[i-1] and errors[i] < errors[i+1]:
                    rho = df['rho'].iloc[i]
                    dips.append((N, rho))

    return dips, df

# Analyze each configuration
results = []

for csv_file in csv_files:
    # Extract config info from filename
    # Format: dips_M-CONSTELLATION_SNRX.X.csv
    basename = os.path.basename(csv_file)
    config_str = basename.replace('dips_', '').replace('.csv', '')

    parts = config_str.split('_')
    const_part = parts[0]  # e.g., "32-PAM"
    snr_part = parts[1] if len(parts) > 1 else "SNR1.0"  # e.g., "SNR1.0"

    M_const = const_part.split('-')
    M = int(M_const[0])
    constellation = M_const[1]

    SNR = float(snr_part.replace('SNR', ''))

    dips, df = find_dips_in_config(csv_file)

    results.append({
        'filename': csv_file,
        'M': M,
        'constellation': constellation,
        'SNR': SNR,
        'num_dips': len(dips),
        'dips': dips,
        'df': df
    })

    print(f"{config_str}:")
    print(f"  M={M}, Constellation={constellation}, SNR={SNR}")
    print(f"  Number of dips: {len(dips)}")
    if len(dips) > 0:
        print(f"  Dip locations: {dips}")
    print()

# Compare patterns
print("="*80)
print("COMPARING DIP PATTERNS")
print("="*80)
print()

# Group by constellation type
print("By Constellation Type:")
print("-" * 60)

psk_results = [r for r in results if r['constellation'] == 'PSK' and r['SNR'] == 1.0]
pam_results = [r for r in results if r['constellation'] == 'PAM' and r['SNR'] == 1.0]

print(f"\nPSK constellations (SNR=1.0):")
for r in psk_results:
    print(f"  {r['M']}-PSK: {r['num_dips']} dips at {[f'(N={n},ρ={rho:.1f})' for n, rho in r['dips']]}")

print(f"\nPAM constellations (SNR=1.0):")
for r in pam_results:
    print(f"  {r['M']}-PAM: {r['num_dips']} dips at {[f'(N={n},ρ={rho:.1f})' for n, rho in r['dips']]}")

# Group by SNR (for same constellation)
print("\n" + "-" * 60)
print("Effect of SNR (same constellation):")
print("-" * 60)

for const_type in ['PSK', 'PAM']:
    for M_val in set(r['M'] for r in results if r['constellation'] == const_type):
        same_const = [r for r in results if r['M'] == M_val and r['constellation'] == const_type]
        if len(same_const) > 1:
            print(f"\n{M_val}-{const_type}:")
            for r in sorted(same_const, key=lambda x: x['SNR']):
                print(f"  SNR={r['SNR']:.1f}: {r['num_dips']} dips → {[(n, round(rho, 1)) for n, rho in r['dips']]}")

# Check if dip ρ locations correlate with σ_eff = √(1+ρ)
print()
print("="*80)
print("HYPOTHESIS TEST: Do dips correlate with σ_eff = √(1+ρ)?")
print("="*80)
print()

all_dip_rhos = []
for r in results:
    for N, rho in r['dips']:
        all_dip_rhos.append(rho)

if len(all_dip_rhos) > 0:
    print(f"All dip ρ values: {sorted(set(all_dip_rhos))}")
    print()
    print("σ_eff at these ρ values:")
    for rho in sorted(set(all_dip_rhos)):
        sigma_eff = np.sqrt(1 + rho)
        print(f"  ρ={rho:.1f}: σ_eff = {sigma_eff:.4f}")

    # Check if σ_eff values cluster around specific values
    sigma_effs = [np.sqrt(1 + rho) for rho in all_dip_rhos]
    print()
    print(f"σ_eff range: [{min(sigma_effs):.3f}, {max(sigma_effs):.3f}]")
    print(f"σ_eff mean: {np.mean(sigma_effs):.3f}")
    print(f"σ_eff std: {np.std(sigma_effs):.3f}")

# Create comprehensive visualization
fig = plt.figure(figsize=(20, 12))
gs = fig.add_gridspec(3, 3, hspace=0.35, wspace=0.3)

# Plot 1: Dip count by constellation (top left)
ax1 = fig.add_subplot(gs[0, 0])
const_configs = [r for r in results if r['SNR'] == 1.0]
labels = [f"{r['M']}-{r['constellation']}" for r in const_configs]
counts = [r['num_dips'] for r in const_configs]
colors = ['blue' if r['constellation'] == 'PSK' else 'green' for r in const_configs]

ax1.bar(labels, counts, color=colors, alpha=0.7)
ax1.set_xlabel('Configuration', fontsize=11)
ax1.set_ylabel('Number of Dips', fontsize=11)
ax1.set_title('Dip Count by Constellation (SNR=1.0)', fontsize=12, fontweight='bold')
ax1.tick_params(axis='x', rotation=45)
ax1.grid(True, alpha=0.3, axis='y')

# Plot 2: Dip count by SNR (top middle)
ax2 = fig.add_subplot(gs[0, 1])

for const_type in ['PSK', 'PAM']:
    for M_val in [2, 32]:  # Compare 2-PSK and 32-PAM
        same_const = [r for r in results if r['M'] == M_val and r['constellation'] == const_type]
        if len(same_const) > 1:
            SNRs = [r['SNR'] for r in sorted(same_const, key=lambda x: x['SNR'])]
            counts = [r['num_dips'] for r in sorted(same_const, key=lambda x: x['SNR'])]
            marker = 'o' if const_type == 'PSK' else 's'
            ax2.plot(SNRs, counts, marker=marker, markersize=10, linewidth=2,
                    label=f'{M_val}-{const_type}')

ax2.set_xlabel('SNR (linear)', fontsize=11)
ax2.set_ylabel('Number of Dips', fontsize=11)
ax2.set_title('Effect of SNR on Dip Count', fontsize=12, fontweight='bold')
ax2.legend(fontsize=10)
ax2.grid(True, alpha=0.3)

# Plot 3: Dip locations in (N, ρ) space (top right)
ax3 = fig.add_subplot(gs[0, 2])

for r in results:
    if r['SNR'] == 1.0:  # Only SNR=1.0 for clarity
        Ns = [n for n, rho in r['dips']]
        rhos = [rho for n, rho in r['dips']]
        marker = 'o' if r['constellation'] == 'PSK' else 's'
        size = r['M'] * 3  # Size proportional to M
        ax3.scatter(rhos, Ns, s=size, marker=marker, alpha=0.7,
                   label=f"{r['M']}-{r['constellation']}")

ax3.set_xlabel('ρ', fontsize=11)
ax3.set_ylabel('N', fontsize=11)
ax3.set_title('Dip Locations in (N, ρ) Space (SNR=1.0)', fontsize=12, fontweight='bold')
ax3.legend(fontsize=8, ncol=2)
ax3.grid(True, alpha=0.3)

# Plots 4-6: Error heatmaps for selected configurations (middle row)
selected_configs = [
    ('2-PSK', 1.0),
    ('32-PAM', 1.0),
    ('32-PAM', 2.0)
]

for idx, (config_name, snr_val) in enumerate(selected_configs):
    ax = fig.add_subplot(gs[1, idx])

    # Find matching result
    M_val = int(config_name.split('-')[0])
    const_type = config_name.split('-')[1]

    matching = [r for r in results if r['M'] == M_val and r['constellation'] == const_type and r['SNR'] == snr_val]

    if matching:
        r = matching[0]
        df = r['df']

        N_cols = [col for col in df.columns if col.startswith('error_N')]
        error_matrix = df[N_cols].values.T  # Transpose to have N on y-axis

        # Log scale
        error_matrix_log = np.log10(np.where(error_matrix > 0, error_matrix, 1e-16))

        im = ax.imshow(error_matrix_log, aspect='auto', cmap='viridis', interpolation='nearest')
        ax.set_xlabel('ρ index', fontsize=10)
        ax.set_ylabel('N index', fontsize=10)
        ax.set_title(f'{config_name}, SNR={snr_val}', fontsize=11, fontweight='bold')

        # Mark dips
        for N, rho in r['dips']:
            N_idx = [int(col.replace('error_N', '')) for col in N_cols].index(N)
            rho_idx = np.argmin(np.abs(df['rho'].values - rho))
            ax.plot(rho_idx, N_idx, 'r*', markersize=15, markeredgecolor='white', markeredgewidth=1.5)

        plt.colorbar(im, ax=ax, label='log₁₀(error)')

# Plots 7-9: σ_eff analysis (bottom row)
ax7 = fig.add_subplot(gs[2, :])

# Plot σ_eff vs ρ and mark where dips occur
rho_range = np.linspace(0, 1, 100)
sigma_eff_range = np.sqrt(1 + rho_range)

ax7.plot(rho_range, sigma_eff_range, 'b-', linewidth=2, label='σ_eff = √(1+ρ)')

# Mark dip locations
all_dip_data = []
for r in results:
    for N, rho in r['dips']:
        sigma_eff = np.sqrt(1 + rho)
        all_dip_data.append((rho, sigma_eff, r['M'], r['constellation'], r['SNR']))

if all_dip_data:
    dip_rhos = [d[0] for d in all_dip_data]
    dip_sigmas = [d[1] for d in all_dip_data]

    ax7.scatter(dip_rhos, dip_sigmas, s=100, c='red', marker='x', linewidths=3,
               label='Dip locations', zorder=10)

    # Annotate unique ρ values where dips occur
    unique_rhos = sorted(set(dip_rhos))
    for rho in unique_rhos:
        sigma = np.sqrt(1 + rho)
        count = dip_rhos.count(rho)
        ax7.annotate(f'ρ={rho:.1f}\n({count} dips)',
                    xy=(rho, sigma), xytext=(rho, sigma + 0.1),
                    fontsize=9, ha='center',
                    bbox=dict(boxstyle='round', facecolor='yellow', alpha=0.7))

ax7.set_xlabel('ρ', fontsize=12)
ax7.set_ylabel('σ_eff = √(1+ρ)', fontsize=12)
ax7.set_title('Effective Width at Dip Locations', fontsize=13, fontweight='bold')
ax7.legend(fontsize=11)
ax7.grid(True, alpha=0.3)

plt.savefig('dip_cause_analysis.png', dpi=150, bbox_inches='tight')
print()
print("Visualization saved to: dip_cause_analysis.png")
print()

print("="*80)
print("CONCLUSION")
print("="*80)
print()

# Statistical analysis of dip locations
if all_dip_data:
    dip_rhos_all = [d[0] for d in all_dip_data]
    print(f"Total dips found: {len(dip_rhos_all)}")
    print(f"Unique ρ values with dips: {sorted(set(dip_rhos_all))}")
    print(f"Most common dip ρ: {max(set(dip_rhos_all), key=dip_rhos_all.count):.1f} ({dip_rhos_all.count(max(set(dip_rhos_all), key=dip_rhos_all.count))} occurrences)")
    print()

    # Check if constellation type matters
    psk_dips = [d for d in all_dip_data if d[3] == 'PSK']
    pam_dips = [d for d in all_dip_data if d[3] == 'PAM']

    print(f"PSK dips: {len(psk_dips)}")
    print(f"PAM dips: {len(pam_dips)}")
    print()

    # Check if SNR matters
    print("Dips by SNR:")
    for snr in sorted(set(d[4] for d in all_dip_data)):
        snr_dips = [d for d in all_dip_data if d[4] == snr]
        print(f"  SNR={snr:.1f}: {len(snr_dips)} dips")
