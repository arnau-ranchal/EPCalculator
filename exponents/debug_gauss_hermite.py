#!/usr/bin/env python3
"""
Debug: Why is Gauss-Hermite giving wrong answer?

Ground truth: I = 0.9471
Gauss-Hermite gives: I = 0.7595

Let me trace through the integral transformation step by step.
"""

import numpy as np
from scipy.special import roots_hermite
from scipy.integrate import quad

SNR = 1.0
rho = 0.5

def h(z):
    """The function h(z) = ([1 + exp(...)]/2)^ρ"""
    exponent = 4 * np.sqrt(SNR) * (z - np.sqrt(SNR)) / (1 + rho)
    if exponent > 500:
        return 2.0 ** rho
    elif exponent < -500:
        return 0.5 ** rho
    else:
        return ((1 + np.exp(exponent)) / 2) ** rho

print("="*80)
print("DEBUGGING GAUSS-HERMITE")
print("="*80)
print()

# The TRUE integral we want:
# I = ∫_{-∞}^{∞} (1/√(2π)) e^(-z²/2) h(z) dz

print("Step 1: Compute ground truth with scipy.quad")
print("-"*80)

def integrand_original(z):
    return np.exp(-z**2 / 2) / np.sqrt(2 * np.pi) * h(z)

I_true, _ = quad(integrand_original, -np.inf, np.inf)
print(f"I_true = {I_true:.15f}")
print()

# Try different transformations for Gauss-Hermite
print("Step 2: Try different Gauss-Hermite transformations")
print("-"*80)

N = 30
nodes, weights = roots_hermite(N)

print(f"Gauss-Hermite nodes/weights: N={N}")
print(f"Sum of weights: {np.sum(weights):.10f} (should be √π = {np.sqrt(np.pi):.10f})")
print()

# Transformation 1: What I was doing
print("Attempt 1: My original transformation")
print("  z = x/√2, then divide by √π")

integral_1 = 0.0
for x, w in zip(nodes, weights):
    z = x / np.sqrt(2)
    integral_1 += w * h(z)
integral_1 /= np.sqrt(np.pi)

print(f"  Result: {integral_1:.15f}")
print(f"  Error: {abs(integral_1 - I_true):.2e}")
print()

# Transformation 2: Direct application
print("Attempt 2: For ∫ (1/√(2π)) e^(-z²/2) h(z) dz")
print("  Substitute z = x")
print("  Weight: (1/√(2π)) e^(-x²/2), but GH has e^(-x²)")

# This won't work directly - wrong weight!
print("  [Can't use GH directly - weight mismatch]")
print()

# Transformation 3: Rescale to match weight
print("Attempt 3: Match the weight function")
print("  For ∫ (1/√(2π)) e^(-z²/2) h(z) dz")
print("  Let z = √2·t, dz = √2·dt:")
print("  = ∫ (1/√π) e^(-t²) h(√2·t) dt")
print("  This has weight e^(-t²), perfect for GH!")

integral_3 = 0.0
for t, w in zip(nodes, weights):
    z = np.sqrt(2) * t
    integral_3 += w * h(z)
integral_3 /= np.sqrt(np.pi)

print(f"  Result: {integral_3:.15f}")
print(f"  Error: {abs(integral_3 - I_true):.2e}")
print()

# Transformation 4: Verify by checking a simple integral
print("Verification: Test on ∫ (1/√(2π)) e^(-z²/2) · 1 dz = 1")
print("-"*80)

# Should give 1
integral_test_1 = 0.0
for x, w in zip(nodes, weights):
    z = x / np.sqrt(2)
    integral_test_1 += w * 1.0
integral_test_1 /= np.sqrt(np.pi)

integral_test_3 = 0.0
for t, w in zip(nodes, weights):
    z = np.sqrt(2) * t
    integral_test_3 += w * 1.0
integral_test_3 /= np.sqrt(np.pi)

print(f"Method 1 (z=x/√2): {integral_test_1:.10f} (should be 1.0)")
print(f"Method 3 (z=√2·t): {integral_test_3:.10f} (should be 1.0)")
print()

print("="*80)
print("CONCLUSION")
print("="*80)
print()

if abs(integral_3 - I_true) < 1e-10:
    print("✓ Method 3 (z=√2·t) is CORRECT!")
    print()
    print("CORRECT Gauss-Hermite formula:")
    print("  For ∫ (1/√(2π)) e^(-z²/2) h(z) dz:")
    print("  1. Use z = √2·t")
    print("  2. I = (1/√π) Σ wᵢ h(√2·tᵢ)")
else:
    print("✗ Still have error - need more investigation")

print()
print(f"Ground truth:     {I_true:.15f}")
print(f"Method 1 (wrong): {integral_1:.15f}")
print(f"Method 3 (right): {integral_3:.15f}")
