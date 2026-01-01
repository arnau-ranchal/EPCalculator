#!/usr/bin/env python3
"""
Verify the relationship between general and simplified formulas.
The hypothesis: They compute the same E₀ but with different SNR conventions.

General formula: noise variance = 1/2 (natural Gaussian)
Simplified formula: noise variance = 1 (standard Gaussian)

For the same physical channel: SNR_general = SNR_simplified / 2
"""

import numpy as np
from scipy.integrate import quad

# Test parameters
rho = 0.73

# Define SNR in my convention (noise variance = 1)
SNR_mine = 1.0

# Convert to general formula convention (noise variance = 1/2)
# For same signal-to-noise ratio: SNR_general = SNR_mine / 2
SNR_general = SNR_mine / 2

print("="*70)
print("VERIFYING SNR CONVERSION BETWEEN FORMULAS")
print("="*70)
print(f"ρ = {rho}")
print(f"SNR (my convention, σ²=1):     {SNR_mine}")
print(f"SNR (general convention, σ²=½): {SNR_general}")
print()

# ==============================================================================
# Simplified formula (my convention)
# ==============================================================================

def integrand_standard(z, rho, SNR):
    """Simplified formula: variance 1, standard Gaussian."""
    exponent = 4 * np.sqrt(SNR) * (z - np.sqrt(SNR)) / (1 + rho)
    exponent = np.clip(exponent, -500, 500)
    h = ((1 + np.exp(exponent)) / 2) ** rho
    return (1 / np.sqrt(2 * np.pi)) * np.exp(-z**2 / 2) * h

I_mine, _ = quad(integrand_standard, -np.inf, np.inf,
                 args=(rho, SNR_mine), limit=500, epsabs=1e-15)
E0_mine = -np.log2(I_mine)

print(f"Simplified formula (σ²=1, SNR={SNR_mine}):")
print(f"  I = {I_mine:.15f}")
print(f"  E₀ = {E0_mine:.15f}")
print()

# ==============================================================================
# General formula (natural Gaussian convention)
# ==============================================================================

def integrand_general_x_plus1(z, rho, SNR):
    """General formula for x=+1, variance 1/2."""
    exponent = -(4 * z * np.sqrt(SNR) + 4 * SNR) / (1 + rho)
    exponent = np.clip(exponent, -500, 500)
    h = ((1 + np.exp(exponent)) / 2) ** rho
    return (1 / np.sqrt(np.pi)) * np.exp(-z**2) * h

def integrand_general_x_minus1(z, rho, SNR):
    """General formula for x=-1, variance 1/2."""
    exponent = (4 * z * np.sqrt(SNR) - 4 * SNR) / (1 + rho)
    exponent = np.clip(exponent, -500, 500)
    h = ((1 + np.exp(exponent)) / 2) ** rho
    return (1 / np.sqrt(np.pi)) * np.exp(-z**2) * h

I_gen_plus1, _ = quad(integrand_general_x_plus1, -np.inf, np.inf,
                      args=(rho, SNR_general), limit=500, epsabs=1e-15)
I_gen_minus1, _ = quad(integrand_general_x_minus1, -np.inf, np.inf,
                       args=(rho, SNR_general), limit=500, epsabs=1e-15)
I_gen_total = (1/2) * (I_gen_plus1 + I_gen_minus1)
E0_general = -np.log2(I_gen_total)

print(f"General formula (σ²=½, SNR={SNR_general}):")
print(f"  I (x=+1) = {I_gen_plus1:.15f}")
print(f"  I (x=-1) = {I_gen_minus1:.15f}")
print(f"  I (total) = {I_gen_total:.15f}")
print(f"  E₀ = {E0_general:.15f}")
print()

# ==============================================================================
# Comparison
# ==============================================================================

print("="*70)
print("COMPARISON")
print("="*70)
print(f"E₀ difference: {abs(E0_mine - E0_general):.2e}")
print()

if abs(E0_mine - E0_general) < 1e-10:
    print("✓ SUCCESS: Formulas match when accounting for SNR convention!")
    print()
    print("Conclusion: The formulas compute the same quantity but use")
    print("different noise variance conventions:")
    print("  - General formula: σ² = 1/2 (natural Gaussian)")
    print("  - Simplified formula: σ² = 1 (standard Gaussian)")
    print("  - Conversion: SNR_general = SNR_simplified / 2")
else:
    print(f"✗ Formulas still differ by {abs(E0_mine - E0_general):.2e}")
    print()
    print("This suggests they may be computing different quantities,")
    print("or there's another factor beyond the noise variance convention.")

print()

# ==============================================================================
# Test with original SNR=1 in both conventions (for reference)
# ==============================================================================

print("="*70)
print("REFERENCE: SNR=1 in BOTH conventions (different physical channels)")
print("="*70)

I_mine_snr1, _ = quad(integrand_standard, -np.inf, np.inf,
                      args=(rho, 1.0), limit=500, epsabs=1e-15)
E0_mine_snr1 = -np.log2(I_mine_snr1)

I_gen_p1, _ = quad(integrand_general_x_plus1, -np.inf, np.inf,
                   args=(rho, 1.0), limit=500, epsabs=1e-15)
I_gen_m1, _ = quad(integrand_general_x_minus1, -np.inf, np.inf,
                   args=(rho, 1.0), limit=500, epsabs=1e-15)
I_gen_tot = (1/2) * (I_gen_p1 + I_gen_m1)
E0_gen_snr1 = -np.log2(I_gen_tot)

print(f"Simplified (SNR=1, σ²=1):   E₀ = {E0_mine_snr1:.15f}")
print(f"General (SNR=1, σ²=½):      E₀ = {E0_gen_snr1:.15f}")
print(f"Difference: {abs(E0_mine_snr1 - E0_gen_snr1):.2e}")
print()
print("These should differ because they represent different physical channels.")
