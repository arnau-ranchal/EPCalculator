#!/usr/bin/env python3
"""
Quadrature benchmark for E₀^{iid}(ρ) with different parameters:
SNR = 3.0 (linear), ρ = 1.0

This tests a higher SNR regime and ρ at the upper boundary.
"""

import numpy as np
from scipy.special import roots_hermite
from scipy.integrate import quad
import time

# Test parameters
rho = 1.0
SNR = 3.0

print("="*90)
print("QUADRATURE BENCHMARK FOR E₀^{iid}(ρ) - NEW PARAMETERS")
print("="*90)
print(f"Parameters: ρ = {rho}, SNR = {SNR} (linear) = {10*np.log10(SNR):.2f} dB (2-PAM)")
print()

# ==============================================================================
# GROUND TRUTH with scipy.quad
# ==============================================================================

def integrand_for_x(x, z, rho, SNR):
    """Compute integrand for transmitted symbol x."""
    inner_sum = 0.0
    for x_bar in [-1, +1]:
        # Δ(x,x̄,z) = -|z + √SNR(x-x̄)|² + |z|²
        delta = -(z + np.sqrt(SNR) * (x - x_bar))**2 + z**2
        delta_scaled = delta / (1 + rho)
        delta_scaled = np.clip(delta_scaled, -500, 500)
        inner_sum += 0.5 * np.exp(delta_scaled)  # Q(x̄) = 1/2

    return (1/np.pi) * np.exp(-z**2) * inner_sum**rho

print("Computing ground truth with scipy.quad...")
I_plus1, err1 = quad(lambda z: integrand_for_x(+1, z, rho, SNR), -np.inf, np.inf,
                     limit=500, epsabs=1e-15)
I_minus1, err2 = quad(lambda z: integrand_for_x(-1, z, rho, SNR), -np.inf, np.inf,
                      limit=500, epsabs=1e-15)
I_total = 0.5 * (I_plus1 + I_minus1)  # Average with Q(x) = 1/2
E0_true = -np.log2(I_total)

print(f"  I_(x=+1) = {I_plus1:.15f}  (quad error: {err1:.2e})")
print(f"  I_(x=-1) = {I_minus1:.15f}  (quad error: {err2:.2e})")
print(f"  I_total  = {I_total:.15f}")
print(f"  E₀       = {E0_true:.15f}")
print(f"  Symmetry check: |I(+1) - I(-1)| = {abs(I_plus1 - I_minus1):.2e}")
print()

# ==============================================================================
# METHOD 1: Gauss-Hermite Quadrature
# ==============================================================================

def gauss_hermite_e0(rho, SNR, N):
    """Gauss-Hermite quadrature with weight e^{-t²}."""
    nodes, weights = roots_hermite(N)

    # Integral for x = +1
    I_plus1 = 0.0
    for t, w in zip(nodes, weights):
        inner_sum = 0.0
        for x_bar in [-1, +1]:
            delta = -(t + np.sqrt(SNR) * (1 - x_bar))**2 + t**2
            delta_scaled = delta / (1 + rho)
            delta_scaled = np.clip(delta_scaled, -500, 500)
            inner_sum += 0.5 * np.exp(delta_scaled)
        I_plus1 += w * inner_sum**rho

    # Integral for x = -1
    I_minus1 = 0.0
    for t, w in zip(nodes, weights):
        inner_sum = 0.0
        for x_bar in [-1, +1]:
            delta = -(t + np.sqrt(SNR) * (-1 - x_bar))**2 + t**2
            delta_scaled = delta / (1 + rho)
            delta_scaled = np.clip(delta_scaled, -500, 500)
            inner_sum += 0.5 * np.exp(delta_scaled)
        I_minus1 += w * inner_sum**rho

    # Combine: (1/2)·I_{+1} + (1/2)·I_{-1}, with normalization 1/π
    I_avg = 0.5 * (I_plus1 + I_minus1) / np.pi
    E0 = -np.log2(I_avg)

    return E0, I_avg

# ==============================================================================
# METHOD 2: Sinh-sinh Quadrature
# ==============================================================================

def sinh_sinh_e0(rho, SNR, level):
    """Sinh-sinh quadrature with overflow protection."""
    h = 2.0 ** (-level)
    max_k = int(10 / h)

    nodes = []
    weights = []
    for k in range(-max_k, max_k + 1):
        t = k * h
        sinh_t = np.sinh(t)
        cosh_t = np.cosh(t)

        # Avoid overflow
        arg = np.pi / 2 * sinh_t
        if abs(arg) > 500:
            continue

        x = np.sinh(arg)
        w = h * (np.pi / 2) * cosh_t * np.cosh(arg)

        if np.isfinite(w) and np.isfinite(x):
            nodes.append(x)
            weights.append(w)

    # Compute integrals
    I_plus1 = 0.0
    I_minus1 = 0.0

    for x, w in zip(nodes, weights):
        # Gaussian weight
        gauss_weight = np.exp(-x**2)
        if not np.isfinite(gauss_weight):
            continue

        # For transmitted x = +1
        inner_p1 = 0.0
        for x_bar in [-1, +1]:
            delta = -(x + np.sqrt(SNR) * (1 - x_bar))**2 + x**2
            delta_scaled = delta / (1 + rho)
            delta_scaled = np.clip(delta_scaled, -500, 500)
            inner_p1 += 0.5 * np.exp(delta_scaled)
        I_plus1 += w * gauss_weight * inner_p1**rho

        # For transmitted x = -1
        inner_m1 = 0.0
        for x_bar in [-1, +1]:
            delta = -(x + np.sqrt(SNR) * (-1 - x_bar))**2 + x**2
            delta_scaled = delta / (1 + rho)
            delta_scaled = np.clip(delta_scaled, -500, 500)
            inner_m1 += 0.5 * np.exp(delta_scaled)
        I_minus1 += w * gauss_weight * inner_m1**rho

    I_avg = 0.5 * (I_plus1 + I_minus1) / np.pi
    E0 = -np.log2(I_avg)

    return E0, I_avg

# ==============================================================================
# METHOD 3: Tanh-sinh with Inverse CDF
# ==============================================================================

def tanh_sinh_cdf_e0(rho, SNR, level):
    """Transform to [0,1] using inverse CDF, then tanh-sinh."""
    from scipy.special import ndtri

    h = 2.0 ** (-level)
    max_k = int(10 / h)

    nodes_u = []
    weights_u = []

    for k in range(-max_k, max_k + 1):
        t = k * h
        sinh_t = np.sinh(t)
        cosh_t = np.cosh(t)

        arg = np.pi / 2 * sinh_t
        if abs(arg) > 15:
            continue

        tanh_arg = np.tanh(arg)
        u = 0.5 * (1 + tanh_arg)

        w = h * (np.pi / 2) * cosh_t / (np.cosh(arg)**2)

        if 0.0001 < u < 0.9999 and np.isfinite(w):
            nodes_u.append(u)
            weights_u.append(w)

    I_plus1 = 0.0
    I_minus1 = 0.0

    for u, w in zip(nodes_u, weights_u):
        z_std = ndtri(u)
        z = z_std / np.sqrt(2)

        if not np.isfinite(z):
            continue

        jacobian = np.sqrt(np.pi) * np.exp(z**2)

        # For x = +1
        inner_p1 = 0.0
        for x_bar in [-1, +1]:
            delta = -(z + np.sqrt(SNR) * (1 - x_bar))**2 + z**2
            delta_scaled = delta / (1 + rho)
            delta_scaled = np.clip(delta_scaled, -500, 500)
            inner_p1 += 0.5 * np.exp(delta_scaled)

        integrand_p1 = (1/np.pi) * np.exp(-z**2) * inner_p1**rho
        I_plus1 += w * jacobian * integrand_p1

        # For x = -1
        inner_m1 = 0.0
        for x_bar in [-1, +1]:
            delta = -(z + np.sqrt(SNR) * (-1 - x_bar))**2 + z**2
            delta_scaled = delta / (1 + rho)
            delta_scaled = np.clip(delta_scaled, -500, 500)
            inner_m1 += 0.5 * np.exp(delta_scaled)

        integrand_m1 = (1/np.pi) * np.exp(-z**2) * inner_m1**rho
        I_minus1 += w * jacobian * integrand_m1

    I_avg = 0.5 * (I_plus1 + I_minus1)
    E0 = -np.log2(I_avg)

    return E0, I_avg

# ==============================================================================
# BENCHMARK
# ==============================================================================

print("="*90)
print("PERFORMANCE COMPARISON")
print("="*90)
print()

print(f"{'Method':<30} {'Nodes':<8} {'Time (μs)':<12} {'E₀':<18} {'Error':<12}")
print("-"*90)

# Gauss-Hermite
gh_results = []
for N in [10, 20, 30, 40, 50, 80, 100]:
    start = time.perf_counter()
    E0, I = gauss_hermite_e0(rho, SNR, N)
    elapsed = (time.perf_counter() - start) * 1e6
    error = abs(E0 - E0_true)
    print(f"{'Gauss-Hermite':<30} {N:<8} {elapsed:<12.1f} {E0:>17.12f} {error:>11.2e}")
    gh_results.append((N, elapsed, error))

print()

# Sinh-sinh
ss_results = []
for level in [2, 3, 4, 5, 6]:
    start = time.perf_counter()
    E0, I = sinh_sinh_e0(rho, SNR, level)
    elapsed = (time.perf_counter() - start) * 1e6
    error = abs(E0 - E0_true)
    nodes_actual = len([k for k in range(-int(10/(2**(-level))), int(10/(2**(-level)))+1)
                       if abs(np.pi/2 * np.sinh(k * 2**(-level))) <= 500])
    print(f"{'Sinh-sinh':<30} {nodes_actual:<8} {elapsed:<12.1f} {E0:>17.12f} {error:>11.2e}")
    ss_results.append((nodes_actual, elapsed, error))

print()

# Tanh-sinh with CDF
ts_results = []
for level in [3, 4, 5, 6, 7]:
    nodes_approx = 2 * int(10 / (2.0 ** (-level))) + 1
    start = time.perf_counter()
    E0, I = tanh_sinh_cdf_e0(rho, SNR, level)
    elapsed = (time.perf_counter() - start) * 1e6
    error = abs(E0 - E0_true)
    print(f"{'Tanh-sinh+CDF':<30} {nodes_approx:<8} {elapsed:<12.1f} {E0:>17.12f} {error:>11.2e}")
    ts_results.append((nodes_approx, elapsed, error))

print()

# ==============================================================================
# ACCURACY TARGETS
# ==============================================================================

print("="*90)
print("OPTIMAL METHOD FOR EACH ACCURACY TARGET")
print("="*90)
print()

for target in [1e-6, 1e-10, 1e-14]:
    print(f"Target accuracy: {target:.0e}")
    print(f"{'Method':<30} {'Nodes':<8} {'Time (μs)':<12} {'Error':<15}")
    print("-"*75)

    # Gauss-Hermite
    found_gh = False
    for N in range(5, 150):
        start = time.perf_counter()
        E0, I = gauss_hermite_e0(rho, SNR, N)
        elapsed = (time.perf_counter() - start) * 1e6
        error = abs(E0 - E0_true)
        if error < target:
            print(f"{'Gauss-Hermite':<30} {N:<8} {elapsed:<12.1f} {error:<15.2e}")
            found_gh = True
            break
    if not found_gh:
        print(f"{'Gauss-Hermite':<30} {'N/A':<8} {'---':<12} {'Cannot achieve':<15}")

    # Sinh-sinh
    found_ss = False
    for level in range(1, 10):
        start = time.perf_counter()
        E0, I = sinh_sinh_e0(rho, SNR, level)
        elapsed = (time.perf_counter() - start) * 1e6
        error = abs(E0 - E0_true)
        if error < target and np.isfinite(error):
            nodes = len([k for k in range(-int(10/(2**(-level))), int(10/(2**(-level)))+1)
                        if abs(np.pi/2 * np.sinh(k * 2**(-level))) <= 500])
            print(f"{'Sinh-sinh':<30} {nodes:<8} {elapsed:<12.1f} {error:<15.2e}")
            found_ss = True
            break
    if not found_ss:
        print(f"{'Sinh-sinh':<30} {'N/A':<8} {'---':<12} {'Cannot achieve':<15}")

    # Tanh-sinh+CDF
    found_ts = False
    for level in range(1, 10):
        start = time.perf_counter()
        E0, I = tanh_sinh_cdf_e0(rho, SNR, level)
        elapsed = (time.perf_counter() - start) * 1e6
        error = abs(E0 - E0_true)
        if error < target and np.isfinite(error):
            nodes = 2 * int(10 / (2.0 ** (-level))) + 1
            print(f"{'Tanh-sinh+CDF':<30} {nodes:<8} {elapsed:<12.1f} {error:<15.2e}")
            found_ts = True
            break
    if not found_ts:
        print(f"{'Tanh-sinh+CDF':<30} {'N/A':<8} {'---':<12} {'Cannot achieve':<15}")

    print()

# ==============================================================================
# COMPARISON WITH PREVIOUS PARAMETERS
# ==============================================================================

print("="*90)
print("COMPARISON: SNR=3, ρ=1 vs SNR=1, ρ=0.73")
print("="*90)
print()

print("Current parameters (SNR=3, ρ=1):")
print(f"  E₀ = {E0_true:.15f}")
print(f"  Best GH config: N=30, error ~ {[e for n,t,e in gh_results if n==30][0]:.2e}")
print()

print("Previous parameters (SNR=1, ρ=0.73):")
print(f"  E₀ = 1.257250393872879")
print(f"  Best GH config: N=30, error ~ 4.8e-14")
print()

print("Observations:")
if E0_true > 1.257250393872879:
    print(f"  • Higher SNR → Higher E₀ (better channel)")
else:
    print(f"  • Lower E₀ despite higher SNR (ρ=1 vs ρ=0.73 effect)")

# Check if convergence is faster or slower
gh_30_error = [e for n,t,e in gh_results if n==30][0]
if gh_30_error < 1e-13:
    print(f"  • Similar convergence rate (both reach ~1e-14 with N=30)")
elif gh_30_error < 1e-10:
    print(f"  • Slightly slower convergence (error {gh_30_error:.2e} vs 4.8e-14)")
else:
    print(f"  • Much slower convergence (error {gh_30_error:.2e} vs 4.8e-14)")

print()

# ==============================================================================
# SUMMARY
# ==============================================================================

print("="*90)
print("SUMMARY FOR SNR=3, ρ=1")
print("="*90)
print()

print("1. GAUSS-HERMITE: Still the WINNER ★★★★★")
best_gh = min(gh_results, key=lambda x: x[1] if x[2] < 1e-10 else float('inf'))
print(f"   - Best config for 1e-10: N={best_gh[0]}, {best_gh[1]:.1f} μs, error={best_gh[2]:.2e}")
print()

if any(np.isfinite(e) and e < 1e-6 for _, _, e in ss_results):
    print("2. SINH-SINH: Works for this parameter set")
    best_ss = min((r for r in ss_results if np.isfinite(r[2]) and r[2] < 1e-6),
                  key=lambda x: x[1], default=None)
    if best_ss:
        print(f"   - Best config: {best_ss[0]} nodes, {best_ss[1]:.1f} μs, error={best_ss[2]:.2e}")
else:
    print("2. SINH-SINH: Still fails (NaN/overflow issues)")

if any(e < 1e-6 for _, _, e in ts_results):
    print("3. TANH-SINH+CDF: Works for this parameter set")
    best_ts = min((r for r in ts_results if r[2] < 1e-6), key=lambda x: x[1], default=None)
    if best_ts:
        print(f"   - Best config: {best_ts[0]} nodes, {best_ts[1]:.1f} μs, error={best_ts[2]:.2e}")
else:
    print("3. TANH-SINH+CDF: Still fails (large errors)")

print()
print("RECOMMENDATION: Use Gauss-Hermite with N=30-50 (same as before)")
print()
