#!/usr/bin/env python3
"""
Verify exact value of E₀ = 0.929903
"""

import numpy as np
from scipy.special import roots_hermite
from scipy.integrate import quad

def compute_E0_2PAM(rho, SNR, N=50):
    """Final corrected implementation."""
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

# Test with different N values
print("="*70)
print("EXACT VALUE VERIFICATION")
print("="*70)
print()

rho = 1.0
SNR = 3.0
target = 0.929903

print(f"Parameters: ρ = {rho}, SNR = {SNR}")
print(f"Expected: E₀ = {target}")
print()

print(f"{'N':<8} {'E₀ (computed)':<20} {'Difference':<15} {'Match 6 digits?':<20}")
print("-"*70)

for N in [20, 30, 40, 50, 80, 100]:
    E0 = compute_E0_2PAM(rho, SNR, N)
    diff = E0 - target
    match_6 = abs(diff) < 5e-7  # Within 0.5e-6 for 6 decimal places
    match_str = "✓ YES" if match_6 else "✗ NO"
    print(f"{N:<8} {E0:<20.15f} {diff:>14.10f} {match_str:<20}")

print()

# Ground truth with scipy.quad
def integrand(z, rho, SNR):
    SNR_eff = 2.0 * SNR
    sigma_sq = 1.0 / SNR_eff

    I_total = 0.0
    for x in [-1, +1]:
        inner = 0.0
        for x_bar in [-1, +1]:
            delta = -(z + x - x_bar)**2 + z**2
            inner += 0.5 * np.exp(delta / (2 * sigma_sq * (1 + rho)))
        I_total += 0.5 * (1/np.sqrt(2*np.pi*sigma_sq)) * np.exp(-z**2/(2*sigma_sq)) * inner**rho

    return I_total

print("Computing ground truth with scipy.quad...")
I_ground, err = quad(lambda z: integrand(z, rho, SNR), -np.inf, np.inf,
                     limit=1000, epsabs=1e-15, epsrel=1e-15)
E0_ground = -np.log2(I_ground)

print(f"Ground truth: E₀ = {E0_ground:.15f}")
print(f"Quad error estimate: {err:.2e}")
print()

print("="*70)
print("SUMMARY")
print("="*70)
print()
print(f"Expected value:     {target}")
print(f"Computed (N=50):    {compute_E0_2PAM(rho, SNR, 50):.10f}")
print(f"Ground truth:       {E0_ground:.10f}")
print()

E0_final = compute_E0_2PAM(rho, SNR, 50)
if abs(E0_final - target) < 5e-7:
    print(f"✓✓✓ SUCCESS! Matches {target} to 6 decimal places")
    print(f"    Actual value: {E0_final:.15f}")
    print(f"    Rounds to:    {E0_final:.6f}")
else:
    print(f"✗ Mismatch: difference = {abs(E0_final - target):.10f}")
