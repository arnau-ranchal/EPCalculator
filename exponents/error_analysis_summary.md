# Error Analysis Summary: Function Expansion Perspective

## Core Concept

**Quadrature = Finite approximation of infinite function expansion**

Every quadrature method implicitly approximates the integrand using a specific basis:
- **Finite sum**: What we compute
- **Infinite tail**: Error from missing terms

---

## 1. Gauss-Hermite: Hermite Polynomial Truncation

### Function Expansion
```
f(t) = c₀H₀(t) + c₁H₁(t) + c₂H₂(t) + ... + c_∞H_∞(t)
       └─────── GH with N nodes ──────┘   └── ERROR ──┘
       captures first 2N terms            missing terms
```

### What We Compute
$$\int_{-\infty}^{\infty} e^{-t^2} \sum_{n=0}^{2N-1} c_n H_n(t) \, dt$$

### Error (Missing Terms)
$$\text{Error} = \int_{-\infty}^{\infty} e^{-t^2} \sum_{n=2N}^{\infty} c_n H_n(t) \, dt$$

### For Our Integrand

**Hermite coefficient decay**: $|c_n| \sim e^{-\alpha n}$ (exponential)

**Why?** Our integrand is:
- ✅ **Analytic** (infinitely differentiable)
- ✅ **Smooth** (no discontinuities)
- ✅ **Gaussian-weighted** (natural for Hermite basis)

**Error bound**:
$$\text{Error} \lesssim C \cdot e^{-\beta N}$$

**Numerical observation**:
```
N=10:  error ~ 10⁻⁶     (first 20 Hermite terms)
N=20:  error ~ 10⁻¹⁴    (first 40 terms)
N=30:  error ~ 10⁻¹⁶    (machine precision!)
```

**Interpretation**:
- At N=20: Terms $c_n$ for $n \geq 40$ contribute < 10⁻¹⁴
- At N=30: Terms $c_n$ for $n \geq 60$ are below machine precision
- Further terms exist mathematically but are numerically irrelevant

---

## 2. Sinh-Sinh: Sinc Function Truncation

### Function Expansion (Whittaker-Shannon)
```
f(x) = ... + f(-2h)·sinc() + f(-h)·sinc() + f(0)·sinc() + f(h)·sinc() + f(2h)·sinc() + ...
              └──────────── K nodes ────────────┘  └────────── ERROR ──────────┘
              finite sum computed                   infinite tail
```

### What We Compute
$$\sum_{k=-K}^{K} f(kh) \cdot \text{sinc}\left(\frac{x-kh}{h}\right)$$

### Error (Missing Terms)
$$\text{Error} = \sum_{|k| > K} f(kh) \cdot \text{sinc}\left(\frac{x-kh}{h}\right)$$

### For Our Integrand

**Sample decay**: With Gaussian weight added:
$$f(kh) = e^{-k^2 h^2/(2\sigma^2)} \cdot h(kh)$$

**Decay rate**: $f(kh) \sim e^{-k^2}$ (Gaussian, super-exponential!)

**The Problem**:
```
k=0:   f(0)  ~ 1.0        ✓ Computable
k=±5:  f(5h) ~ 10⁻¹⁰      ✓ Computable
k=±10: f(10h) ~ 10⁻⁴⁰     ⚠ Near underflow
k=±15: f(15h) ~ 10⁻⁹⁰     ✗ Underflows to 0
k=±20: f(20h) ~ 10⁻¹⁶⁰    ✗ Complete loss
```

**Why it fails**:
1. Sinc basis designed for $f(x) \sim e^{-\alpha|x|}$ (exponential)
2. Our $f(x) \sim e^{-x^2}$ (Gaussian) decays **too fast**
3. Samples at large $|k|$ numerically underflow
4. Division/multiplication with very small numbers → NaN

**Theoretical error**: Should be small (Gaussian tail)
**Numerical reality**: Cannot compute samples → method breaks

---

## 3. Visual Comparison

### Gauss-Hermite Node Placement
```
              Integrand: exp(-t²) · h(t)
               ___
              /   \
             /     \
      ______/       \______
   -3  -2  -1   0   1   2   3  ← t axis
        ●   ●   ●   ●   ●       ← GH nodes (N=5)

Dense where integrand is large ✓
Few nodes in tails (exponentially small contribution) ✓
All nodes numerically accessible ✓
```

### Sinh-Sinh Node Placement
```
              Integrand: exp(-x²) · h(x)
               ___
              /   \
             /     \
      ______/       \________________________...
   -10  -5   0   5   10   50   100   500  ← x axis
    ●   ●   ●   ●   ●    ●     ●      ●   ← SS nodes
    ↑                            ↑
    |                            └─ exp(-500²) ≈ 0 (underflow!)
    └─ exp(-100) ~ 10⁻⁴³ (near underflow)

Nodes extend to regions where integrand = 0 numerically ✗
Wasted computation on irrelevant regions ✗
Numerical instability from tiny values ✗
```

---

## 4. The "Infinite Terms" Question

### Gauss-Hermite Perspective

**Question**: What about the Hermite coefficients $c_n$ for $n \geq 2N$?

**Answer**:
- They **exist mathematically** (infinite series is exact)
- They **decay exponentially**: $|c_n| \sim e^{-\alpha n}$
- At N=30: $|c_n|$ for $n > 60$ is $< 10^{-16}$ (below machine $\epsilon$)
- These terms are **numerically irrelevant** but **theoretically well-defined**

**Analogy**: Like measuring distance with a ruler marked in nanometers - beyond your precision, terms exist but can't be measured.

### Sinh-Sinh Perspective

**Question**: What about the sinc samples $f(kh)$ for $|k| > K$?

**Answer**:
- They **should be small** (Gaussian tail)
- BUT: They're so small they **underflow to 0** numerically
- Cannot compute $e^{-k^2}$ for large $k$ without losing precision
- These terms are **ill-defined numerically** even if **small theoretically**

**Analogy**: Like trying to weigh atoms with a bathroom scale - the scale breaks before you measure anything meaningful.

---

## 5. Why "It Doesn't Make Sense" for Sinh-Sinh

You correctly intuited this! For sinh-sinh applied to Gaussian integrals:

**Theoretical perspective**:
- ✓ Error formula exists
- ✓ Infinite tail should be small
- ✓ Convergence theory applies (in principle)

**Numerical reality**:
- ✗ Cannot evaluate samples at large nodes
- ✗ Underflow destroys computation before convergence observed
- ✗ Theory assumes arbitrary precision (not IEEE float64)

**The mismatch**: Sinh-sinh theory requires:
$$|f(kh)| \text{ small but computable for large } |k|$$

But for Gaussian decay:
$$|f(kh)| < \epsilon_{machine} \text{ for moderate } |k|$$

**It "doesn't make sense"** because:
- Mathematical theory: "Error is sum of small terms" ✓
- Numerical practice: "Cannot compute the small terms" ✗

---

## 6. Rigorous Error Bounds

### Gauss-Hermite

For analytic $f$ in strip $|\text{Im}(z)| < d$:

$$|\text{Error}| \leq \frac{M}{\sqrt{N}} \exp(-2\pi d\sqrt{N})$$

**Our case** (SNR=4, ρ=1):
- Empirical: Error(N=20) ~ 10⁻¹⁴
- Fits: $M \cdot \exp(-c N)$ with $c \approx 0.8$

### Sinh-Sinh (When It Works)

For $f(x) \sim e^{-\alpha|x|}$ with $\alpha > 0$:

$$|\text{Error}| \lesssim C \exp\left(-\frac{c_1 N}{\log N}\right)$$

**Our case** (Gaussian decay):
- Theory: Not applicable ($e^{-x^2} \not\sim e^{-\alpha|x|}$)
- Practice: NaN (numerical breakdown)

---

## 7. Practical Implications

### For E₀ Computation

**Recommendation**: Gauss-Hermite with N=20-50

**Why this N range?**
- **N=20**: Captures ~40 Hermite coefficients
  - Error ~ 10⁻¹⁴ (more than sufficient)
  - Time ~ 150-200 μs

- **N=30**: Captures ~60 Hermite coefficients
  - Error ~ 10⁻¹⁶ (machine precision)
  - Time ~ 200-300 μs
  - **Optimal** for production

- **N=50**: Captures ~100 Hermite coefficients
  - Error ~ 10⁻¹⁶ (no improvement over N=30)
  - Time ~ 300-400 μs
  - Overkill (wasted computation)

**The "missing infinite terms"** for N=30:
- Hermite coefficients $\{c_{60}, c_{61}, c_{62}, ...\}$
- Magnitude: $< 10^{-16}$ each
- Contribution: Below machine precision
- Can be **safely ignored**

### For Other Problems

**If your integrand has**:
- Gaussian weight $e^{-x^2}$ → **Use Gauss-Hermite**
- Exponential weight $e^{-|x|}$ → Use Gauss-Laguerre or Sinh-sinh
- Algebraic decay $1/x^p$ → Use Tanh-sinh
- Bounded support $[a,b]$ → Use Gauss-Legendre

**The key**: Match method to integrand's natural function space!

---

## 8. Summary Table

| Aspect | Gauss-Hermite | Sinh-Sinh |
|--------|---------------|-----------|
| **Basis** | Hermite polynomials | Sinc functions |
| **Natural for** | Gaussian decay | Exponential decay |
| **Infinite terms** | $\sum_{n \geq 2N} c_n H_n$ | $\sum_{|k|>K} f(kh)$ sinc |
| **Term decay** | $e^{-\alpha n}$ | $e^{-k^2}$ (too fast!) |
| **Error** | $\sim e^{-\beta N}$ | NaN (underflow) |
| **For our problem** | ✓ **Perfect** | ✗ **Fails** |
| **N for 10⁻¹⁴** | 20 | Impossible |
| **Computation time** | ~200 μs | - |

---

## Conclusion

**Gauss-Hermite interprets quadrature as**:
- Truncated Hermite polynomial expansion
- Missing terms decay exponentially
- Error quantifiable and predictable
- Numerically stable

**Sinh-sinh interprets quadrature as**:
- Truncated sinc function expansion
- Missing terms should be small (Gaussian tail)
- BUT: Cannot compute them numerically
- Theory valid, practice fails

**For your E₀ computation**: Gauss-Hermite captures all numerically relevant information with N=20-30. The "infinite terms beyond" exist mathematically but contribute less than machine precision.
