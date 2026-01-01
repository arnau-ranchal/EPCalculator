#!/usr/bin/env python3
"""
Verify: Does user mean SNR = 3 dB (not linear)?
"""

import numpy as np
from scipy.special import roots_hermite

def compute_e0(rho, SNR_linear, N=50):
    """Standard AWGN: Y = X + Z, Z ~ N(0, 1/SNR)"""
    sigma_sq = 1 / SNR_linear
    nodes, weights = roots_hermite(N)

    I_total = 0
    for x in [-1, +1]:
        I_x = 0
        for t, w in zip(nodes, weights):
            z = np.sqrt(sigma_sq * 2) * t
            inner = 0
            for x_bar in [-1, +1]:
                delta = -(z + (x - x_bar))**2 + z**2
                inner += 0.5 * np.exp(delta / (2 * sigma_sq * (1 + rho)))
            I_x += w * inner**rho
        I_total += 0.5 * I_x

    I_total /= np.sqrt(np.pi)
    return -np.log2(I_total)

print("="*70)
print("CHECKING SNR UNITS")
print("="*70)
print()

# Test 1: SNR = 3 linear
SNR_linear = 3.0
E0_linear = compute_e0(1.0, SNR_linear)
print(f"SNR = 3 (linear) = {10*np.log10(SNR_linear):.2f} dB")
print(f"  E₀ = {E0_linear:.10f}")
print(f"  Error vs 0.92990: {abs(E0_linear - 0.92990):.6f}")
print()

# Test 2: SNR = 3 dB → linear
SNR_dB = 3.0
SNR_from_dB = 10**(SNR_dB / 10)
E0_from_dB = compute_e0(1.0, SNR_from_dB)
print(f"SNR = 3 dB = {SNR_from_dB:.4f} (linear)")
print(f"  E₀ = {E0_from_dB:.10f}")
print(f"  Error vs 0.92990: {abs(E0_from_dB - 0.92990):.6f}")
print()

# Test 3: Find exact SNR that gives E₀ = 0.92990
print("Finding exact SNR for E₀ = 0.92990...")
from scipy.optimize import brentq

def error_func(snr):
    return compute_e0(1.0, snr) - 0.92990

SNR_exact = brentq(error_func, 5, 7)
E0_exact = compute_e0(1.0, SNR_exact)
SNR_exact_dB = 10 * np.log10(SNR_exact)

print(f"  SNR (linear) = {SNR_exact:.10f}")
print(f"  SNR (dB)     = {SNR_exact_dB:.10f}")
print(f"  E₀           = {E0_exact:.10f}")
print()

print("="*70)
print("CONCLUSION")
print("="*70)
print()

if abs(SNR_from_dB - SNR_exact) < 0.01:
    print("✓ User likely meant SNR = 3 dB")
    print(f"  (which is {SNR_from_dB:.4f} linear)")
elif abs(3.0 - SNR_exact) < 0.01:
    print("✓ User meant SNR = 3 linear")
elif abs(6.0 - SNR_exact) < 0.01:
    print("✓ User meant SNR = 6 linear (or there's a factor of 2)")
else:
    print(f"? SNR = {SNR_exact:.4f} linear = {SNR_exact_dB:.2f} dB")
    print("  (Unclear what user intended)")
