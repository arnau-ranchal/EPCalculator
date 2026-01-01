#!/usr/bin/env python3
"""
Pure Python implementation of Gauss-Hermite quadrature for E₀ computation
Following the exact formulation from the C++ code.
"""

import numpy as np
from scipy.special import roots_hermite
import time

class E0Calculator:
    def __init__(self, M, constellation_type, SNR_linear, R=0.5):
        """
        Initialize E₀ calculator

        Args:
            M: Constellation size
            constellation_type: "PAM", "PSK", or "QAM"
            SNR_linear: SNR in linear scale
            R: Rate (default 0.5)
        """
        self.M = M
        self.constellation_type = constellation_type
        self.SNR = SNR_linear
        self.R = R

        # Generate constellation
        self.X = self._generate_constellation()

        # Uniform distribution
        self.Q = np.ones(M) / M

        # Normalize constellation for unit average power
        self._normalize_constellation()

        print(f"Initialized: {M}-{constellation_type}, SNR={SNR_linear:.3f}, R={R}")
        print(f"Constellation points: {self.X[:5]}..." if M > 5 else f"Constellation: {self.X}")
        print(f"Average power: {self._average_power():.6f}")
        print()

    def _generate_constellation(self):
        """Generate constellation points"""
        M = self.M

        if self.constellation_type == "PAM":
            # PAM: Real constellation from -(M-1) to (M-1) step 2
            return np.array([2*i - (M-1) for i in range(M)], dtype=np.complex128)

        elif self.constellation_type == "PSK":
            # PSK: Points on unit circle
            angles = 2 * np.pi * np.arange(M) / M
            return np.exp(1j * angles)

        elif self.constellation_type == "QAM":
            # Square QAM
            side = int(np.sqrt(M))
            if side * side != M:
                raise ValueError(f"QAM requires M to be perfect square, got {M}")

            points = []
            for i in range(side):
                for j in range(side):
                    real = 2*i - (side-1)
                    imag = 2*j - (side-1)
                    points.append(real + 1j*imag)
            return np.array(points, dtype=np.complex128)

        else:
            raise ValueError(f"Unknown constellation type: {self.constellation_type}")

    def _average_power(self):
        """Compute average power E[|X|²]"""
        return np.sum(self.Q * np.abs(self.X)**2)

    def _normalize_constellation(self):
        """Normalize constellation for unit average power"""
        avg_power = self._average_power()
        scale = np.sqrt(avg_power)
        self.X = self.X / scale
        print(f"Normalized by factor {scale:.6f}")

    def compute_hermite_nodes_weights(self, N):
        """
        Compute Gauss-Hermite nodes and weights

        For weight function e^(-x²), scipy returns nodes and weights such that:
        ∫ e^(-x²) f(x) dx ≈ Σ wᵢ f(xᵢ)
        """
        nodes, weights = roots_hermite(N)
        return nodes, weights

    def compute_2d_quadrature_grid(self, N):
        """
        Compute 2D Gauss-Hermite quadrature grid for complex integral
        Returns nodes Z and weights W for:
        ∫_ℂ e^(-|z|²) f(z) dz ≈ Σ Wₖ f(Zₖ)
        """
        nodes_1d, weights_1d = self.compute_hermite_nodes_weights(N)

        # For ∫∫ e^(-(x²+y²)) f(x,y) dx dy, we need to combine:
        # The scipy weights already include 1/√π factor, but we need 1/π for 2D
        # Actually, scipy gives weights such that Σ wᵢ = √π
        # For 2D: ∫∫ e^(-(x²+y²)) = π
        # So we need weights that sum to π

        # Create 2D grid
        Z = []
        W = []

        for i, (x, wx) in enumerate(zip(nodes_1d, weights_1d)):
            for j, (y, wy) in enumerate(zip(nodes_1d, weights_1d)):
                z = x + 1j*y
                w = wx * wy  # 2D weight
                Z.append(z)
                W.append(w)

        # Note: scipy roots_hermite gives weights that sum to √π
        # For 2D, product of weights sums to π (which is what we want!)

        Z = np.array(Z)
        W = np.array(W)

        print(f"2D grid: {len(Z)} points (N={N} per dimension)")
        print(f"Weight sum: {np.sum(W):.6f} (should be ≈ π = {np.pi:.6f})")

        return Z, W

    def compute_E0(self, rho, N=12):
        """
        Compute E₀ using Gauss-Hermite quadrature

        Following the formula:
        E₀(ρ) = -log₂ Σₓ [Q(x)/π ∫_ℂ e^(-|z|²) f(z,x,ρ)^ρ dz]

        where:
        f(z,x,ρ) = e^(|z|²/(1+ρ)) Σ_x̄ Q(x̄) e^(-D(z,x,x̄)/(1+ρ))
        D(z,x,x̄) = |z + √SNR(x-x̄)|²
        """
        print(f"\nComputing E₀(ρ={rho}, N={N})...")

        # Get quadrature nodes and weights
        Z, W = self.compute_2d_quadrature_grid(N)

        # For each constellation point x
        outer_sum = 0.0

        for i, x in enumerate(self.X):
            # Inner integral over z
            inner_sum = 0.0

            for k, (z, w) in enumerate(zip(Z, W)):
                # Compute f(z, x, ρ)
                # f = e^(|z|²/(1+ρ)) Σ_x̄ Q(x̄) e^(-D(z,x,x̄)/(1+ρ))

                # Sum over all x̄
                sum_over_xbar = 0.0
                for j, xbar in enumerate(self.X):
                    # D(z, x, x̄) = |z + √SNR(x - x̄)|²
                    delta = z + np.sqrt(self.SNR) * (x - xbar)
                    D = np.abs(delta)**2

                    sum_over_xbar += self.Q[j] * np.exp(-D / (1 + rho))

                # f(z, x, ρ)
                f_val = np.exp(np.abs(z)**2 / (1 + rho)) * sum_over_xbar

                # Integrand: e^(-|z|²) f^ρ
                integrand = np.exp(-np.abs(z)**2) * (f_val ** rho)

                inner_sum += w * integrand

            # The integral divided by π
            integral_over_pi = inner_sum / np.pi

            # Weighted by Q(x)
            outer_sum += self.Q[i] * integral_over_pi

        # E₀ = -log₂(outer_sum)
        E0 = -np.log2(outer_sum)

        print(f"  Outer sum: {outer_sum:.10e}")
        print(f"  E₀ = {E0:.10f}")

        return E0


def main():
    print("="*80)
    print("GAUSS-HERMITE E₀ COMPUTATION IN PYTHON")
    print("="*80)
    print()

    # Configuration
    M = 32
    constellation = "PAM"
    SNR_linear = 1.0
    rho = 0.73
    R = 0.5

    # Initialize calculator
    calc = E0Calculator(M, constellation, SNR_linear, R)

    print("-"*80)

    # Compute E₀ for different N values to see convergence
    N_values = [5, 8, 10, 12, 15, 20]

    results = []
    times = []

    for N in N_values:
        start = time.time()
        E0 = calc.compute_E0(rho, N)
        elapsed = time.time() - start

        results.append(E0)
        times.append(elapsed)

        print(f"  Time: {elapsed:.3f}s")
        print()

    print("="*80)
    print("CONVERGENCE ANALYSIS")
    print("="*80)
    print()
    print(f"{'N':<5} {'E₀':<15} {'Time (s)':<10} {'Error vs N=20':<15}")
    print("-"*80)

    E0_ref = results[-1]  # N=20 as reference

    for N, E0, t in zip(N_values, results, times):
        error = abs(E0 - E0_ref)
        print(f"{N:<5} {E0:<15.10f} {t:<10.3f} {error:<15.2e}")

    print()
    print(f"Final result (N=20): E₀ = {E0_ref:.10f}")
    print()


if __name__ == "__main__":
    main()
