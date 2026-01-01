#!/usr/bin/env python3
"""
Debug why Python and C++ give different results.

The formula is:
E₀(ρ) = -log₂ Σₓ [Q(x)/π ∫_ℂ e^(-|z|²) f(z,x,ρ)^ρ dz]

where f(z,x,ρ) = [Σ_x̄ Q(x̄) e^(-D(z,x,x̄)/(1+ρ))] / e^(-|z|²/(1+ρ))
               = e^(|z|²/(1+ρ)) Σ_x̄ Q(x̄) e^(-D(z,x,x̄)/(1+ρ))
"""

import numpy as np
from scipy.special import roots_hermite

# Simple test: 4-PAM, SNR=1, ρ=0.5, N=5
M = 4
SNR = 1.0
rho = 0.5

# PAM constellation (before normalization)
X_raw = np.array([2*i - (M-1) for i in range(M)], dtype=np.complex128)
print(f"X_raw: {X_raw}")

# Normalize
Q = np.ones(M) / M
avg_power = np.sum(Q * np.abs(X_raw)**2)
scale = np.sqrt(avg_power)
X = X_raw / scale

print(f"Avg power (raw): {avg_power:.6f}")
print(f"Scale factor: {scale:.6f}")
print(f"X (normalized): {X}")
print(f"Avg power (normalized): {np.sum(Q * np.abs(X)**2):.6f}")
print()

# Gauss-Hermite nodes and weights
N = 5
nodes_1d, weights_1d = roots_hermite(N)

print(f"1D nodes: {nodes_1d}")
print(f"1D weights: {weights_1d}")
print(f"1D weight sum: {np.sum(weights_1d):.6f} (should be √π = {np.sqrt(np.pi):.6f})")
print()

# Create 2D grid
Z_list = []
W_list = []
for x, wx in zip(nodes_1d, weights_1d):
    for y, wy in zip(nodes_1d, weights_1d):
        Z_list.append(x + 1j*y)
        W_list.append(wx * wy)

Z = np.array(Z_list)
W = np.array(W_list)

print(f"2D grid: {len(Z)} points")
print(f"2D weight sum: {np.sum(W):.6f} (should be π = {np.pi:.6f})")
print()

# Compute E₀ step by step
print("="*60)
print("COMPUTING E₀")
print("="*60)

outer_sum = 0.0

for i_x, x in enumerate(X):
    print(f"\nFor x[{i_x}] = {x:.4f}:")

    inner_integral = 0.0

    for k_z, (z, w) in enumerate(zip(Z, W)):
        if k_z == 0:  # Print details for first quadrature point
            print(f"  First quadrature point z = {z:.4f}, weight = {w:.6f}:")

        # Compute f(z, x, ρ)
        sum_over_xbar = 0.0
        for j, xbar in enumerate(X):
            # D(z, x, x̄) = |z + √SNR(x - x̄)|²
            delta = z + np.sqrt(SNR) * (x - xbar)
            D = np.abs(delta)**2
            term = Q[j] * np.exp(-D / (1 + rho))
            sum_over_xbar += term

            if k_z == 0 and j == 0:  # Print first term
                print(f"    x̄[0] = {xbar:.4f}, D = {D:.6f}, term = {term:.6e}")

        if k_z == 0:
            print(f"    Sum over x̄: {sum_over_xbar:.6e}")

        # f(z, x, ρ) = e^(|z|²/(1+ρ)) · sum_over_xbar
        f_val = np.exp(np.abs(z)**2 / (1 + rho)) * sum_over_xbar

        if k_z == 0:
            print(f"    |z|² = {np.abs(z)**2:.6f}")
            print(f"    exp(|z|²/(1+ρ)) = {np.exp(np.abs(z)**2 / (1 + rho)):.6f}")
            print(f"    f(z,x,ρ) = {f_val:.6e}")

        # Integrand: e^(-|z|²) · f^ρ
        integrand = np.exp(-np.abs(z)**2) * (f_val ** rho)

        if k_z == 0:
            print(f"    f^ρ = {f_val ** rho:.6e}")
            print(f"    exp(-|z|²) = {np.exp(-np.abs(z)**2):.6f}")
            print(f"    Integrand = {integrand:.6e}")

        inner_integral += w * integrand

    print(f"  Inner integral (sum over z): {inner_integral:.6e}")
    print(f"  Inner integral / π: {inner_integral / np.pi:.6e}")
    print(f"  Q[{i_x}] · (integral/π) = {Q[i_x] * inner_integral / np.pi:.6e}")

    outer_sum += Q[i_x] * inner_integral / np.pi

print()
print("="*60)
print(f"Outer sum: {outer_sum:.10e}")
print(f"E₀ = -log₂(outer_sum) = {-np.log2(outer_sum):.10f}")
print("="*60)
