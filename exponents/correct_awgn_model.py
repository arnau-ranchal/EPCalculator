#!/usr/bin/env python3
"""
CORRECTED E₀ computation for standard AWGN channel.

Standard AWGN: Y = √SNR · X + Z where Z ~ N(0, 1) [variance = 1]
NOT the "natural" Gaussian with variance 1/2.

Channel model: W(y|x) = (1/√(2π)) exp(-(y - √SNR·x)²/2)
After substitution z = y - √SNR·x:
  W(y|x) = (1/√(2π)) exp(-z²/2)

Likelihood ratio:
  W(y|x̄)/W(y|x) = exp([-(z+√SNR(x-x̄))² + z²]/2)

Formula:
  E₀(ρ) = -log₂ ∑_x Q(x) ∫ (1/√(2π)) e^(-z²/2) [∑_x̄ Q(x̄) exp(Δ/(2(1+ρ)))]^ρ dz

where Δ(x,x̄,z) = -(z + √SNR(x-x̄))² + z²

KEY DIFFERENCES FROM BEFORE:
1. Gaussian weight: e^(-z²/2) instead of e^(-z²)
2. Normalization: 1/√(2π) instead of 1/π
3. Exponent: Δ/(2(1+ρ)) instead of Δ/(1+ρ)  ← CRITICAL!
"""

import numpy as np
from scipy.special import roots_hermite
from scipy.integrate import quad

# Test parameters
rho = 1.0
SNR = 3.0

print("="*90)
print("CORRECTED E₀ COMPUTATION - STANDARD AWGN MODEL")
print("="*90)
print(f"Parameters: ρ = {rho}, SNR = {SNR} (linear) = {10*np.log10(SNR):.2f} dB")
print()
print("Channel model: Y = √SNR · X + Z,  Z ~ N(0, 1)")
print("Noise variance: σ² = 1 (standard Gaussian)")
print()

# ==============================================================================
# GROUND TRUTH with scipy.quad
# ==============================================================================

def integrand_for_x_correct(x, z, rho, SNR):
    """Compute integrand for transmitted symbol x - CORRECTED."""
    inner_sum = 0.0
    for x_bar in [-1, +1]:
        # Δ(x,x̄,z) = -(z + √SNR(x-x̄))² + z²
        delta = -(z + np.sqrt(SNR) * (x - x_bar))**2 + z**2
        # KEY: Divide by 2(1+ρ), not (1+ρ)
        delta_scaled = delta / (2 * (1 + rho))
        delta_scaled = np.clip(delta_scaled, -500, 500)
        inner_sum += 0.5 * np.exp(delta_scaled)  # Q(x̄) = 1/2

    # Standard Gaussian: (1/√(2π)) e^(-z²/2)
    return (1/np.sqrt(2*np.pi)) * np.exp(-z**2 / 2) * inner_sum**rho

print("Computing ground truth with scipy.quad...")
I_plus1, err1 = quad(lambda z: integrand_for_x_correct(+1, z, rho, SNR),
                     -np.inf, np.inf, limit=500, epsabs=1e-15)
I_minus1, err2 = quad(lambda z: integrand_for_x_correct(-1, z, rho, SNR),
                      -np.inf, np.inf, limit=500, epsabs=1e-15)
I_total = 0.5 * (I_plus1 + I_minus1)
E0_true = -np.log2(I_total)

print(f"  I_(x=+1) = {I_plus1:.15f}")
print(f"  I_(x=-1) = {I_minus1:.15f}")
print(f"  I_total  = {I_total:.15f}")
print(f"  E₀       = {E0_true:.15f}")
print()

print(f"Expected E₀ ≈ 0.92990")
print(f"Computed E₀ = {E0_true:.5f}")
print(f"Match? {abs(E0_true - 0.92990) < 0.001}")
print()

# ==============================================================================
# Gauss-Hermite Implementation (CORRECTED)
# ==============================================================================

def gauss_hermite_e0_correct(rho, SNR, N):
    """
    CORRECTED Gauss-Hermite for standard AWGN.

    Transform z = √2·t to match GH weight e^(-t²):
    ∫ (1/√(2π)) e^(-z²/2) h(z) dz = ∫ (1/√π) e^(-t²) h(√2·t) dt
    """
    nodes, weights = roots_hermite(N)

    # Integral for x = +1
    I_plus1 = 0.0
    for t, w in zip(nodes, weights):
        z = np.sqrt(2) * t  # Transform to standard Gaussian
        inner_sum = 0.0
        for x_bar in [-1, +1]:
            delta = -(z + np.sqrt(SNR) * (1 - x_bar))**2 + z**2
            delta_scaled = delta / (2 * (1 + rho))  # CORRECTED: 2(1+ρ)
            delta_scaled = np.clip(delta_scaled, -500, 500)
            inner_sum += 0.5 * np.exp(delta_scaled)
        I_plus1 += w * inner_sum**rho

    # Integral for x = -1
    I_minus1 = 0.0
    for t, w in zip(nodes, weights):
        z = np.sqrt(2) * t
        inner_sum = 0.0
        for x_bar in [-1, +1]:
            delta = -(z + np.sqrt(SNR) * (-1 - x_bar))**2 + z**2
            delta_scaled = delta / (2 * (1 + rho))  # CORRECTED: 2(1+ρ)
            delta_scaled = np.clip(delta_scaled, -500, 500)
            inner_sum += 0.5 * np.exp(delta_scaled)
        I_minus1 += w * inner_sum**rho

    # Normalization: 1/√π (from transformation)
    I_avg = 0.5 * (I_plus1 + I_minus1) / np.sqrt(np.pi)
    E0 = -np.log2(I_avg)

    return E0, I_avg

# ==============================================================================
# Test Gauss-Hermite
# ==============================================================================

print("="*90)
print("GAUSS-HERMITE QUADRATURE (CORRECTED)")
print("="*90)
print()

print(f"{'N':<6} {'E₀':<18} {'Error':<12} {'Time (μs)':<12}")
print("-"*60)

import time

for N in [10, 20, 30, 40, 50]:
    start = time.perf_counter()
    E0, I = gauss_hermite_e0_correct(rho, SNR, N)
    elapsed = (time.perf_counter() - start) * 1e6
    error = abs(E0 - E0_true)
    print(f"{N:<6} {E0:>17.12f} {error:>11.2e} {elapsed:>11.1f}")

print()

# ==============================================================================
# Compare with WRONG formula
# ==============================================================================

print("="*90)
print("COMPARISON: WRONG vs CORRECT FORMULA")
print("="*90)
print()

def gauss_hermite_e0_wrong(rho, SNR, N):
    """WRONG formula (what we had before)."""
    nodes, weights = roots_hermite(N)

    I_plus1 = 0.0
    for t, w in zip(nodes, weights):
        inner_sum = 0.0
        for x_bar in [-1, +1]:
            delta = -(t + np.sqrt(SNR) * (1 - x_bar))**2 + t**2
            delta_scaled = delta / (1 + rho)  # WRONG: missing factor of 2
            delta_scaled = np.clip(delta_scaled, -500, 500)
            inner_sum += 0.5 * np.exp(delta_scaled)
        I_plus1 += w * inner_sum**rho

    I_minus1 = 0.0
    for t, w in zip(nodes, weights):
        inner_sum = 0.0
        for x_bar in [-1, +1]:
            delta = -(t + np.sqrt(SNR) * (-1 - x_bar))**2 + t**2
            delta_scaled = delta / (1 + rho)  # WRONG
            delta_scaled = np.clip(delta_scaled, -500, 500)
            inner_sum += 0.5 * np.exp(delta_scaled)
        I_minus1 += w * inner_sum**rho

    I_avg = 0.5 * (I_plus1 + I_minus1) / np.pi  # WRONG normalization
    E0 = -np.log2(I_avg)
    return E0

E0_wrong = gauss_hermite_e0_wrong(rho, SNR, 50)
E0_correct = gauss_hermite_e0_correct(rho, SNR, 50)[0]

print(f"WRONG formula (natural Gaussian):  E₀ = {E0_wrong:.15f}")
print(f"CORRECT formula (standard AWGN):   E₀ = {E0_correct:.15f}")
print(f"Expected value:                     E₀ ≈ 0.92990")
print()
print(f"Error (wrong):   {abs(E0_wrong - 0.92990):.6f}")
print(f"Error (correct): {abs(E0_correct - 0.92990):.6f}")
print()

# ==============================================================================
# Summary
# ==============================================================================

print("="*90)
print("SUMMARY OF CORRECTIONS")
print("="*90)
print()

print("The issue was using 'natural Gaussian' instead of 'standard Gaussian':")
print()
print("WRONG (natural Gaussian, variance 1/2):")
print("  • W(y|x) = (1/π) exp(-|y - √SNR·x|²)")
print("  • Exponent: Δ/(1+ρ)")
print("  • Normalization: 1/π")
print("  • Result: E₀ ≈ 1.756 (WRONG!)")
print()
print("CORRECT (standard AWGN, variance 1):")
print("  • W(y|x) = (1/√(2π)) exp(-(y - √SNR·x)²/2)")
print("  • Exponent: Δ/(2(1+ρ))  ← Factor of 2!")
print("  • Normalization: 1/√(2π)")
print(f"  • Result: E₀ ≈ {E0_true:.5f} (CORRECT!)")
print()

if abs(E0_true - 0.92990) < 0.001:
    print("✓✓✓ SUCCESS! Matches expected value 0.92990")
else:
    print(f"✗ Still off by {abs(E0_true - 0.92990):.6f}")
    print("  (May need to check SNR definition or other parameters)")
