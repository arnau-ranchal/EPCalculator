#!/usr/bin/env python3
"""
Fixed-point iteration for Maxwell-Boltzmann distribution
16-QAM constellation with beta=1/π
Pure Python (no numpy)
"""

import math
import cmath

# Parameters
M = 16  # 16-QAM
beta = 1.0 / math.pi
tolerance = 1e-15
max_iterations = 1000

# Create standard QAM pattern (before normalization)
# For M-QAM: L = sqrt(M), delta = sqrt(3/(2*(L^2-1)))
L = int(math.sqrt(M))
if L * L != M:
    print(f"Error: M={M} is not a perfect square")
    exit(1)

delta = math.sqrt(3.0 / (2.0 * (L * L - 1)))
print(f"L = {L}, Delta: {delta:.20f}")

# Standard QAM constellation (symmetric around origin)
# Grid: I and Q components from -(L-1) to +(L-1) in steps of 2
pattern = []
for i in range(L):
    for j in range(L):
        I_comp = (2 * i - L + 1) * delta
        Q_comp = (2 * j - L + 1) * delta
        pattern.append(complex(I_comp, Q_comp))

print(f"\nInitial pattern p (16-QAM):")
for i, p in enumerate(pattern):
    print(f"  p[{i:2d}] = {p.real:+.10f} {p.imag:+.10f}j")

# Energy of pattern (|p|² = real² + imag²)
pattern_energy = [abs(p)**2 for p in pattern]
print(f"\nPattern energy |p|²:")
for i, e in enumerate(pattern_energy):
    print(f"  |p[{i:2d}]|² = {e:.20f}")

# Fixed-point iteration
s = 1.0
print(f"\n{'Iter':>4} {'s':>25} {'E[|p|²]':>25} {'|s_new - s|':>25}")
print("-" * 85)

for iteration in range(max_iterations):
    # Compute probabilities Q_i = exp(-beta * s^2 * |p_i|^2)
    unnormalized_Q = [math.exp(-beta * s**2 * e) for e in pattern_energy]
    Q_sum = sum(unnormalized_Q)
    Q = [q / Q_sum for q in unnormalized_Q]

    # Compute expected energy E[|p|²] = Σ Q_i * |p_i|²
    expected_energy = sum(Q[i] * pattern_energy[i] for i in range(M))

    # Update scaling factor: s_new = 1 / sqrt(E[|p|²])
    s_new = 1.0 / math.sqrt(expected_energy)

    # Check convergence
    delta_s = abs(s_new - s)

    if iteration < 20 or iteration % 10 == 0 or delta_s < tolerance:
        print(f"{iteration:4d} {s:25.20f} {expected_energy:25.20f} {delta_s:25.2e}")

    if delta_s < tolerance:
        print(f"\nConverged after {iteration} iterations!")
        s = s_new
        break

    s = s_new
else:
    print(f"\nWarning: Did not converge after {max_iterations} iterations")

# Final results
print("\n" + "="*85)
print("FINAL RESULTS")
print("="*85)

# Final constellation points
X = [s * p for p in pattern]
print(f"\nFinal scaling factor s = {s:.20f}")
print(f"For reference: √3 = {math.sqrt(3):.20f}")
print(f"\nConstellation Points X (16-QAM):")
for i, x in enumerate(X):
    print(f"  X[{i:2d}] = {x.real:+.15f} {x.imag:+.15f}j")

# Final probabilities
unnormalized_Q = [math.exp(-beta * s**2 * e) for e in pattern_energy]
Q_sum = sum(unnormalized_Q)
Q = [q / Q_sum for q in unnormalized_Q]
print(f"\nProbabilities Q:")
for i, q in enumerate(Q):
    print(f"  Q[{i}] = {q:.20f}")

# Verification
print("\n" + "="*85)
print("VERIFICATION")
print("="*85)

# Check 1: Grid structure (show unique I and Q coordinates)
I_coords = sorted(set(x.real for x in X))
Q_coords = sorted(set(x.imag for x in X))
print(f"\nGrid structure:")
print(f"  Unique I coordinates: {[f'{c:.6f}' for c in I_coords]}")
print(f"  Unique Q coordinates: {[f'{c:.6f}' for c in Q_coords]}")
print(f"  Grid spacing I: {I_coords[1] - I_coords[0]:.15f}")
print(f"  Grid spacing Q: {Q_coords[1] - Q_coords[0]:.15f}")

# Check 2: Q proportional to exp(-beta*|X|²)
X_energy = [abs(x)**2 for x in X]
print(f"\nFinal constellation energy |X|²:")
for i, e in enumerate(X_energy):
    print(f"  |X[{i}]|² = {e:.20f}")

print(f"\nVerify Q ∝ exp(-β|X|²) (sample of 10 pairs):")
# Check a representative sample to avoid too much output
sample_pairs = [(0, 5), (0, 10), (0, 15), (1, 6), (5, 10), (7, 8), (3, 12), (2, 14), (4, 11), (6, 9)]
for i, j in sample_pairs:
    if i < len(Q) and j < len(Q):
        ratio_Q = Q[j] / Q[i]
        ratio_expected = math.exp(-beta * (X_energy[j] - X_energy[i]))
        error = abs(ratio_Q - ratio_expected)
        print(f"  Q[{j:2d}]/Q[{i:2d}] = {ratio_Q:.12f}, exp(-β(|X[{j:2d}]|² - |X[{i:2d}]|²)) = {ratio_expected:.12f}, error = {error:.2e}")

# Check 3: Average energy E[|X|²] = 1
avg_energy = sum(Q[i] * X_energy[i] for i in range(M))
print(f"\nAverage energy E[|X|²] = {avg_energy:.20f}")
print(f"Error from 1.0: {abs(avg_energy - 1.0):.2e}")

# Check 4: Probabilities sum to 1
prob_sum = sum(Q)
print(f"\nSum of probabilities: {prob_sum:.20f}")
print(f"Error from 1.0: {abs(prob_sum - 1.0):.2e}")
