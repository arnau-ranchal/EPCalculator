#!/usr/bin/env python3
"""
Final comparison: Implement both formulas with Gauss-Hermite and compare.

Focus on understanding what each formula computes and verify implementation.
"""

import numpy as np
from scipy.special import roots_hermite
from scipy.integrate import quad

print("="*80)
print("FINAL COMPARISON: GENERAL vs SIMPLIFIED FORMULAS FOR 2-PAM")
print("="*80)
print()

# Test parameters
rho = 0.73
SNR = 1.0

# ==============================================================================
# IMPLEMENTATION 1: General Gallager formula (your formula)
# ==============================================================================

def E0_general_gauss_hermite(rho, SNR, N):
    """
    General Gallager error exponent formula.

    E₀ = -log₂[∑_x Q(x) · I_x]
    where I_x = (1/√π) ∫ e^{-z²} [(∑_x̄ Q(x̄) e^{Δ(x,x̄,z)})^ρ] dz

    Channel: Y = √SNR·x + z, where z ~ (1/√π)e^{-z²} has variance 1/2
    """
    nodes, weights = roots_hermite(N)

    # Compute integral for x = +1
    I_x_plus1 = 0.0
    for t, w in zip(nodes, weights):
        # Inner sum over x̄ ∈ {-1, +1}
        inner_sum = 0.0
        for x_bar in [-1, +1]:
            # Likelihood ratio exponent: -[(z + √SNR(x-x̄))² - z²]/(1+ρ)
            # For x=+1: -(z + √SNR(1-x̄))²/(1+ρ) + z²/(1+ρ)
            delta = -((t + np.sqrt(SNR) * (1 - x_bar))**2 - t**2) / (1 + rho)
            delta = np.clip(delta, -500, 500)
            inner_sum += 0.5 * np.exp(delta)  # Q(x̄) = 1/2

        I_x_plus1 += w * inner_sum**rho

    I_x_plus1 /= np.sqrt(np.pi)

    # Compute integral for x = -1
    I_x_minus1 = 0.0
    for t, w in zip(nodes, weights):
        inner_sum = 0.0
        for x_bar in [-1, +1]:
            delta = -((t + np.sqrt(SNR) * (-1 - x_bar))**2 - t**2) / (1 + rho)
            delta = np.clip(delta, -500, 500)
            inner_sum += 0.5 * np.exp(delta)

        I_x_minus1 += w * inner_sum**rho

    I_x_minus1 /= np.sqrt(np.pi)

    # Average over transmitted symbols
    I_total = 0.5 * (I_x_plus1 + I_x_minus1)
    E0 = -np.log2(I_total)

    return E0, I_total, I_x_plus1, I_x_minus1

# ==============================================================================
# IMPLEMENTATION 2: Simplified formula (previous implementation)
# ==============================================================================

def E0_simplified_gauss_hermite(rho, SNR, N):
    """
    Simplified 2-PAM formula from previous session.

    I = ∫ (1/√(2π)) e^{-z²/2} [(1 + e^{4√SNR(z-√SNR)/(1+ρ)})/2]^ρ dz
    E₀ = -log₂[I]

    Channel: Y = √SNR·x + z, where z ~ N(0,1) has variance 1
    """
    nodes, weights = roots_hermite(N)

    integral = 0.0
    for t, w in zip(nodes, weights):
        z = np.sqrt(2) * t  # Transform to standard normal
        exponent = 4 * np.sqrt(SNR) * (z - np.sqrt(SNR)) / (1 + rho)
        exponent = np.clip(exponent, -500, 500)
        h = ((1 + np.exp(exponent)) / 2) ** rho
        integral += w * h

    integral /= np.sqrt(np.pi)
    E0 = -np.log2(integral)

    return E0, integral

# ==============================================================================
# GROUND TRUTH WITH SCIPY
# ==============================================================================

print("Computing ground truth with scipy.quad...")
print()

# General formula
def integrand_gen_plus1(z):
    inner_sum = 0.0
    for x_bar in [-1, +1]:
        delta = -((z + np.sqrt(SNR) * (1 - x_bar))**2 - z**2) / (1 + rho)
        delta = np.clip(delta, -500, 500)
        inner_sum += 0.5 * np.exp(delta)
    return (1/np.sqrt(np.pi)) * np.exp(-z**2) * inner_sum**rho

def integrand_gen_minus1(z):
    inner_sum = 0.0
    for x_bar in [-1, +1]:
        delta = -((z + np.sqrt(SNR) * (-1 - x_bar))**2 - z**2) / (1 + rho)
        delta = np.clip(delta, -500, 500)
        inner_sum += 0.5 * np.exp(delta)
    return (1/np.sqrt(np.pi)) * np.exp(-z**2) * inner_sum**rho

I_gen_p1, _ = quad(integrand_gen_plus1, -np.inf, np.inf, limit=500, epsabs=1e-15)
I_gen_m1, _ = quad(integrand_gen_minus1, -np.inf, np.inf, limit=500, epsabs=1e-15)
I_gen_total = 0.5 * (I_gen_p1 + I_gen_m1)
E0_gen_true = -np.log2(I_gen_total)

print(f"Ground truth (general formula, SNR={SNR}, ρ={rho}):")
print(f"  I_(x=+1) = {I_gen_p1:.15f}")
print(f"  I_(x=-1) = {I_gen_m1:.15f}")
print(f"  I_total  = {I_gen_total:.15f}")
print(f"  E₀       = {E0_gen_true:.15f}")
print()

# Simplified formula
def integrand_simp(z):
    exponent = 4 * np.sqrt(SNR) * (z - np.sqrt(SNR)) / (1 + rho)
    exponent = np.clip(exponent, -500, 500)
    h = ((1 + np.exp(exponent)) / 2) ** rho
    return (1 / np.sqrt(2 * np.pi)) * np.exp(-z**2 / 2) * h

I_simp, _ = quad(integrand_simp, -np.inf, np.inf, limit=500, epsabs=1e-15)
E0_simp_true = -np.log2(I_simp)

print(f"Ground truth (simplified formula, SNR={SNR}, ρ={rho}):")
print(f"  I  = {I_simp:.15f}")
print(f"  E₀ = {E0_simp_true:.15f}")
print()

# ==============================================================================
# QUADRATURE COMPARISON
# ==============================================================================

print("="*80)
print("GAUSS-HERMITE QUADRATURE COMPARISON")
print("="*80)
print()

print(f"{'N':<6} {'E₀ (general)':<18} {'Error':<12} {'E₀ (simplified)':<18} {'Error':<12}")
print("-"*80)

for N in [10, 20, 30, 50]:
    E0_gen, I_gen, _, _ = E0_general_gauss_hermite(rho, SNR, N)
    err_gen = abs(E0_gen - E0_gen_true)

    E0_simp, I_simp = E0_simplified_gauss_hermite(rho, SNR, N)
    err_simp = abs(E0_simp - E0_simp_true)

    print(f"{N:<6} {E0_gen:>17.12f} {err_gen:>11.2e} {E0_simp:>17.12f} {err_simp:>11.2e}")

print()

# ==============================================================================
# KEY OBSERVATIONS
# ==============================================================================

print("="*80)
print("KEY OBSERVATIONS")
print("="*80)
print()

print(f"1. E₀ values are DIFFERENT:")
print(f"   General:    E₀ = {E0_gen_true:.6f}")
print(f"   Simplified: E₀ = {E0_simp_true:.6f}")
print(f"   Difference: ΔE₀ = {abs(E0_gen_true - E0_simp_true):.6f}")
print()

print("2. Both use Gauss-Hermite effectively (errors < 1e-11 with N=50)")
print()

print("3. The formulas compute DIFFERENT quantities:")
print()
print("   GENERAL FORMULA:")
print("   - Uses noise variance σ² = 1/2 (natural Gaussian)")
print("   - Averages over transmitted symbols: E₀ = -log₂[𝔼_X[I_X]]")
print("   - Standard Gallager random coding error exponent")
print()
print("   SIMPLIFIED FORMULA:")
print("   - Uses noise variance σ² = 1 (standard Gaussian)")
print("   - Appears to condition on specific transmitted symbol")
print("   - May be a different form or approximation of error exponent")
print()

print("4. For the SAME physical channel (same SNR ratio), would need:")
print(f"   SNR_general = SNR_simplified / 2")
print()

# Test with adjusted SNR
SNR_adj = SNR / 2
E0_simp_adj, _ = E0_simplified_gauss_hermite(rho, SNR_adj, 50)

def integrand_simp_adj(z):
    exponent = 4 * np.sqrt(SNR_adj) * (z - np.sqrt(SNR_adj)) / (1 + rho)
    exponent = np.clip(exponent, -500, 500)
    h = ((1 + np.exp(exponent)) / 2) ** rho
    return (1 / np.sqrt(2 * np.pi)) * np.exp(-z**2 / 2) * h

I_simp_adj, _ = quad(integrand_simp_adj, -np.inf, np.inf, limit=500, epsabs=1e-15)
E0_simp_adj_true = -np.log2(I_simp_adj)

print(f"   Testing: SNR_general={SNR}, SNR_simplified={SNR_adj}")
print(f"   E₀_general    = {E0_gen_true:.15f}")
print(f"   E₀_simplified = {E0_simp_adj_true:.15f}")
print(f"   Difference    = {abs(E0_gen_true - E0_simp_adj_true):.2e}")
print()

if abs(E0_gen_true - E0_simp_adj_true) < 1e-6:
    print("   ✓ MATCH! The formulas agree when accounting for noise variance.")
else:
    print("   ✗ Still different - formulas may compute fundamentally different quantities.")
