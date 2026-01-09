# Comparison: General Gallager Formula vs Simplified Formula for 2-PAM

## Executive Summary

This document compares two different formulations for computing error exponents in 2-PAM AWGN channels:
1. **General Gallager Formula** (from information theory literature)
2. **Simplified Formula** (from previous session implementations)

**Key Finding**: These formulas compute **different quantities** and cannot be directly compared without understanding their underlying assumptions about noise variance.

---

## Formula Definitions

### General Gallager Formula (Natural Gaussian)

$$E_0^{\text{iid}}(\rho) = -\log_2 \sum_{x\in \{-1,+1\}} \frac{Q(x)}{\pi}\int_{z \in \mathbb{R}} e^{-|z|^2}\left(\frac{\sum_{\bar{x} \in \{-1,+1\}}Q(\bar{x})\left(\frac{1}{\pi}e^{-|z+\sqrt{\text{snr}}(x-\bar{x})|^2}\right)^{\frac{1}{1+\rho}}}{\left(\frac{1}{\pi}e^{-|z|^2}\right)^{\frac{1}{1+\rho}}}\right)^\rho dz$$

**Properties**:
- Uses **natural Gaussian** measure: $(1/\sqrt{\pi})e^{-z^2}$
- Noise variance: $\sigma^2 = 1/2$
- Averages over transmitted symbols: $\mathbb{E}_X[I_X]$
- Standard random coding error exponent from Gallager (1968)

**Simplified form for 2-PAM** ($Q(x) = 1/2$):
$$E_0(\rho) = -\log_2 \left[\frac{1}{\sqrt{\pi}} \int_{-\infty}^{\infty} e^{-z^2} \left(\frac{1 + e^{-\frac{4z\sqrt{\text{SNR}} + 4\text{SNR}}{1+\rho}}}{2}\right)^\rho dz\right]$$

### Simplified Formula (Standard Gaussian)

$$E_0(\rho) = -\log_2 \left[\int_{-\infty}^{\infty} \frac{1}{\sqrt{2\pi}} e^{-z^2/2} \left(\frac{1 + e^{\frac{4\sqrt{\text{SNR}}(z - \sqrt{\text{SNR}})}{1+\rho}}}{2}\right)^\rho dz\right]$$

**Properties**:
- Uses **standard Gaussian** measure: $(1/\sqrt{2\pi})e^{-z^2/2}$
- Noise variance: $\sigma^2 = 1$
- Conditions on specific transmitted symbol (no averaging)
- Origin unclear from previous session

---

## Numerical Comparison

### Test Case: ρ = 0.73, SNR = 1.0

| Formula | E₀ Value | Noise Variance | Physical Interpretation |
|---------|----------|----------------|------------------------|
| **General** | 0.431502 | σ² = 1/2 | SNR_ratio = 2.0 dB |
| **Simplified** | 0.054694 | σ² = 1 | SNR_ratio = 0.0 dB |

**Difference**: ΔE₀ = 0.377 (substantial!)

These represent **different physical channels** due to noise variance difference.

---

## Quadrature Implementation Comparison

### General Formula - Optimal Method

**Winner: Gauss-Hermite** ✓

The natural Gaussian weight $e^{-z^2}$ matches Gauss-Hermite quadrature weight perfectly.

| N | Time (μs) | Error | Efficiency |
|---|-----------|-------|------------|
| 10 | 658 | 8.4e-08 | ★★★★☆ |
| 30 | 914 | 4.8e-14 | ★★★★★ |
| 56 | 1594 | 9.7e-15 | ★★★★★ |

**Recommendation**: Use N=30-50 for production (1e-10 to 1e-14 accuracy in <1 ms)

### Simplified Formula - Previous Findings

From previous session benchmarks:

**Winner: Sinh-sinh for high accuracy**, Gauss-Hermite for speed

| Method | Accuracy | Time (μs) | Notes |
|--------|----------|-----------|-------|
| GH (N=25) | 1e-6 | 246 | Fastest for low accuracy |
| GH (N=∞) | ~1e-10 | N/A | Plateaus (method-limited) |
| SS (level=4) | 1e-12 | 1952 | Best for high accuracy |
| SS (level=5) | 4e-17 | 2396 | Machine precision |

---

## Mathematical Relationship

### Noise Variance Scaling

For the **same physical channel** (same signal-to-noise ratio):

$$\text{SNR}_{\text{general}} = \frac{\text{SNR}_{\text{simplified}}}{2}$$

Because:
- General: $\text{SNR ratio} = \frac{P_{\text{signal}}}{\sigma^2} = \frac{\text{SNR}}{1/2} = 2 \cdot \text{SNR}$
- Simplified: $\text{SNR ratio} = \frac{P_{\text{signal}}}{\sigma^2} = \frac{\text{SNR}}{1} = \text{SNR}$

### Coordinate Transformation

Converting simplified formula to natural Gaussian coordinates ($z = \sqrt{2} \cdot z'$):

$$h(\sqrt{2} \cdot z') = \left[\frac{1 + e^{\frac{4\sqrt{2 \cdot \text{SNR}} \cdot z' - 4\text{SNR}}{1+\rho}}}{2}\right]^\rho$$

This shows the formulas have **incompatible scaling**: the $z$ coefficient scales by $\sqrt{2}$ but the constant term doesn't, preventing simple equivalence.

---

## Conclusions

### 1. Formula Equivalence
❌ **Not equivalent**: The formulas compute different error exponents even after accounting for noise variance conventions.

### 2. Optimal Quadrature Methods

| Formula | Best Method | Why? |
|---------|------------|------|
| **General** | **Gauss-Hermite** | Weight $e^{-z^2}$ matches perfectly, N=30-50 achieves machine precision |
| **Simplified** | **Sinh-sinh** (high acc) <br> **Gauss-Hermite** (speed) | GH plateaus at 1e-10, sinh-sinh reaches 1e-17 |

### 3. Implementation Recommendations

**For General Formula (Your Formula)**:
```python
# Use Gauss-Hermite with N=30-50
nodes, weights = roots_hermite(N)
for t, w in zip(nodes, weights):
    # Compute directly with weight e^{-t²}
    inner_sum = ...
    integral += w * inner_sum**rho
integral /= np.sqrt(np.pi)
```

**For Simplified Formula** (if needed):
```python
# Low accuracy (<1e-6): Use Gauss-Hermite with N=20-30
# High accuracy (>1e-10): Use sinh-sinh with level=4-5
```

### 4. Theoretical Significance

- **General formula**: Standard Gallager bound, well-established in information theory
- **Simplified formula**: Origin unclear, may be alternative formulation or approximation

Both are mathematically valid but compute error exponents for channels with **different noise variances**.

---

## References

- Gallager, R. G. (1968). *Information Theory and Reliable Communication*
- This analysis: `/home/arnau/Documents/tfg/EPCalculator/exponents/` (2025-11-17)

---

## Files Generated

1. `compare_general_vs_simplified.py` - Initial comparison (corrected)
2. `verify_snr_conversion.py` - SNR scaling analysis
3. `analyze_formula_difference.py` - Deep structural analysis
4. `comprehensive_comparison.py` - Quadrature method comparison
5. `general_formula_quadrature.py` - Performance benchmarks for general formula
6. `COMPARISON_SUMMARY.md` - This document
