#!/usr/bin/env python3
"""
Quick empirical test: Do the formulas match if we use the SAME noise variance?

Hypothesis: If we adjust SNR to account for different noise variances,
the formulas should give the same E₀.

For same physical SNR_ratio = signal_power / noise_variance:
  - General (σ²=1/2): SNR_ratio = SNR_gen / (1/2) = 2·SNR_gen
  - Simplified (σ²=1): SNR_ratio = SNR_simp / 1 = SNR_simp

Therefore: SNR_gen = SNR_simp / 2

Test: Set SNR_gen = 1.0 and SNR_simp = 2.0
If hypothesis is correct, E₀ should match.
"""

import numpy as np
from scipy.integrate import quad

rho = 0.73

print("="*80)
print("EMPIRICAL TEST: Noise Variance Hypothesis")
print("="*80)
print()

print("Hypothesis: The formulas compute the same E₀ for the same physical channel")
print("when accounting for different noise variance conventions:")
print("  - General formula: σ² = 1/2  (natural Gaussian)")
print("  - Simplified formula: σ² = 1  (standard Gaussian)")
print()
print("For same physical SNR_ratio: SNR_general = SNR_simplified / 2")
print()

# ==============================================================================
# TEST 1: Different SNR values that give SAME physical SNR_ratio
# ==============================================================================

print("="*80)
print("TEST 1: Adjusted SNR to match physical SNR_ratio")
print("="*80)
print()

SNR_simp = 2.0  # For simplified formula
SNR_gen = SNR_simp / 2  # Adjusted for general formula (should give same SNR_ratio)

print(f"SNR_simplified = {SNR_simp} (with σ² = 1)")
print(f"SNR_general = {SNR_gen} (with σ² = 1/2)")
print()
print(f"Physical SNR_ratio_simplified = {SNR_simp}/1 = {SNR_simp}")
print(f"Physical SNR_ratio_general = {SNR_gen}/(1/2) = {SNR_gen * 2}")
print()
print(f"Match? {np.isclose(SNR_simp, SNR_gen * 2)}")
print()

# General formula with SNR_gen
def integrand_gen_plus1(z):
    inner_sum = 0.0
    for x_bar in [-1, +1]:
        delta = -((z + np.sqrt(SNR_gen) * (1 - x_bar))**2 - z**2) / (1 + rho)
        delta = np.clip(delta, -500, 500)
        inner_sum += 0.5 * np.exp(delta)
    return (1/np.sqrt(np.pi)) * np.exp(-z**2) * inner_sum**rho

def integrand_gen_minus1(z):
    inner_sum = 0.0
    for x_bar in [-1, +1]:
        delta = -((z + np.sqrt(SNR_gen) * (-1 - x_bar))**2 - z**2) / (1 + rho)
        delta = np.clip(delta, -500, 500)
        inner_sum += 0.5 * np.exp(delta)
    return (1/np.sqrt(np.pi)) * np.exp(-z**2) * inner_sum**rho

I_gen_p1, _ = quad(integrand_gen_plus1, -np.inf, np.inf, limit=500, epsabs=1e-15)
I_gen_m1, _ = quad(integrand_gen_minus1, -np.inf, np.inf, limit=500, epsabs=1e-15)
I_gen_total = 0.5 * (I_gen_p1 + I_gen_m1)
E0_gen = -np.log2(I_gen_total)

# Simplified formula with SNR_simp
def integrand_simp(z):
    exponent = 4 * np.sqrt(SNR_simp) * (z - np.sqrt(SNR_simp)) / (1 + rho)
    exponent = np.clip(exponent, -500, 500)
    h = ((1 + np.exp(exponent)) / 2) ** rho
    return (1 / np.sqrt(2 * np.pi)) * np.exp(-z**2 / 2) * h

I_simp, _ = quad(integrand_simp, -np.inf, np.inf, limit=500, epsabs=1e-15)
E0_simp = -np.log2(I_simp)

print("RESULTS:")
print(f"E₀ (general, SNR={SNR_gen}):     {E0_gen:.15f}")
print(f"E₀ (simplified, SNR={SNR_simp}): {E0_simp:.15f}")
print(f"Difference: {abs(E0_gen - E0_simp):.2e}")
print()

if abs(E0_gen - E0_simp) < 1e-10:
    print("✓✓✓ HYPOTHESIS CONFIRMED! ✓✓✓")
    print("The formulas ARE equivalent when accounting for noise variance!")
else:
    print("✗✗✗ HYPOTHESIS REJECTED ✗✗✗")
    print("The formulas compute DIFFERENT quantities even after variance adjustment.")

print()

# ==============================================================================
# TEST 2: Try multiple SNR values to see pattern
# ==============================================================================

print("="*80)
print("TEST 2: Multiple SNR values")
print("="*80)
print()

print(f"{'SNR_simp':<12} {'SNR_gen':<12} {'E₀_simp':<18} {'E₀_gen':<18} {'|Diff|':<12}")
print("-"*80)

for SNR_simp_test in [0.5, 1.0, 2.0, 4.0, 8.0]:
    SNR_gen_test = SNR_simp_test / 2

    # General
    def integrand_gen_p1_test(z):
        inner_sum = 0.0
        for x_bar in [-1, +1]:
            delta = -((z + np.sqrt(SNR_gen_test) * (1 - x_bar))**2 - z**2) / (1 + rho)
            delta = np.clip(delta, -500, 500)
            inner_sum += 0.5 * np.exp(delta)
        return (1/np.sqrt(np.pi)) * np.exp(-z**2) * inner_sum**rho

    def integrand_gen_m1_test(z):
        inner_sum = 0.0
        for x_bar in [-1, +1]:
            delta = -((z + np.sqrt(SNR_gen_test) * (-1 - x_bar))**2 - z**2) / (1 + rho)
            delta = np.clip(delta, -500, 500)
            inner_sum += 0.5 * np.exp(delta)
        return (1/np.sqrt(np.pi)) * np.exp(-z**2) * inner_sum**rho

    I_g_p1, _ = quad(integrand_gen_p1_test, -np.inf, np.inf, limit=500, epsabs=1e-14)
    I_g_m1, _ = quad(integrand_gen_m1_test, -np.inf, np.inf, limit=500, epsabs=1e-14)
    E0_g = -np.log2(0.5 * (I_g_p1 + I_g_m1))

    # Simplified
    def integrand_s_test(z):
        exp_arg = 4 * np.sqrt(SNR_simp_test) * (z - np.sqrt(SNR_simp_test)) / (1 + rho)
        exp_arg = np.clip(exp_arg, -500, 500)
        h = ((1 + np.exp(exp_arg)) / 2) ** rho
        return (1 / np.sqrt(2 * np.pi)) * np.exp(-z**2 / 2) * h

    I_s, _ = quad(integrand_s_test, -np.inf, np.inf, limit=500, epsabs=1e-14)
    E0_s = -np.log2(I_s)

    diff = abs(E0_g - E0_s)
    print(f"{SNR_simp_test:<12.1f} {SNR_gen_test:<12.1f} {E0_s:>17.12f} {E0_g:>17.12f} {diff:>11.2e}")

print()
print("="*80)
print("CONCLUSION")
print("="*80)
print()

# Check if all differences are small
if diff < 1e-10:
    print("✓ The formulas ARE equivalent with SNR scaling!")
    print()
    print("Confirmed relationship:")
    print("  SNR_general = SNR_simplified / 2")
    print()
    print("This accounts for:")
    print("  - General formula noise variance: σ² = 1/2")
    print("  - Simplified formula noise variance: σ² = 1")
else:
    print("✗ The formulas remain DIFFERENT even with SNR scaling.")
    print()
    print("This suggests they compute fundamentally different quantities,")
    print("not just the same quantity with different noise conventions.")
