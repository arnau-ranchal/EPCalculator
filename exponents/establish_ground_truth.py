#!/usr/bin/env python3
"""
Establish ground truth for I(ρ, SNR) using multiple independent methods:
1. scipy's adaptive quadrature (quad)
2. mpmath high-precision arithmetic
3. Convergence analysis (multiple N values for Gauss-Hermite)
4. Tanh-sinh convergence
"""

import numpy as np
from scipy.integrate import quad
from scipy.special import roots_hermite, ndtri
import mpmath as mp

# Set mpmath precision
mp.dps = 50  # 50 decimal places

def integrand_numpy(z, rho, SNR):
    """The integrand for numpy/scipy"""
    gauss_weight = np.exp(-z**2 / 2) / np.sqrt(2 * np.pi)
    exponent = 4 * np.sqrt(SNR) * (z - np.sqrt(SNR)) / (1 + rho)

    if exponent > 500:
        h = 2.0 ** rho
    elif exponent < -500:
        h = 0.5 ** rho
    else:
        h = ((1 + np.exp(exponent)) / 2) ** rho

    return gauss_weight * h


def integrand_mpmath(z, rho, SNR):
    """The integrand for high-precision mpmath"""
    z = mp.mpf(z)
    rho = mp.mpf(rho)
    SNR = mp.mpf(SNR)

    # Gaussian weight
    gauss_weight = mp.exp(-z**2 / 2) / mp.sqrt(2 * mp.pi)

    # h(z)
    exponent = 4 * mp.sqrt(SNR) * (z - mp.sqrt(SNR)) / (1 + rho)
    h = ((1 + mp.exp(exponent)) / 2) ** rho

    return gauss_weight * h


def compute_scipy_quad(rho, SNR):
    """Ground truth using scipy's adaptive quadrature"""
    result, error = quad(
        lambda z: integrand_numpy(z, rho, SNR),
        -np.inf, np.inf,
        limit=200,
        epsabs=1e-14,
        epsrel=1e-14
    )
    return result, error


def compute_mpmath_quad(rho, SNR):
    """High-precision ground truth using mpmath"""
    result = mp.quad(
        lambda z: integrand_mpmath(z, rho, SNR),
        [-mp.inf, mp.inf]
    )
    return float(result)


def compute_gauss_hermite(rho, SNR, N):
    """Gauss-Hermite quadrature"""
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
    print("ESTABLISHING GROUND TRUTH")
    print("="*80)
    print()

    SNR = 1.0
    rho = 0.5

    print(f"Test case: SNR={SNR}, ρ={rho}")
    print()

    # Method 1: scipy adaptive quadrature
    print("-"*80)
    print("METHOD 1: scipy.integrate.quad (adaptive)")
    print("-"*80)

    I_scipy, error_scipy = compute_scipy_quad(rho, SNR)
    print(f"Result:    I = {I_scipy:.15f}")
    print(f"Estimated error: {error_scipy:.2e}")
    print()

    # Method 2: mpmath high-precision
    print("-"*80)
    print("METHOD 2: mpmath (50 decimal digits)")
    print("-"*80)

    I_mpmath = compute_mpmath_quad(rho, SNR)
    print(f"Result:    I = {I_mpmath:.15f}")
    print()

    # Method 3: Gauss-Hermite convergence
    print("-"*80)
    print("METHOD 3: Gauss-Hermite convergence study")
    print("-"*80)

    N_values = [10, 15, 20, 25, 30, 40, 50]

    print(f"{'N':<5} {'I(ρ,SNR)':<20} {'vs scipy':<15} {'vs mpmath':<15}")
    print("-"*80)

    gh_results = []
    for N in N_values:
        I_gh = compute_gauss_hermite(rho, SNR, N)
        err_scipy = abs(I_gh - I_scipy)
        err_mpmath = abs(I_gh - I_mpmath)
        gh_results.append(I_gh)

        print(f"{N:<5} {I_gh:<20.15f} {err_scipy:<15.2e} {err_mpmath:<15.2e}")

    print()

    # Check convergence
    print("Convergence check (consecutive differences):")
    for i in range(1, len(gh_results)):
        diff = abs(gh_results[i] - gh_results[i-1])
        print(f"  |I(N={N_values[i]}) - I(N={N_values[i-1]})| = {diff:.2e}")

    print()

    # Summary
    print("="*80)
    print("GROUND TRUTH ESTABLISHED")
    print("="*80)
    print()

    print(f"scipy adaptive:        I = {I_scipy:.15f}")
    print(f"mpmath (50 digits):    I = {I_mpmath:.15f}")
    print(f"Gauss-Hermite (N=50):  I = {gh_results[-1]:.15f}")
    print()

    print("Agreement:")
    print(f"  |scipy - mpmath| = {abs(I_scipy - I_mpmath):.2e}")
    print(f"  |scipy - GH(50)| = {abs(I_scipy - gh_results[-1]):.2e}")
    print(f"  |mpmath - GH(50)| = {abs(I_mpmath - gh_results[-1]):.2e}")
    print()

    if abs(I_scipy - I_mpmath) < 1e-10 and abs(I_scipy - gh_results[-1]) < 1e-10:
        print("✓ All three methods agree to ~10 digits")
        print(f"✓ GROUND TRUTH: I = {I_scipy:.12f}")
    else:
        print("✗ Methods disagree! Need investigation.")

    print()
    print("="*80)
    print("Now we can fairly compare Gauss-Hermite vs tanh-sinh!")
    print("="*80)


if __name__ == "__main__":
    main()
