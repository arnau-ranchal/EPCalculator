#!/usr/bin/env python3
"""
Benchmark: Time vs Precision for 2-PAM integral

Compare Gauss-Hermite vs Sinh-sinh for different accuracy targets
"""

import numpy as np
from scipy.special import roots_hermite
from scipy.integrate import quad
import time
import matplotlib.pyplot as plt

SNR = 1.0
rho = 0.5

def get_ground_truth():
    """High-precision ground truth"""
    def integrand(z):
        gauss_weight = np.exp(-z**2 / 2) / np.sqrt(2 * np.pi)
        exponent = 4 * np.sqrt(SNR) * (z - np.sqrt(SNR)) / (1 + rho)
        if exponent > 500:
            h = 2.0 ** rho
        elif exponent < -500:
            h = 0.5 ** rho
        else:
            h = ((1 + np.exp(exponent)) / 2) ** rho
        return gauss_weight * h

    result, _ = quad(integrand, -np.inf, np.inf, limit=500, epsabs=1e-15, epsrel=1e-15)
    return result


def gauss_hermite(rho, SNR, N):
    """Gauss-Hermite quadrature (corrected)"""
    nodes, weights = roots_hermite(N)

    integral = 0.0
    for t, w in zip(nodes, weights):
        z = np.sqrt(2) * t
        exponent = 4 * np.sqrt(SNR) * (z - np.sqrt(SNR)) / (1 + rho)
        if exponent > 500:
            h = 2.0 ** rho
        elif exponent < -500:
            h = 0.5 ** rho
        else:
            h = ((1 + np.exp(exponent)) / 2) ** rho
        integral += w * h

    return integral / np.sqrt(np.pi)


def sinh_sinh(rho, SNR, level):
    """Sinh-sinh quadrature"""
    h = 0.1 / (1 << (level - 3)) if level >= 3 else 0.1
    t_max = 4.0

    nodes = []
    weights = []

    k = 0
    while k * h <= t_max:
        t = k * h
        for sign in [1, -1] if k > 0 else [1]:
            t_val = sign * t
            sinh_t = np.sinh(t_val)
            cosh_t = np.cosh(t_val)
            arg = np.pi / 2 * sinh_t

            if abs(arg) > 20:
                continue

            x = np.sinh(arg)
            w = h * (np.pi / 2) * cosh_t * np.cosh(arg)

            nodes.append(x)
            weights.append(w)
        k += 1

    integral = 0.0
    for z, w in zip(nodes, weights):
        gauss_weight = np.exp(-z**2 / 2) / np.sqrt(2 * np.pi)
        exponent = 4 * np.sqrt(SNR) * (z - np.sqrt(SNR)) / (1 + rho)
        if exponent > 500:
            h = 2.0 ** rho
        elif exponent < -500:
            h = 0.5 ** rho
        else:
            h = ((1 + np.exp(exponent)) / 2) ** rho

        integral += w * gauss_weight * h

    return integral, len(nodes)


def benchmark_method(method_name, compute_func, param_values, I_true):
    """Benchmark a method with different parameter values"""
    results = []

    for param in param_values:
        # Warm-up
        if method_name == "Gauss-Hermite":
            _ = compute_func(rho, SNR, param)
        else:
            _, _ = compute_func(rho, SNR, param)

        # Benchmark (average over multiple runs)
        times = []
        for _ in range(100):
            start = time.perf_counter()
            if method_name == "Gauss-Hermite":
                I_val = compute_func(rho, SNR, param)
                n_nodes = param
            else:
                I_val, n_nodes = compute_func(rho, SNR, param)
            elapsed = time.perf_counter() - start
            times.append(elapsed)

        avg_time = np.mean(times)
        std_time = np.std(times)
        error = abs(I_val - I_true)

        results.append({
            'param': param,
            'nodes': n_nodes,
            'time_us': avg_time * 1e6,  # microseconds
            'time_std_us': std_time * 1e6,
            'error': error,
            'I_val': I_val
        })

        print(f"  {method_name} ({param}): {n_nodes} nodes, "
              f"{avg_time*1e6:.1f}±{std_time*1e6:.1f} μs, error = {error:.2e}")

    return results


def main():
    print("="*80)
    print("BENCHMARK: Time vs Precision for 2-PAM Integral")
    print("="*80)
    print()

    print(f"Configuration: SNR={SNR}, ρ={rho}")
    print()

    # Compute ground truth
    print("Computing ground truth...")
    I_true = get_ground_truth()
    print(f"Ground truth: I = {I_true:.15f}")
    print()

    # Benchmark Gauss-Hermite
    print("-"*80)
    print("Benchmarking Gauss-Hermite")
    print("-"*80)
    N_values = [5, 10, 15, 20, 25, 30, 40, 50]
    gh_results = benchmark_method("Gauss-Hermite", gauss_hermite, N_values, I_true)
    print()

    # Benchmark Sinh-sinh
    print("-"*80)
    print("Benchmarking Sinh-Sinh")
    print("-"*80)
    level_values = [3, 4, 5, 6, 7]
    ss_results = benchmark_method("Sinh-Sinh", sinh_sinh, level_values, I_true)
    print()

    # Create comparison plots
    fig, axes = plt.subplots(1, 3, figsize=(18, 5))

    # Plot 1: Time vs N/Nodes
    ax1 = axes[0]
    gh_nodes = [r['nodes'] for r in gh_results]
    gh_times = [r['time_us'] for r in gh_results]
    ss_nodes = [r['nodes'] for r in ss_results]
    ss_times = [r['time_us'] for r in ss_results]

    ax1.plot(gh_nodes, gh_times, 'o-', label='Gauss-Hermite', markersize=8, linewidth=2)
    ax1.plot(ss_nodes, ss_times, 's-', label='Sinh-Sinh', markersize=8, linewidth=2)
    ax1.set_xlabel('Number of Nodes', fontsize=12)
    ax1.set_ylabel('Time (μs)', fontsize=12)
    ax1.set_title('Computation Time vs Nodes', fontsize=13, fontweight='bold')
    ax1.legend(fontsize=11)
    ax1.grid(True, alpha=0.3)

    # Plot 2: Error vs Time
    ax2 = axes[1]
    gh_errors = [r['error'] for r in gh_results]
    ss_errors = [r['error'] for r in ss_results]

    ax2.loglog(gh_times, gh_errors, 'o-', label='Gauss-Hermite', markersize=8, linewidth=2)
    ax2.loglog(ss_times, ss_errors, 's-', label='Sinh-Sinh', markersize=8, linewidth=2)
    ax2.set_xlabel('Time (μs)', fontsize=12)
    ax2.set_ylabel('Absolute Error', fontsize=12)
    ax2.set_title('Error vs Time (Efficiency)', fontsize=13, fontweight='bold')
    ax2.legend(fontsize=11)
    ax2.grid(True, alpha=0.3, which='both')

    # Plot 3: Error vs Nodes
    ax3 = axes[2]
    ax3.semilogy(gh_nodes, gh_errors, 'o-', label='Gauss-Hermite', markersize=8, linewidth=2)
    ax3.semilogy(ss_nodes, ss_errors, 's-', label='Sinh-Sinh', markersize=8, linewidth=2)
    ax3.set_xlabel('Number of Nodes', fontsize=12)
    ax3.set_ylabel('Absolute Error', fontsize=12)
    ax3.set_title('Error vs Nodes (Convergence)', fontsize=13, fontweight='bold')
    ax3.legend(fontsize=11)
    ax3.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig('benchmark_2pam.png', dpi=150, bbox_inches='tight')
    print("Plots saved to: benchmark_2pam.png")
    print()

    # Summary table
    print("="*80)
    print("SUMMARY: Time vs Precision Trade-offs")
    print("="*80)
    print()

    print("Target accuracy: 1e-6 (6 digits)")
    print("-"*80)

    # Find first entry achieving 1e-6
    gh_1e6 = next((r for r in gh_results if r['error'] < 1e-6), None)
    ss_1e6 = next((r for r in ss_results if r['error'] < 1e-6), None)

    if gh_1e6:
        print(f"Gauss-Hermite: N={gh_1e6['param']}, "
              f"{gh_1e6['nodes']} nodes, "
              f"{gh_1e6['time_us']:.1f} μs, "
              f"error = {gh_1e6['error']:.2e}")

    if ss_1e6:
        print(f"Sinh-Sinh:     Level={ss_1e6['param']}, "
              f"{ss_1e6['nodes']} nodes, "
              f"{ss_1e6['time_us']:.1f} μs, "
              f"error = {ss_1e6['error']:.2e}")

    print()
    print("Target accuracy: 1e-10 (10 digits)")
    print("-"*80)

    gh_1e10 = next((r for r in gh_results if r['error'] < 1e-10), None)
    ss_1e10 = next((r for r in ss_results if r['error'] < 1e-10), None)

    if gh_1e10:
        print(f"Gauss-Hermite: N={gh_1e10['param']}, "
              f"{gh_1e10['nodes']} nodes, "
              f"{gh_1e10['time_us']:.1f} μs, "
              f"error = {gh_1e10['error']:.2e}")

    if ss_1e10:
        print(f"Sinh-Sinh:     Level={ss_1e10['param']}, "
              f"{ss_1e10['nodes']} nodes, "
              f"{ss_1e10['time_us']:.1f} μs, "
              f"error = {ss_1e10['error']:.2e}")

    print()
    print("Target accuracy: 1e-14 (14 digits, near machine precision)")
    print("-"*80)

    gh_1e14 = next((r for r in gh_results if r['error'] < 1e-14), None)
    ss_1e14 = next((r for r in ss_results if r['error'] < 1e-14), None)

    if gh_1e14:
        print(f"Gauss-Hermite: N={gh_1e14['param']}, "
              f"{gh_1e14['nodes']} nodes, "
              f"{gh_1e14['time_us']:.1f} μs, "
              f"error = {gh_1e14['error']:.2e}")
    else:
        print("Gauss-Hermite: Does not reach 1e-14 with tested N values")

    if ss_1e14:
        print(f"Sinh-Sinh:     Level={ss_1e14['param']}, "
              f"{ss_1e14['nodes']} nodes, "
              f"{ss_1e14['time_us']:.1f} μs, "
              f"error = {ss_1e14['error']:.2e}")
    else:
        print("Sinh-Sinh:     Does not reach 1e-14 with tested levels")

    print()
    print("="*80)
    print("CONCLUSION")
    print("="*80)
    print()

    if gh_1e6 and ss_1e6:
        speedup_1e6 = ss_1e6['time_us'] / gh_1e6['time_us']
        if speedup_1e6 > 1.1:
            print(f"For 1e-6 accuracy: Gauss-Hermite is {speedup_1e6:.1f}× faster")
        elif speedup_1e6 < 0.9:
            print(f"For 1e-6 accuracy: Sinh-Sinh is {1/speedup_1e6:.1f}× faster")
        else:
            print("For 1e-6 accuracy: Both methods have similar speed")

    if gh_1e10 and ss_1e10:
        speedup_1e10 = ss_1e10['time_us'] / gh_1e10['time_us']
        if speedup_1e10 > 1.1:
            print(f"For 1e-10 accuracy: Gauss-Hermite is {speedup_1e10:.1f}× faster")
        elif speedup_1e10 < 0.9:
            print(f"For 1e-10 accuracy: Sinh-Sinh is {1/speedup_1e10:.1f}× faster")
        else:
            print("For 1e-10 accuracy: Both methods have similar speed")

    if ss_1e14 and not gh_1e14:
        print("For 1e-14 accuracy: Only Sinh-Sinh reaches this precision")
        print("  → Sinh-Sinh has BETTER asymptotic convergence!")


if __name__ == "__main__":
    main()
