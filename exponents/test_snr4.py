#!/usr/bin/env python3
"""
Test E₀ computation with SNR = 4
"""

import numpy as np
from scipy.special import roots_hermite
import time

def compute_E0_2PAM(rho, SNR, N=50):
    """
    Compute E₀(ρ) for 2-PAM AWGN channel.

    Parameters:
    -----------
    rho : float
        Gallager parameter
    SNR : float
        Signal-to-noise ratio (linear)
    N : int
        Number of Gauss-Hermite nodes

    Returns:
    --------
    E0 : float
        Error exponent (bits)
    """
    # Apply factor-of-2 correction for standard AWGN definition
    SNR_eff = 2.0 * SNR
    sigma_sq = 1.0 / SNR_eff

    nodes, weights = roots_hermite(N)

    I_total = 0.0
    for x in [-1, +1]:
        I_x = 0.0
        for t, w in zip(nodes, weights):
            z = np.sqrt(2 * sigma_sq) * t

            inner = 0.0
            for x_bar in [-1, +1]:
                delta = -(z + x - x_bar)**2 + z**2
                inner += 0.5 * np.exp(delta / (2 * sigma_sq * (1 + rho)))

            I_x += w * inner**rho

        I_total += 0.5 * I_x

    I_total /= np.sqrt(np.pi)
    return -np.log2(I_total)

# ==============================================================================
# Test with SNR = 4
# ==============================================================================

print("="*80)
print("E₀ COMPUTATION FOR SNR = 4")
print("="*80)
print()

rho = 1.0
SNR = 4.0

print(f"Parameters:")
print(f"  ρ   = {rho}")
print(f"  SNR = {SNR} (linear) = {10*np.log10(SNR):.2f} dB")
print(f"  SNR_effective = 2 × {SNR} = {2*SNR}")
print()

# Compute with different N values
print(f"{'N':<8} {'E₀':<20} {'Time (μs)':<12}")
print("-"*50)

results = []
for N in [10, 20, 30, 40, 50, 80]:
    start = time.perf_counter()
    E0 = compute_E0_2PAM(rho, SNR, N)
    elapsed = (time.perf_counter() - start) * 1e6
    results.append((N, E0, elapsed))
    print(f"{N:<8} {E0:<20.15f} {elapsed:<12.1f}")

print()

# Report final result
E0_final = compute_E0_2PAM(rho, SNR, N=50)
print("="*80)
print("RESULT")
print("="*80)
print()
print(f"E₀(ρ={rho}, SNR={SNR}) = {E0_final:.15f}")
print()
print(f"Rounded to various precisions:")
print(f"  6 decimals:  {E0_final:.6f}")
print(f"  8 decimals:  {E0_final:.8f}")
print(f"  10 decimals: {E0_final:.10f}")
print()

# Compare with SNR = 3
E0_snr3 = compute_E0_2PAM(rho, 3.0, N=50)
print("="*80)
print("COMPARISON WITH SNR = 3")
print("="*80)
print()
print(f"SNR = 3: E₀ = {E0_snr3:.10f}")
print(f"SNR = 4: E₀ = {E0_final:.10f}")
print(f"Increase: ΔE₀ = {E0_final - E0_snr3:.10f}")
print()

# Test convergence
print("="*80)
print("CONVERGENCE CHECK")
print("="*80)
print()
E0_ref = compute_E0_2PAM(rho, SNR, N=100)
print(f"Reference (N=100): E₀ = {E0_ref:.15f}")
print()
print(f"{'N':<8} {'Error vs N=100':<20}")
print("-"*30)
for N, E0, _ in results:
    error = abs(E0 - E0_ref)
    print(f"{N:<8} {error:<20.2e}")
print()

if abs(results[-1][1] - E0_ref) < 1e-10:
    print("✓ Converged to machine precision with N=50")
else:
    print(f"⚠ Not fully converged, error = {abs(results[-1][1] - E0_ref):.2e}")
