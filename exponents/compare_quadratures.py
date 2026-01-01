#!/usr/bin/env python3
"""
Compare Gauss-Hermite vs Tanh-Sinh quadrature for the 2-PAM integral:

I(ρ, SNR) = E_Z[([1 + e^(4√SNR(Z-√SNR)/(1+ρ))]/2)^ρ]

where Z ~ N(0,1)
"""

import numpy as np
from scipy.special import roots_hermite
import time

class GaussHermiteQuadrature:
    """
    Gauss-Hermite quadrature for ∫ e^(-x²) f(x) dx
    """
    def __init__(self, N):
        self.N = N
        self.nodes, self.weights = roots_hermite(N)
        print(f"Gauss-Hermite: N={N} nodes")
        print(f"  Weight sum: {np.sum(self.weights):.6f} (should be √π = {np.sqrt(np.pi):.6f})")

    def integrate(self, func):
        """
        Compute ∫ e^(-x²) f(x) dx
        Note: scipy's roots_hermite gives weights such that Σ wᵢ f(xᵢ) ≈ ∫ e^(-x²) f(x) dx
        """
        result = 0.0
        for x, w in zip(self.nodes, self.weights):
            result += w * func(x)
        return result


class TanhSinhQuadrature:
    """
    Tanh-Sinh (double exponential) quadrature
    Transform: x = tanh(π/2 · sinh(t))

    For ∫_{-∞}^{∞} e^(-x²) f(x) dx, we integrate over t with appropriate weight.
    """
    def __init__(self, level=6):
        """
        level: determines number of points (roughly 2^level per side)
        """
        self.level = level
        h = 0.125 / (1 << (level - 5)) if level >= 5 else 0.125  # Step size

        # Determine range
        t_max = 5.0  # Truncate at |t| = 5
        t_values = []
        k = 0
        while True:
            t = k * h
            if t > t_max:
                break
            t_values.append(t)
            if k > 0:
                t_values.append(-t)
            k += 1

        t_values = sorted(t_values)

        self.nodes = []
        self.weights = []

        for t in t_values:
            # Transformation: x = tanh(π/2 · sinh(t))
            sinh_t = np.sinh(t)
            cosh_t = np.cosh(t)
            arg = np.pi / 2 * sinh_t

            # Avoid overflow
            if abs(arg) > 10:
                continue

            x = np.tanh(arg)

            # Weight: dx/dt
            cosh_arg = np.cosh(arg)
            weight = h * (np.pi / 2) * cosh_t / (cosh_arg ** 2)

            self.nodes.append(x)
            self.weights.append(weight)

        self.nodes = np.array(self.nodes)
        self.weights = np.array(self.weights)

        print(f"Tanh-Sinh: level={level}, {len(self.nodes)} nodes")
        print(f"  Nodes range: [{np.min(self.nodes):.6f}, {np.max(self.nodes):.6f}]")

    def integrate(self, func):
        """
        Compute ∫_{-1}^{1} f(x) dx (after transformation from (-∞, ∞))
        For ∫_{-∞}^{∞} e^(-x²) f(x) dx, need to include e^(-x²) in func
        """
        result = 0.0
        for x, w in zip(self.nodes, self.weights):
            result += w * func(x)
        return result


def compute_integral_gauss_hermite(rho, SNR, N=20):
    """
    Compute I(ρ, SNR) using Gauss-Hermite quadrature

    I = ∫_{-∞}^{∞} (1/√(2π)) e^(-z²/2) · h(z) dz

    Change of variables: z = x/√2
    I = ∫_{-∞}^{∞} (1/√π) e^(-x²) · h(x/√2) dx
    """
    quad = GaussHermiteQuadrature(N)

    def integrand(x):
        # z = x/√2 (change of variables)
        z = x / np.sqrt(2)

        # h(z) = ([1 + exp(4√SNR(z-√SNR)/(1+ρ))]/2)^ρ
        exponent = 4 * np.sqrt(SNR) * (z - np.sqrt(SNR)) / (1 + rho)

        # Avoid overflow
        if exponent > 500:
            h = (2.0 ** rho)  # Approximation when exp >> 1
        elif exponent < -500:
            h = (1.0 / 2.0) ** rho  # Approximation when exp ≈ 0
        else:
            h = ((1 + np.exp(exponent)) / 2) ** rho

        return h

    integral = quad.integrate(integrand)

    # Result is already multiplied by 1/√π from Hermite weights
    return integral / np.sqrt(np.pi)


def compute_integral_tanh_sinh(rho, SNR, level=6):
    """
    Compute I(ρ, SNR) using Tanh-Sinh quadrature

    For ∫_{-∞}^{∞} (1/√(2π)) e^(-z²/2) · h(z) dz

    After tanh-sinh transform x = tanh(π/2·sinh(t)), integrate over t
    """
    quad = TanhSinhQuadrature(level)

    def integrand(x):
        # x is already in transformed space (close to ±1 at boundaries)
        # Need to map back to z-space
        # Actually, for tanh-sinh on (-∞, ∞), we work directly in z-space
        # So x here represents z values

        z = x / np.sqrt(2)  # Match Gauss-Hermite convention

        # Weight function: (1/√(2π)) e^(-z²/2) = (1/√π) e^(-x²)
        weight = np.exp(-x**2) / np.sqrt(np.pi)

        # h(z) = ([1 + exp(4√SNR(z-√SNR)/(1+ρ))]/2)^ρ
        exponent = 4 * np.sqrt(SNR) * (z - np.sqrt(SNR)) / (1 + rho)

        # Avoid overflow
        if exponent > 500:
            h = (2.0 ** rho)
        elif exponent < -500:
            h = (1.0 / 2.0) ** rho
        else:
            h = ((1 + np.exp(exponent)) / 2) ** rho

        return weight * h

    return quad.integrate(integrand)


def E0_2PAM_symmetric(rho, SNR, method='gauss-hermite', N=20):
    """
    Compute E₀ for 2-PAM using the symmetric formula:

    E₀ = -log₂(I(ρ, SNR))

    where I is the integral for one constellation point (by symmetry).
    """
    if method == 'gauss-hermite':
        integral = compute_integral_gauss_hermite(rho, SNR, N)
    elif method == 'tanh-sinh':
        integral = compute_integral_tanh_sinh(rho, SNR, level=N)
    else:
        raise ValueError(f"Unknown method: {method}")

    E0 = -np.log2(integral)
    return E0


def main():
    print("="*80)
    print("COMPARING GAUSS-HERMITE VS TANH-SINH QUADRATURE")
    print("="*80)
    print()

    # Test configuration
    SNR = 1.0
    rho = 0.5

    print(f"Configuration: 2-PAM, SNR={SNR}, ρ={rho}")
    print()

    print("-"*80)
    print("GAUSS-HERMITE QUADRATURE")
    print("-"*80)

    N_values = [5, 10, 15, 20, 30]

    print(f"\n{'N':<5} {'I(ρ,SNR)':<18} {'E₀':<18} {'Time (s)':<10}")
    print("-"*80)

    gh_results = []
    for N in N_values:
        start = time.time()
        I_val = compute_integral_gauss_hermite(rho, SNR, N)
        E0 = -np.log2(I_val)
        elapsed = time.time() - start

        gh_results.append((N, I_val, E0, elapsed))
        print(f"{N:<5} {I_val:<18.12f} {E0:<18.12f} {elapsed:<10.6f}")
        print()

    print()
    print("-"*80)
    print("TANH-SINH QUADRATURE")
    print("-"*80)

    level_values = [3, 4, 5, 6, 7]

    print(f"\n{'Level':<5} {'I(ρ,SNR)':<18} {'E₀':<18} {'Time (s)':<10}")
    print("-"*80)

    ts_results = []
    for level in level_values:
        start = time.time()
        I_val = compute_integral_tanh_sinh(rho, SNR, level)
        E0 = -np.log2(I_val)
        elapsed = time.time() - start

        ts_results.append((level, I_val, E0, elapsed))
        print(f"{level:<5} {I_val:<18.12f} {E0:<18.12f} {elapsed:<10.6f}")
        print()

    print()
    print("="*80)
    print("CONVERGENCE COMPARISON")
    print("="*80)

    # Reference: highest accuracy result
    I_ref = gh_results[-1][1]  # N=30

    print(f"\nReference (Gauss-Hermite N=30): I = {I_ref:.15f}")
    print()

    print("Gauss-Hermite errors:")
    for N, I_val, E0, elapsed in gh_results:
        error = abs(I_val - I_ref)
        print(f"  N={N:2d}: error = {error:.2e}")

    print()
    print("Tanh-Sinh errors:")
    for level, I_val, E0, elapsed in ts_results:
        error = abs(I_val - I_ref)
        print(f"  Level={level}: error = {error:.2e}")

    print()
    print("="*80)
    print("SANITY CHECK: Test multiple (ρ, SNR) values")
    print("="*80)
    print()

    test_cases = [
        (0.3, 0.5),
        (0.5, 1.0),
        (0.7, 1.0),
        (0.5, 2.0),
    ]

    print(f"{'ρ':<6} {'SNR':<6} {'GH(N=20)':<18} {'TS(L=6)':<18} {'Difference':<12}")
    print("-"*80)

    for rho_test, snr_test in test_cases:
        I_gh = compute_integral_gauss_hermite(rho_test, snr_test, 20)
        I_ts = compute_integral_tanh_sinh(rho_test, snr_test, 6)
        diff = abs(I_gh - I_ts)

        print(f"{rho_test:<6.1f} {snr_test:<6.1f} {I_gh:<18.12f} {I_ts:<18.12f} {diff:<12.2e}")

    print()
    print("="*80)
    print("To compare with C++ code, run:")
    print("  ./exponents/test_simple")
    print("with appropriate parameters (2-PAM, desired ρ and SNR)")
    print("="*80)


if __name__ == "__main__":
    main()
