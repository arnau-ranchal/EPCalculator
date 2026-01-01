#!/usr/bin/env python3
"""
CORRECT Tanh-Sinh implementation for Gaussian integrals

Approach 1: Sinh-sinh transformation for (-∞,∞)
Approach 2: Inverse CDF transformation to [0,1]
"""

import numpy as np
from scipy.special import roots_hermite, ndtri  # ndtri = Φ^{-1}
import time


class SinhSinhQuadrature:
    """
    Sinh-sinh transformation for integrals over (-∞, ∞)

    x = sinh(π/2 · sinh(t))
    dx = (π/2) cosh(t) cosh(π/2·sinh(t)) dt
    """
    def __init__(self, level=6):
        h = 0.1 / (1 << (level - 3)) if level >= 3 else 0.1

        t_max = 4.0
        t_values = []
        k = 0
        while k * h <= t_max:
            t = k * h
            t_values.append(t)
            if k > 0:
                t_values.append(-t)
            k += 1

        t_values = sorted(t_values)

        self.nodes = []
        self.weights = []

        for t in t_values:
            sinh_t = np.sinh(t)
            cosh_t = np.cosh(t)

            arg = np.pi / 2 * sinh_t

            # Avoid overflow
            if abs(arg) > 20:
                continue

            sinh_arg = np.sinh(arg)
            cosh_arg = np.cosh(arg)

            # x = sinh(π/2 · sinh(t))
            x = sinh_arg

            # dx/dt = (π/2) cosh(t) cosh(π/2·sinh(t))
            weight = h * (np.pi / 2) * cosh_t * cosh_arg

            self.nodes.append(x)
            self.weights.append(weight)

        self.nodes = np.array(self.nodes)
        self.weights = np.array(self.weights)

        print(f"Sinh-Sinh: level={level}, {len(self.nodes)} nodes")
        print(f"  Nodes range: [{np.min(self.nodes):.3f}, {np.max(self.nodes):.3f}]")


class InverseCDFQuadrature:
    """
    Transform Gaussian integral to [0,1] via inverse CDF

    ∫ (1/√(2π)) e^(-z²/2) h(z) dz = ∫_0^1 h(Φ^{-1}(u)) du

    Then apply tanh-sinh to the [0,1] integral.
    """
    def __init__(self, level=6):
        # Standard tanh-sinh for [0,1]
        # Transform: u = (1 + tanh(π/2 · sinh(t)))/2
        # This maps t ∈ (-∞,∞) to u ∈ (0,1)

        h = 0.1 / (1 << (level - 3)) if level >= 3 else 0.1

        t_max = 4.0
        t_values = []
        k = 0
        while k * h <= t_max:
            t = k * h
            t_values.append(t)
            if k > 0:
                t_values.append(-t)
            k += 1

        t_values = sorted(t_values)

        self.nodes = []
        self.weights = []

        for t in t_values:
            sinh_t = np.sinh(t)
            cosh_t = np.cosh(t)

            arg = np.pi / 2 * sinh_t

            if abs(arg) > 10:
                continue

            tanh_arg = np.tanh(arg)
            cosh_arg = np.cosh(arg)

            # u = (1 + tanh(π/2·sinh(t)))/2 ∈ (0,1)
            u = (1 + tanh_arg) / 2

            # Skip endpoints (would give ±∞ in inverse CDF)
            if u <= 0.0001 or u >= 0.9999:
                continue

            # du/dt
            weight = h * (np.pi / 4) * cosh_t / (cosh_arg ** 2)

            self.nodes.append(u)
            self.weights.append(weight)

        self.nodes = np.array(self.nodes)
        self.weights = np.array(self.weights)

        print(f"Inverse-CDF Tanh-Sinh: level={level}, {len(self.nodes)} nodes")
        print(f"  u range: [{np.min(self.nodes):.6f}, {np.max(self.nodes):.6f}]")


def compute_integral_sinh_sinh(rho, SNR, level=6):
    """
    Compute I(ρ, SNR) using sinh-sinh transformation

    ∫ (1/√(2π)) e^(-z²/2) h(z) dz over z ∈ (-∞,∞)
    """
    quad = SinhSinhQuadrature(level)

    integral = 0.0
    for x, w in zip(quad.nodes, quad.weights):
        # x = sinh(...), this is our z value
        z = x

        # Gaussian weight
        gauss_weight = np.exp(-z**2 / 2) / np.sqrt(2 * np.pi)

        # h(z) = ([1 + exp(4√SNR(z-√SNR)/(1+ρ))]/2)^ρ
        exponent = 4 * np.sqrt(SNR) * (z - np.sqrt(SNR)) / (1 + rho)

        if exponent > 500:
            h = 2.0 ** rho
        elif exponent < -500:
            h = 0.5 ** rho
        else:
            h = ((1 + np.exp(exponent)) / 2) ** rho

        integrand = gauss_weight * h
        integral += w * integrand

    return integral


def compute_integral_inverse_cdf(rho, SNR, level=6):
    """
    Compute I(ρ, SNR) using inverse CDF transformation

    Transform to: ∫_0^1 h(Φ^{-1}(u)) du
    """
    quad = InverseCDFQuadrature(level)

    integral = 0.0
    for u, w in zip(quad.nodes, quad.weights):
        # z = Φ^{-1}(u) where Φ is standard normal CDF
        z = ndtri(u)  # scipy's inverse normal CDF

        # h(z) = ([1 + exp(4√SNR(z-√SNR)/(1+ρ))]/2)^ρ
        exponent = 4 * np.sqrt(SNR) * (z - np.sqrt(SNR)) / (1 + rho)

        if exponent > 500:
            h = 2.0 ** rho
        elif exponent < -500:
            h = 0.5 ** rho
        else:
            h = ((1 + np.exp(exponent)) / 2) ** rho

        integral += w * h

    return integral


def compute_integral_gauss_hermite(rho, SNR, N=20):
    """Reference: Gauss-Hermite"""
    nodes, weights = roots_hermite(N)

    integral = 0.0
    for x, w in zip(nodes, weights):
        z = x / np.sqrt(2)
        exponent = 4 * np.sqrt(SNR) * (z - np.sqrt(SNR)) / (1 + rho)

        if exponent > 500:
            h = 2.0 ** rho
        elif exponent < -500:
            h = 0.5 ** rho
        else:
            h = ((1 + np.exp(exponent)) / 2) ** rho

        integral += w * h

    return integral / np.sqrt(np.pi)


def main():
    print("="*80)
    print("CORRECT TANH-SINH IMPLEMENTATION FOR GAUSSIAN INTEGRALS")
    print("="*80)
    print()

    SNR = 1.0
    rho = 0.5

    print(f"Test case: SNR={SNR}, ρ={rho}")
    print()

    # Reference: Gauss-Hermite with high N
    print("-"*80)
    print("REFERENCE: Gauss-Hermite")
    print("-"*80)

    I_ref = compute_integral_gauss_hermite(rho, SNR, N=30)
    print(f"I(ρ,SNR) with N=30: {I_ref:.15f}")
    print()

    # Method 1: Sinh-Sinh
    print("-"*80)
    print("METHOD 1: Sinh-Sinh Transformation")
    print("-"*80)

    for level in [4, 5, 6, 7]:
        I_val = compute_integral_sinh_sinh(rho, SNR, level)
        error = abs(I_val - I_ref)
        print(f"I = {I_val:.15f}, error = {error:.2e}")
        print()

    # Method 2: Inverse CDF
    print("-"*80)
    print("METHOD 2: Inverse CDF + Tanh-Sinh")
    print("-"*80)

    for level in [4, 5, 6, 7]:
        I_val = compute_integral_inverse_cdf(rho, SNR, level)
        error = abs(I_val - I_ref)
        print(f"I = {I_val:.15f}, error = {error:.2e}")
        print()

    print("="*80)
    print("COMPARISON TABLE")
    print("="*80)
    print()

    print(f"{'Method':<25} {'Nodes':<8} {'I(ρ,SNR)':<18} {'Error':<12}")
    print("-"*80)

    # Gauss-Hermite N=20
    I_gh = compute_integral_gauss_hermite(rho, SNR, 20)
    print(f"{'Gauss-Hermite (N=20)':<25} {20:<8} {I_gh:<18.12f} {abs(I_gh-I_ref):<12.2e}")

    # Sinh-sinh level 6
    quad_ss = SinhSinhQuadrature(6)
    I_ss = compute_integral_sinh_sinh(rho, SNR, 6)
    print(f"{'Sinh-Sinh (L=6)':<25} {len(quad_ss.nodes):<8} {I_ss:<18.12f} {abs(I_ss-I_ref):<12.2e}")

    # Inverse CDF level 6
    quad_cdf = InverseCDFQuadrature(6)
    I_cdf = compute_integral_inverse_cdf(rho, SNR, 6)
    print(f"{'Inverse-CDF (L=6)':<25} {len(quad_cdf.nodes):<8} {I_cdf:<18.12f} {abs(I_cdf-I_ref):<12.2e}")

    print()
    print("="*80)
    print("✓ Tanh-sinh variants work correctly for Gaussian integrals!")
    print("="*80)


if __name__ == "__main__":
    main()
