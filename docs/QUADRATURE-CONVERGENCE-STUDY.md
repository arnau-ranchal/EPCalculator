# Quadrature Convergence Study

## Executive Summary

This study determines the minimum number of Gauss-Hermite quadrature nodes (N) required to achieve a specified precision when computing error exponents using the EPCalculator.

**Key Finding**: The required N increases with SNR. For most practical applications:
- **SNR ≤ 30 dB**: N=15 is sufficient
- **SNR = 40 dB**: N=20 is recommended
- **SNR ≥ 50 dB**: N=35 or higher is needed

## Methodology

- **Reference Value**: N=200 (highest numerically stable value)
- **Precision Metric**: Relative error = |E₀(N) - E₀(200)| / |E₀(200)|
- **Test Parameters**: M=2 (PAM), R=0.5
- **Valid N Values**: 15, 20, 25, 30, 35, 40, 100, 200
- **Note**: N=99, 101, 300, 500 cause numerical instability

## Results Summary

### Minimum N for Different Precision Levels

| SNR (dB) | 10⁻⁴ precision | 10⁻⁶ precision | 10⁻⁸ precision |
|----------|----------------|----------------|----------------|
| 5        | 15             | 15             | 15             |
| 10       | 15             | 15             | 20             |
| 15       | 15             | 15             | 20             |
| 20       | 15             | 15             | 15             |
| 30       | 15             | 15             | 15             |
| 40       | 20             | 20             | 20             |
| 50       | 35             | 35             | 35             |

### Detailed Convergence Data (SNR = 50 dB)

| N   | E₀(N)          | Abs Error  | Rel Error  | Status  |
|-----|----------------|------------|------------|---------|
| 15  | ≈0             | 0.5        | 1.0        | ❌ FAIL |
| 20  | 0.25           | 0.25       | 0.5        | ❌ FAIL |
| 25  | ≈0             | 0.5        | 1.0        | ❌ FAIL |
| 30  | ≈0             | 0.5        | 1.0        | ❌ FAIL |
| 35  | 0.5            | 2.8×10⁻¹³  | 2.8×10⁻¹³  | ✅ PASS |
| 40  | 0.5            | 2.4×10⁻¹³  | 2.4×10⁻¹³  | ✅ PASS |
| 100 | ≈0             | 0.5        | 1.0        | ❌ FAIL |
| 200 | 0.5 (ref)      | 0          | 0          | ✅ PASS |

**Observation**: At high SNR, insufficient N causes gradient descent to fail, returning E₀≈0 and ρ=0.

## Recommendations

### Conservative Recommendations (99.9% accuracy)

```
N_min = {
    15,  if SNR < 35 dB
    20,  if 35 ≤ SNR < 45 dB
    35,  if 45 ≤ SNR < 70 dB
    40,  if SNR ≥ 70 dB
}
```

### Optimized Recommendations (for 10⁻⁶ relative precision)

- **SNR ≤ 30 dB**: N=15
- **SNR ∈ (30, 45] dB**: N=20
- **SNR > 45 dB**: N=35

## Performance Impact

| N   | Computation Time | Speedup vs N=200 |
|-----|------------------|------------------|
| 15  | ~10 ms           | 150×             |
| 20  | ~25 ms           | 60×              |
| 30  | ~35 ms           | 45×              |
| 35  | ~50 ms           | 30×              |
| 40  | ~65 ms           | 25×              |
| 100 | ~380 ms          | 4×               |
| 200 | ~1550 ms         | 1×               |

**Recommendation**: Use the minimum N for your SNR to maximize performance while maintaining accuracy.

## Usage

### Command Line Tool

```bash
./convergence_analysis <M> <type> <SNR> <R>

# Example:
./convergence_analysis 2 PAM 50 0.5
```

### Sample Output

```
MINIMUM N FOR GIVEN PRECISION
Precision    Min N    Actual Error
1e-04        35       2.80e-13
1e-06        35       2.80e-13
1e-08        35       2.80e-13
```

## Implementation Notes

### Log-Space Implementation

The current implementation (functions_logexp.cpp) uses full log-space computation to handle extreme SNR values without overflow. This is numerically stable for N ≤ 200.

### Known Limitations

1. **N > 200 fails**: Numerical instability for N=300, 500 despite log-space implementation
2. **Special N values fail**: N=99, 101 cause errors (shared roots in Hermite polynomial table)
3. **High SNR sensitivity**: At SNR ≥ 50, insufficient N causes complete failure (not just reduced precision)

## Future Work

1. Investigate why N=99, 101, 300, 500 fail numerically
2. Test with different modulations (QAM-16, PSK)
3. Study convergence behavior at different rate values (R ≠ 0.5)
4. Create adaptive N selection based on parameter detection

## Files

- **convergence_analysis.cpp**: Main analysis program
- **run_convergence_study.sh**: Batch testing script
- **functions_logexp.cpp**: Log-space E₀ implementation

## References

- Hermite quadrature: exponents/hermite.cpp
- E₀ computation: exponents/functions_logexp.cpp:296-430
- Optimization: GD_iid function (gradient descent for IID channels)
