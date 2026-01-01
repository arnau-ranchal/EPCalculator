#!/usr/bin/env python3
"""
Deep analysis of why the general and simplified formulas differ.

Key hypothesis: The simplified formula may be conditioning on a specific
transmitted symbol rather than averaging over all symbols.
"""

import numpy as np
from scipy.integrate import quad

rho = 0.73
SNR = 1.0

print("="*70)
print("ANALYZING FORMULA STRUCTURE")
print("="*70)
print()

# ==============================================================================
# General formula: E₀ = -log₂[∑_x Q(x) · I_x]
# where I_x = (1/√π) ∫ e^{-z²} [(inner sum)]^ρ dz
# ==============================================================================

print("GENERAL FORMULA STRUCTURE:")
print("E₀ = -log₂[Q(+1)·I_{+1} + Q(-1)·I_{-1}]")
print("   = -log₂[(1/2)·I_{+1} + (1/2)·I_{-1}]  (for uniform prior)")
print()

# Compute integrals separately (using natural Gaussian z²)
def compute_integral_general(x, rho, SNR):
    """Compute I_x for transmitted symbol x."""
    def integrand(z):
        # Inner sum over x̄
        inner_sum = 0
        for x_bar in [-1, +1]:
            # Likelihood ratio term
            exponent = -((z + np.sqrt(SNR) * (x - x_bar))**2 - z**2) / (1 + rho)
            exponent = np.clip(exponent, -500, 500)
            inner_sum += 0.5 * np.exp(exponent)  # Q(x̄) = 1/2

        return (1/np.sqrt(np.pi)) * np.exp(-z**2) * inner_sum**rho

    result, _ = quad(integrand, -np.inf, np.inf, limit=500, epsabs=1e-15)
    return result

I_plus1 = compute_integral_general(+1, rho, SNR)
I_minus1 = compute_integral_general(-1, rho, SNR)

print(f"I_(x=+1) = {I_plus1:.15f}")
print(f"I_(x=-1) = {I_minus1:.15f}")
print(f"Symmetric? {np.isclose(I_plus1, I_minus1)}")
print()

E0_general = -np.log2(0.5 * I_plus1 + 0.5 * I_minus1)
print(f"E₀ (general) = -log₂[(1/2)({I_plus1:.6f} + {I_minus1:.6f})]")
print(f"             = -log₂[{0.5 * (I_plus1 + I_minus1):.15f}]")
print(f"             = {E0_general:.15f}")
print()

# ==============================================================================
# What if we DON'T average over x?
# ==============================================================================

print("ALTERNATIVE: E₀ = -log₂[I_{x=+1}]  (condition on x=+1 only)")
E0_cond_plus1 = -np.log2(I_plus1)
print(f"E₀ (conditioned on x=+1) = {E0_cond_plus1:.15f}")
print()

print("ALTERNATIVE: E₀ = -log₂[I_{x=-1}]  (condition on x=-1 only)")
E0_cond_minus1 = -np.log2(I_minus1)
print(f"E₀ (conditioned on x=-1) = {E0_cond_minus1:.15f}")
print()

# ==============================================================================
# Simplified formula: What is it actually computing?
# ==============================================================================

print("="*70)
print("SIMPLIFIED FORMULA")
print("="*70)
print()

def integrand_simplified(z, rho, SNR):
    """My simplified formula (standard Gaussian)."""
    exponent = 4 * np.sqrt(SNR) * (z - np.sqrt(SNR)) / (1 + rho)
    exponent = np.clip(exponent, -500, 500)
    h = ((1 + np.exp(exponent)) / 2) ** rho
    return (1 / np.sqrt(2 * np.pi)) * np.exp(-z**2 / 2) * h

I_simplified, _ = quad(integrand_simplified, -np.inf, np.inf,
                       args=(rho, SNR), limit=500, epsabs=1e-15)
E0_simplified = -np.log2(I_simplified)

print(f"I = {I_simplified:.15f}")
print(f"E₀ = {E0_simplified:.15f}")
print()

# ==============================================================================
# Transform simplified formula to natural Gaussian coordinates
# ==============================================================================

print("="*70)
print("TRANSFORMING SIMPLIFIED TO NATURAL GAUSSIAN")
print("="*70)
print()

# z (standard Gaussian) = √2 · z' (natural Gaussian)
# So z' = z/√2

def integrand_simplified_natural_coords(z_prime, rho, SNR):
    """Simplified formula expressed in natural Gaussian coordinates."""
    z = np.sqrt(2) * z_prime  # Convert to standard Gaussian variable

    exponent = 4 * np.sqrt(SNR) * (z - np.sqrt(SNR)) / (1 + rho)
    exponent = np.clip(exponent, -500, 500)
    h = ((1 + np.exp(exponent)) / 2) ** rho

    # Natural Gaussian measure
    return (1 / np.sqrt(np.pi)) * np.exp(-z_prime**2) * h

I_simp_nat, _ = quad(integrand_simplified_natural_coords, -np.inf, np.inf,
                     args=(rho, SNR), limit=500, epsabs=1e-15)
E0_simp_nat = -np.log2(I_simp_nat)

print(f"I (natural coords) = {I_simp_nat:.15f}")
print(f"E₀ (natural coords) = {E0_simp_nat:.15f}")
print()

# Expand the exponent
print("In natural coordinates, the exponent becomes:")
print("  4√SNR(√2·z' - √SNR)/(1+ρ)")
print("  = (4√(2·SNR)·z' - 4SNR)/(1+ρ)")
print()
print(f"So this matches general formula I_(x=-1) with SNR_eff = {2*SNR}")
print()

# Verify with adjusted SNR
SNR_eff = 2 * SNR
I_gen_check = compute_integral_general(-1, rho, SNR_eff)
E0_gen_check = -np.log2(I_gen_check)

print(f"General formula I_(x=-1) with SNR={SNR_eff}:")
print(f"  I = {I_gen_check:.15f}")
print(f"  E₀ = {E0_gen_check:.15f}")
print()

# ==============================================================================
# SUMMARY
# ==============================================================================

print("="*70)
print("SUMMARY OF FINDINGS")
print("="*70)
print()
print("1. GENERAL FORMULA computes:")
print(f"   E₀ = -log₂[(1/2)·I_(+1) + (1/2)·I_(-1)] = {E0_general:.6f}")
print("   This AVERAGES over transmitted symbols.")
print()
print("2. By symmetry: I_(+1) = I_(-1), so averaging doesn't change the value")
print(f"   -log₂[I_(+1)] = -log₂[I_(-1)] = {E0_cond_plus1:.6f}")
print()
print("3. SIMPLIFIED FORMULA (with variance 1) computes:")
print(f"   E₀ = -log₂[I] = {E0_simplified:.6f}")
print()
print("4. After coordinate transformation, simplified formula matches")
print("   general formula conditioned on x=-1 but with SNR → 2·SNR")
print(f"   Match check: |E₀_simp - E₀_gen(SNR=2)| = {abs(E0_simp_nat - E0_gen_check):.2e}")
print()
print("CONCLUSION:")
print("The formulas are computing THE SAME error exponent, but:")
print("  - General uses noise variance σ² = 1/2")
print("  - Simplified uses noise variance σ² = 1")
print(f"  - For equivalent channels: SNR_general = 2·SNR_simplified")
print()
print(f"With SNR_general={SNR} and SNR_simplified={SNR/2}:")
I_simp_half_snr, _ = quad(integrand_simplified, -np.inf, np.inf,
                          args=(rho, SNR/2), limit=500, epsabs=1e-15)
E0_simp_half_snr = -np.log2(I_simp_half_snr)
print(f"  General:    E₀ = {E0_general:.15f}")
print(f"  Simplified: E₀ = {E0_simp_half_snr:.15f}")
print(f"  Difference: {abs(E0_general - E0_simp_half_snr):.2e}")
