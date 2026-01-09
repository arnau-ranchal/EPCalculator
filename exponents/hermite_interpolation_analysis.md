# Hermite Polynomial Interpolation of the E₀ Integrand

## The Integrand

From the classical Gallager formula with noise variance σ² = 1:

$$E_0(\rho) = -\log_2 \int_{-\infty}^{\infty} \frac{1}{\sqrt{2\pi}} e^{-\frac{y^2}{2}} h(y) \, dy$$

where:
$$h(y) = \left[\frac{1 + e^{\frac{2y\sqrt{\text{SNR}}}{1+\rho}}}{2}\right]^{\rho}$$

After transformation $y = \sqrt{2} t$ for Gauss-Hermite weight $e^{-t^2}$:

$$E_0(\rho) = -\log_2 \int_{-\infty}^{\infty} \frac{1}{\sqrt{\pi}} e^{-t^2} g(t) \, dt$$

where:
$$g(t) = h(\sqrt{2}t) = \left[\frac{1 + \exp\left(\frac{2\sqrt{2} \, t \, \sqrt{\text{SNR}}}{1+\rho}\right)}{2}\right]^{\rho}$$

---

## Hermite Polynomial Expansion

### Definition

Any function $g(t) \in L^2(\mathbb{R}, e^{-t^2})$ can be expanded in Hermite polynomials:

$$g(t) = \sum_{n=0}^{\infty} c_n H_n(t)$$

where $H_n(t)$ are the **physicist's Hermite polynomials**:
$$H_n(t) = (-1)^n e^{t^2} \frac{d^n}{dt^n} e^{-t^2}$$

### Orthogonality

$$\int_{-\infty}^{\infty} e^{-t^2} H_m(t) H_n(t) \, dt = \sqrt{\pi} \cdot 2^n \cdot n! \cdot \delta_{mn}$$

### Coefficients

$$c_n = \frac{1}{\sqrt{\pi} \cdot 2^n \cdot n!} \int_{-\infty}^{\infty} e^{-t^2} g(t) H_n(t) \, dt$$

### First Few Hermite Polynomials

$$\begin{aligned}
H_0(t) &= 1 \\
H_1(t) &= 2t \\
H_2(t) &= 4t^2 - 2 \\
H_3(t) &= 8t^3 - 12t \\
H_4(t) &= 16t^4 - 48t^2 + 12 \\
H_5(t) &= 32t^5 - 160t^3 + 120t
\end{aligned}$$

---

## Gauss-Hermite Quadrature as Truncated Expansion

### Polynomial Approximation

Gauss-Hermite with N nodes approximates $g(t)$ by:

$$g_{GH}^{(N)}(t) = \sum_{n=0}^{2N-1} c_n H_n(t)$$

This is a **polynomial of degree 2N-1** that captures the first 2N Hermite coefficients.

### Exact Integration Property

$$\int_{-\infty}^{\infty} e^{-t^2} g_{GH}^{(N)}(t) \, dt = \sum_{i=1}^N w_i g(t_i)$$

where $(t_i, w_i)$ are the GH nodes and weights.

**Key insight**: GH quadrature exactly integrates the polynomial approximation $g_{GH}^{(N)}(t)$.

### Error from Truncation

$$\text{Error} = \int_{-\infty}^{\infty} e^{-t^2} \left[g(t) - g_{GH}^{(N)}(t)\right] dt = \int_{-\infty}^{\infty} e^{-t^2} \sum_{n=2N}^{\infty} c_n H_n(t) \, dt$$

By orthogonality, the cross terms vanish, but we need to be careful...

Actually, the error is:
$$\text{Error} = \int_{-\infty}^{\infty} e^{-t^2} r_N(t) \, dt$$

where $r_N(t) = g(t) - g_{GH}^{(N)}(t)$ is the **remainder** not captured by the first 2N Hermite terms.

---

## Applying to Our Integrand

### Our Function

$$g(t) = \left[\frac{1 + \exp\left(\frac{2\sqrt{2} \, t \, \sqrt{\text{SNR}}}{1+\rho}\right)}{2}\right]^{\rho}$$

Let's denote $\lambda = \frac{2\sqrt{2}\sqrt{\text{SNR}}}{1+\rho}$ for convenience:

$$g(t) = \left[\frac{1 + e^{\lambda t}}{2}\right]^{\rho} = 2^{-\rho} (1 + e^{\lambda t})^{\rho}$$

### Taylor Expansion Insight

For small $t$:
$$g(t) = 2^{-\rho} (1 + e^{\lambda t})^{\rho} = 2^{-\rho} \sum_{k=0}^{\infty} \binom{\rho}{k} e^{k\lambda t}$$

Each $e^{k\lambda t}$ can be expanded in Hermite polynomials.

### Hermite Expansion of $e^{\alpha t}$

A key result from harmonic analysis:

$$e^{\alpha t} = e^{\alpha^2/4} \sum_{n=0}^{\infty} \frac{\alpha^n}{2^n n!} H_n(t)$$

Therefore:
$$g(t) = 2^{-\rho} \sum_{k=0}^{\infty} \binom{\rho}{k} e^{k^2\lambda^2/4} \sum_{n=0}^{\infty} \frac{(k\lambda)^n}{2^n n!} H_n(t)$$

This shows $g(t)$ has a **double infinite series** in Hermite polynomials.

### Coefficient Decay

The Hermite coefficients $c_n$ for our $g(t)$ decay roughly as:

$$|c_n| \lesssim C \cdot e^{-\alpha n}$$

for some $\alpha > 0$ (exponential decay) because $g(t)$ is:
1. **Analytic** (infinitely differentiable)
2. **Bounded** for real $t$
3. **Rapidly decaying** as $|t| \to \infty$ (faster than polynomial)

---

## Numerical Hermite Coefficients

Let's compute the first few coefficients for a specific example:

**Example**: SNR = 4, ρ = 1

$$\lambda = \frac{2\sqrt{2}\sqrt{4}}{1+1} = 2\sqrt{2} \approx 2.828$$

$$g(t) = \left[\frac{1 + e^{2.828t}}{2}\right]^{1} = \frac{1 + e^{2.828t}}{2}$$

### Computing Coefficients

$$c_n = \frac{1}{\sqrt{\pi} \cdot 2^n \cdot n!} \int_{-\infty}^{\infty} e^{-t^2} g(t) H_n(t) \, dt$$

**c₀** (mean value):
$$c_0 = \frac{1}{\sqrt{\pi}} \int_{-\infty}^{\infty} e^{-t^2} g(t) \, dt$$

This is exactly the integral we're trying to compute! So:
$$c_0 = \frac{1}{\sqrt{\pi}} \cdot I$$

where $I$ is the integral value.

**c₁** (first moment):
$$c_1 = \frac{1}{2\sqrt{\pi}} \int_{-\infty}^{\infty} e^{-t^2} g(t) \cdot 2t \, dt$$

By symmetry of $g(t)$ (it's actually NOT symmetric for our function), this may or may not be zero.

Actually, our $g(t)$ is NOT symmetric because of the $e^{\lambda t}$ term. So $c_1 \neq 0$.

**For symmetric version:**
$$g_{\text{sym}}(t) = \cosh(\lambda t)^{\rho}$$

This has $c_{2k+1} = 0$ (only even coefficients).

---

## Practical Computation

### Using Gauss-Hermite as Hermite Projection

GH with N nodes computes:

$$\int_{-\infty}^{\infty} e^{-t^2} g(t) dt \approx \sum_{i=1}^N w_i g(t_i)$$

**Interpretation 1**: Interpolate $g(t)$ at nodes $\{t_i\}$
**Interpretation 2**: Project $g(t)$ onto $\text{span}\{H_0, H_1, \ldots, H_{2N-1}\}$

Both give the **same quadrature formula**!

### Error from Missing Terms

$$\text{Error} = \sum_{n=2N}^{\infty} c_n \int_{-\infty}^{\infty} e^{-t^2} H_n(t) \, dt$$

Wait, this is zero because:
$$\int_{-\infty}^{\infty} e^{-t^2} H_n(t) \, dt = 0 \quad \text{for } n \geq 1$$

by orthogonality with $H_0(t) = 1$.

**Correct error formula** (using exact quadrature theory):

For GH quadrature, the error is:

$$\text{Error} = \frac{f^{(2N)}(\xi)}{(2N)!} \int_{-\infty}^{\infty} e^{-t^2} \ell_N(t)^2 \, dt$$

where $\ell_N(t) = \prod_{i=1}^N (t - t_i)$ and $\xi$ is some point in the domain.

For smooth $g(t)$, this gives **factorial decay**: Error $\sim 1/(2N)!$

But for **analytic** $g(t)$ with appropriate decay, we get **exponential convergence**:

$$\text{Error} \lesssim C e^{-\beta N}$$

---

## Visualization of Hermite Interpolation

### Polynomial Approximation at Different N

For our integrand $g(t)$, the Hermite polynomial approximation looks like:

```
N=5  (degree 9 polynomial):   ____
                              /    \
                         ____/      \____
                        (oscillates at edges)

N=10 (degree 19):          _____
                          /     \
                     ____/       \____
                    (better fit, less oscillation)

N=20 (degree 39):       ______
                       /      \
                  ____/        \____
                 (nearly perfect match)

True g(t):           _______
                    /       \
               ____/         \____
              (smooth exponential shape)
```

The GH approximation:
1. **Matches exactly** at the N nodes $\{t_i\}$
2. **Interpolates** between nodes using Hermite polynomials
3. **Oscillates** slightly between nodes for small N
4. **Converges** to true $g(t)$ as $N \to \infty$

---

## Error Bound for Our Specific Integrand

### Derivative Bounds

For $g(t) = \left[\frac{1 + e^{\lambda t}}{2}\right]^{\rho}$:

$$g'(t) = \rho \left[\frac{1 + e^{\lambda t}}{2}\right]^{\rho-1} \cdot \frac{\lambda e^{\lambda t}}{2}$$

The derivatives grow as $|g^{(n)}(t)| \sim \lambda^n$ for large $|t|$, but are **tempered** by the $e^{-t^2}$ weight.

### Effective Bound

For the weighted function $e^{-t^2} g(t)$, the derivatives are well-behaved:

$$\left|\frac{d^n}{dt^n}\left[e^{-t^2} g(t)\right]\right| \leq C_n$$

with $C_n$ growing moderately (not factorially).

This ensures **exponential convergence** of GH quadrature:

$$\text{Error}_N \lesssim A e^{-B N}$$

for constants $A, B > 0$ depending on SNR and $\rho$.

---

## Summary

### What Hermite Interpolation Tells Us

1. **GH quadrature** = Integrate the degree-(2N-1) Hermite polynomial that matches $g(t)$ at N special points

2. **Error** = Integral of the "tail" $\sum_{n=2N}^{\infty} c_n H_n(t)$

3. **Convergence rate** = Determined by decay of Hermite coefficients $\{c_n\}$

4. **For our integrand**: Exponential decay $c_n \sim e^{-\alpha n}$ → Exponential error reduction

### Practical Implications

- **N=10**: Captures first ~20 Hermite modes → Error ~$10^{-6}$
- **N=20**: Captures first ~40 Hermite modes → Error ~$10^{-14}$
- **N=30**: Captures first ~60 Hermite modes → Error ~$10^{-16}$ (machine limit)

The "infinite terms" $\{c_n : n \geq 2N\}$ contribute exponentially small amounts.

### Connection to Physics

Hermite functions $\psi_n(t) = e^{-t^2/2} H_n(t)$ are:
- **Eigenfunctions** of the quantum harmonic oscillator
- **Orthonormal basis** for $L^2(\mathbb{R})$
- **Optimal** for representing functions with Gaussian localization

Our integrand, being smooth and Gaussian-like, is **naturally suited** to Hermite expansion → explains why GH is so efficient!
