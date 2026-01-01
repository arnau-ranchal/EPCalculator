#!/usr/bin/env python3
"""
Test Python Maxwell-Boltzmann implementation with high beta values
Compare with C++ results
"""

import math
import cmath

def test_maxwell_boltzmann(M, beta, test_name):
    """Test Maxwell-Boltzmann fixed-point iteration for given beta"""

    print("\n" + "="*80)
    print(f"TEST: {test_name}")
    print(f"M = {M}, Beta = {beta:.17e}")
    print("="*80 + "\n")

    # Create QAM constellation
    L = int(math.sqrt(M))
    if L * L != M:
        print(f"Error: M={M} is not a perfect square")
        return None

    delta = math.sqrt(3.0 / (2.0 * (L * L - 1)))

    # Standard QAM pattern
    pattern = []
    for i in range(L):
        for j in range(L):
            I_comp = (2 * i - L + 1) * delta
            Q_comp = (2 * j - L + 1) * delta
            pattern.append(complex(I_comp, Q_comp))

    # Pre-compute pattern energies
    pattern_energy = [abs(p)**2 for p in pattern]

    # Fixed-point iteration
    tolerance = 1e-15
    max_iterations = 1000
    s = 1.0

    converged = False
    final_iter = -1

    print("Starting fixed-point iteration...")
    for iteration in range(max_iterations):
        # Compute Q_i = exp(-beta * s^2 * |p_i|^2)
        unnormalized_Q = [math.exp(-beta * s**2 * e) for e in pattern_energy]
        Q_sum = sum(unnormalized_Q)
        Q = [q / Q_sum for q in unnormalized_Q]

        # Compute expected energy E[|p|²] = Σ Q_i * |p_i|²
        expected_energy = sum(Q[i] * pattern_energy[i] for i in range(M))

        # Update scaling factor: s_new = 1 / sqrt(E[|p|²])
        s_new = 1.0 / math.sqrt(expected_energy)

        # Check convergence
        delta_s = abs(s_new - s)

        if iteration < 10 or iteration % 50 == 0:
            print(f"  Iter {iteration:4d}: s={s:.17e}, E[|p|²]={expected_energy:.17e}, |Δs|={delta_s:.17e}")

        if delta_s < tolerance:
            s = s_new
            converged = True
            final_iter = iteration
            print(f"\n✅ Converged after {iteration} iterations!")
            print(f"   Final s = {s:.17e}")
            break

        s = s_new

    if not converged:
        print(f"\n❌ DID NOT CONVERGE after {max_iterations} iterations!")
        print(f"   Final s = {s:.17e}")
        print(f"   Final Δs = {delta_s:.17e}")
        print(f"   Stuck at: {delta_s / tolerance:.2f}× tolerance")

    # Apply final scaling
    X = [s * p for p in pattern]

    # Compute final Q
    X_energy = [abs(x)**2 for x in X]
    unnormalized_Q = [math.exp(-beta * e) for e in X_energy]
    Q_sum = sum(unnormalized_Q)
    Q = [q / Q_sum for q in unnormalized_Q]

    # Verify results
    print("\n" + "-"*80)
    print("VERIFICATION")
    print("-"*80)

    final_energy = sum(Q[i] * X_energy[i] for i in range(M))
    final_q_sum = sum(Q)

    print(f"\nEnergy E[|X|²] = {final_energy:.17e}")
    print(f"Error from 1.0  = {abs(final_energy - 1.0):.17e}")
    print(f"\nΣ Q_i          = {final_q_sum:.17e}")
    print(f"Error from 1.0  = {abs(final_q_sum - 1.0):.17e}")

    # Probability statistics
    min_q = min(Q)
    max_q = max(Q)
    print(f"\nQ_min = {min_q:.10e}")
    print(f"Q_max = {max_q:.10e}")
    print(f"Ratio = {max_q / min_q:.2f}")

    return {
        'converged': converged,
        'iterations': final_iter,
        'final_s': s,
        'energy': final_energy,
        'energy_error': abs(final_energy - 1.0),
        'q_sum': final_q_sum,
        'q_sum_error': abs(final_q_sum - 1.0),
        'q_min': min_q,
        'q_max': max_q
    }


if __name__ == "__main__":
    print("\n" + "="*80)
    print("PYTHON MAXWELL-BOLTZMANN: HIGH BETA VALUE TESTING")
    print("="*80)

    results = {}

    # Test 1: Standard beta (known to work)
    results['1/π'] = test_maxwell_boltzmann(16, 1.0 / math.pi, "Standard Beta (β = 1/π ≈ 0.318)")

    # Test 2: Beta = 0.5
    results['0.5'] = test_maxwell_boltzmann(16, 0.5, "Medium Beta (β = 0.5)")

    # Test 3: Beta = 1.0 (high - might fail!)
    results['1.0'] = test_maxwell_boltzmann(16, 1.0, "High Beta (β = 1.0) - May fail!")

    # Test 4: Beta = 2.0 (extreme - likely to fail!)
    results['2.0'] = test_maxwell_boltzmann(16, 2.0, "Extreme Beta (β = 2.0) - Expected to fail!")

    # Summary table
    print("\n\n" + "="*80)
    print("SUMMARY: PYTHON CONVERGENCE ACROSS BETA VALUES")
    print("="*80 + "\n")

    print(f"{'Beta':<10} {'Status':<15} {'Iterations':<12} {'Energy Error':<20}")
    print("-"*80)

    for beta_name, result in results.items():
        if result:
            status = "✅ Converged" if result['converged'] else "❌ Failed"
            iters = result['iterations'] if result['converged'] else "N/A"
            energy_err = f"{result['energy_error']:.2e}"
        else:
            status = "❌ Error"
            iters = "N/A"
            energy_err = "N/A"

        print(f"{beta_name:<10} {status:<15} {str(iters):<12} {energy_err:<20}")

    print("\n" + "="*80)
    print("CONCLUSION")
    print("="*80 + "\n")

    converged_count = sum(1 for r in results.values() if r and r['converged'])
    total_count = len(results)

    print(f"Convergence Rate: {converged_count}/{total_count} tests passed")

    if converged_count < total_count:
        print("\n⚠️ Python implementation FAILS for high beta values!")
        print("   Tolerance (1e-15) is too strict for machine epsilon at high beta.")
        print("   C++ implementation handles these cases with multi-criteria convergence.")
    else:
        print("\n✅ Python implementation handles all tested beta values!")
