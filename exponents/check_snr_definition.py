#!/usr/bin/env python3
"""
Check different SNR definitions for AWGN channel.

Common definitions:
1. Y = √SNR · X + Z,  Z ~ N(0,1)         → Signal power = SNR, noise power = 1
2. Y = X + Z,         Z ~ N(0,σ²)        → SNR = Es/σ² where Es = E[X²]
3. Y = X + Z,         Z ~ N(0, N₀/2)     → SNR = Es/(N₀/2)

For 2-PAM with X ∈ {-1,+1}: Es = 1
If SNR = 3:
  - Definition 1: σ² = 1
  - Definition 2: σ² = 1/3
  - Definition 3: N₀/2 = 1/3
"""

import numpy as np
from scipy.special import roots_hermite
from scipy.integrate import quad

rho = 1.0
SNR_value = 3.0

print("="*90)
print("TESTING DIFFERENT SNR DEFINITIONS")
print("="*90)
print(f"ρ = {rho}, SNR value = {SNR_value}")
print()

# ==============================================================================
# Definition 1: Y = √SNR · X + Z,  Z ~ N(0,1)
# ==============================================================================

print("DEFINITION 1: Y = √SNR · X + Z,  Z ~ N(0,1)")
print("-" * 60)
print(f"Signal power: SNR · E[X²] = {SNR_value} · 1 = {SNR_value}")
print(f"Noise power:  1")
print(f"Power ratio:  {SNR_value} (matches SNR value)")
print()

def compute_e0_def1(rho, SNR, N=50):
    """Y = √SNR · X + Z, Z ~ N(0,1)"""
    nodes, weights = roots_hermite(N)

    I_total = 0
    for x in [-1, +1]:
        I_x = 0
        for t, w in zip(nodes, weights):
            z = np.sqrt(2) * t
            inner = 0
            for x_bar in [-1, +1]:
                delta = -(z + np.sqrt(SNR) * (x - x_bar))**2 + z**2
                inner += 0.5 * np.exp(delta / (2 * (1 + rho)))
            I_x += w * inner**rho
        I_total += 0.5 * I_x

    I_total /= np.sqrt(np.pi)
    return -np.log2(I_total)

E0_def1 = compute_e0_def1(rho, SNR_value)
print(f"E₀ = {E0_def1:.10f}")
print()

# ==============================================================================
# Definition 2: Y = X + Z,  Z ~ N(0, 1/SNR)
# ==============================================================================

print("DEFINITION 2: Y = X + Z,  Z ~ N(0, 1/SNR)")
print("-" * 60)
noise_var = 1 / SNR_value
print(f"Signal power: E[X²] = 1")
print(f"Noise power:  σ² = 1/SNR = {noise_var:.6f}")
print(f"Power ratio:  1/{noise_var:.6f} = {SNR_value} (matches SNR value)")
print()

def compute_e0_def2(rho, SNR, N=50):
    """Y = X + Z, Z ~ N(0, 1/SNR)"""
    sigma_sq = 1 / SNR
    nodes, weights = roots_hermite(N)

    I_total = 0
    for x in [-1, +1]:
        I_x = 0
        for t, w in zip(nodes, weights):
            # Transform: z ~ N(0, σ²) = σ · N(0,1)
            # So z = σ · √2 · t for GH weight e^(-t²)
            z = np.sqrt(sigma_sq) * np.sqrt(2) * t

            inner = 0
            for x_bar in [-1, +1]:
                # W(y|x̄)/W(y|x) = exp([-(y-x̄)² + (y-x)²]/(2σ²))
                # With y = x + z: = exp([-(x+z-x̄)² + z²]/(2σ²))
                #                 = exp([-(z + (x-x̄))² + z²]/(2σ²))
                delta = -(z + (x - x_bar))**2 + z**2
                inner += 0.5 * np.exp(delta / (2 * sigma_sq * (1 + rho)))
            I_x += w * inner**rho
        I_total += 0.5 * I_x

    I_total /= np.sqrt(np.pi)
    return -np.log2(I_total)

E0_def2 = compute_e0_def2(rho, SNR_value)
print(f"E₀ = {E0_def2:.10f}")
print()

# ==============================================================================
# Definition 3: Y = a·X + Z,  Z ~ N(0,1), where a = √SNR
# But X ∈ {-1,+1} NOT normalized
# ==============================================================================

print("DEFINITION 3: Y = a·X + Z,  Z ~ N(0,1), a chosen for SNR")
print("-" * 60)
# For SNR = a² · E[X²] / 1 = a² · 1 = a²
# So a = √SNR
a = np.sqrt(SNR_value)
print(f"Amplitude: a = √SNR = {a:.6f}")
print(f"Signal power: a² · E[X²] = {a**2}")
print(f"Noise power:  1")
print(f"Power ratio:  {a**2} (matches SNR value)")
print(f"This is same as Definition 1!")
print()

# ==============================================================================
# Try different ρ values to see which gives E₀ ≈ 0.92990
# ==============================================================================

print("="*90)
print("SEARCH: Which (SNR_def, ρ) gives E₀ ≈ 0.92990?")
print("="*90)
print()

target = 0.92990

print("Testing Definition 1 (Y = √SNR·X + Z) with different ρ:")
for rho_test in [0.5, 0.6, 0.7, 0.8, 0.9, 1.0]:
    E0 = compute_e0_def1(rho_test, SNR_value)
    error = abs(E0 - target)
    match = "✓" if error < 0.001 else ""
    print(f"  ρ = {rho_test:.1f}: E₀ = {E0:.10f}  (error: {error:.6f}) {match}")
print()

print("Testing Definition 2 (Y = X + Z, σ²=1/SNR) with different ρ:")
for rho_test in [0.5, 0.6, 0.7, 0.8, 0.9, 1.0]:
    E0 = compute_e0_def2(rho_test, SNR_value)
    error = abs(E0 - target)
    match = "✓" if error < 0.001 else ""
    print(f"  ρ = {rho_test:.1f}: E₀ = {E0:.10f}  (error: {error:.6f}) {match}")
print()

# ==============================================================================
# Try different SNR values with ρ=1
# ==============================================================================

print("Testing Definition 2 with ρ=1.0, different SNR values:")
for snr_test in [1, 2, 3, 4, 5, 6]:
    E0 = compute_e0_def2(1.0, snr_test)
    error = abs(E0 - target)
    match = "✓" if error < 0.001 else ""
    print(f"  SNR = {snr_test}: E₀ = {E0:.10f}  (error: {error:.6f}) {match}")
print()

# ==============================================================================
# Summary
# ==============================================================================

print("="*90)
print("SUMMARY")
print("="*90)
print()
print("Target: E₀ ≈ 0.92990")
print()
print("Most common definitions:")
print(f"  1. Y = √SNR·X + Z, Z~N(0,1), ρ=1.0:      E₀ = {compute_e0_def1(1.0, 3.0):.5f}")
print(f"  2. Y = X + Z, Z~N(0,1/SNR), ρ=1.0:       E₀ = {compute_e0_def2(1.0, 3.0):.5f}")
print()
print("Need to identify which (definition, ρ, SNR) combination gives 0.92990")
