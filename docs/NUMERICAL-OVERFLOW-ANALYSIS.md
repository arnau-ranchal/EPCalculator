# Numerical Overflow Analysis: Error Exponent Becoming 0

## Problem Statement

When computing error exponents with:
- **High SNR** (e.g., SNR > 10)
- **High N (Quadrature Points)** (e.g., N > 50)

The error exponent (`E0`) incorrectly becomes 0, when it should be a positive value.

## Root Cause Analysis

### Code Flow

1. **exponents.cpp:26** computes error probability as:
   ```cpp
   results[0] = pow(2, -n*e0);  // Pe (error probability)
   results[1] = e0;              // error exponent
   ```

2. **e0** is computed by `GD_iid()` → `GD_co()` → `E_0_co()`

3. **E_0_co() (lines 655-704)** computes:
   ```cpp
   // Line 657: Compute log probabilities
   Eigen::VectorXd logqg2 = (Q_mat.transpose() *
       ((-1.0 / (1.0 + rho)) * D_mat.array()).exp().matrix())
       .array().log();

   // Line 667: OVERFLOW RISK - exponential of large values
   Eigen::VectorXd qg2rho = (rho * logqg2.array()).exp();

   // Line 668: OVERFLOW RISK - exponential of D_mat
   Eigen::MatrixXd pig1_mat = PI_mat.array() *
       ((rho / (1.0 + rho)) * D_mat.array()).exp();

   // Line 687-690: Compute moments (can overflow)
   double m = (Q_mat.transpose() * pig1_mat * qg2rho).sum();
   double mp = (Q_mat.transpose() * pig1_mat *
       (qg2rho.array() * logqg2.array()).matrix()).sum()
       - (1.0 / (1.0 + rho)) * ...;

   // Line 695-696: Compute F0
   double F0 = m / PI;
   double Fder0 = mp / PI;

   // Line 704: UNDERFLOW RISK - if F0 is too small
   E0 = -log2(F0);
   ```

### The Numerical Overflow Problem

#### 1. **Exponential Overflow in qg2rho**

When SNR is high:
- `D_mat` contains large positive values (proportional to SNR)
- `logqg2` can contain large values
- `rho * logqg2` can exceed 700
- `exp(700)` ≈ 1.6 × 10^304 (near double overflow at 1.8 × 10^308)
- `exp(> 709)` **overflows to infinity**

**Evidence:** Lines 662-666 check for this:
```cpp
if (abs(rho * max_log) > 700) {
    std::cout << "err1: Exponentiation overflow/underflow risk: " << rho * max_log << "\n";
}
```

#### 2. **Exponential Overflow in pig1_mat**

```cpp
Eigen::MatrixXd pig1_mat = PI_mat.array() * ((rho / (1.0 + rho)) * D_mat.array()).exp();
```

- `D_mat` contains distances/divergences proportional to SNR
- High SNR → large D_mat values
- `exp(D_mat)` can overflow to infinity

#### 3. **Cascading Errors**

When either exponential overflows:
- `m = (Q_mat.transpose() * pig1_mat * qg2rho).sum()` becomes infinity
- `F0 = m / PI` becomes infinity (or 0 if there's catastrophic cancellation)
- `E0 = -log2(F0)` becomes:
  - `log2(infinity) = infinity` → stored as `inf` in float
  - `log2(0) = -infinity` → stored as `-inf` in float
  - FFI interface may read `inf` as 0 or NaN

#### 4. **Float Precision Loss**

The results array uses **32-bit float**:
```cpp
float* exponents(float M, const char* typeM, float SNR, float R, float N, float n,
                 float threshold, float* results)
```

32-bit float limits:
- Max value: ~3.4 × 10^38
- Min positive: ~1.2 × 10^-38
- Infinity and NaN are represented by special bit patterns
- When JavaScript reads these via FFI, they may become 0

### Why It Happens with High N

Higher N (more quadrature points) means:
1. **Finer numerical integration** → more terms in sums
2. **Larger matrices** (Q_mat, PI_mat, D_mat dimensions grow)
3. **Accumulated rounding errors** over more operations
4. **More opportunities for overflow** in matrix multiplications

## Current Error Detection

The code includes error checks (lines 662-703) that print warnings:
```cpp
if (abs(rho * max_log) > 700) {
    std::cout << "err1: Exponentiation overflow/underflow risk\n";
}
if (D_mat.hasNaN()) std::cout << "err2: NaN in D_mat!\n";
if (logqg2.hasNaN()) std::cout << "err4: NaN in logqg2!\n";
if (std::abs(m) < 1e-300) std::cout << "err6: Near-zero m\n";
if (!std::isfinite(grad_rho)) std::cout << "err8: Non-finite gradient\n";
```

However, these only **detect** the problem, they don't **fix** it.

## Proposed Solutions

### Solution 1: Log-Space Arithmetic (RECOMMENDED)

Work entirely in log-space for critical computations:

```cpp
// Instead of: qg2rho = exp(rho * logqg2)
// Use: log_qg2rho = rho * logqg2

// Instead of: pig1_mat = PI_mat * exp((rho/(1+rho)) * D_mat)
// Use: log_pig1_mat = log(PI_mat) + (rho/(1+rho)) * D_mat

// Use log-sum-exp trick for sums:
// log(sum(exp(x_i))) = max(x_i) + log(sum(exp(x_i - max(x_i))))
```

**Advantages:**
- Avoids overflow/underflow completely
- Numerically stable for all SNR and N values
- Standard technique in information theory

**Disadvantages:**
- Requires refactoring E_0_co() function
- More complex code
- Slightly slower (more log/exp calls)

### Solution 2: Extended Precision (PARTIAL FIX)

Change interface to use **double** instead of **float**:

```cpp
double* exponents(double M, const char* typeM, double SNR, double R, double N,
                  double n, double threshold, double* results)
```

**Advantages:**
- Simple change (just replace float→double)
- Extends range to ~10^308

**Disadvantages:**
- Still can overflow for very high SNR/N
- Doesn't solve fundamental algorithmic issue
- Only delays the problem

### Solution 3: Clamping and Scaling (WORKAROUND)

Add explicit overflow prevention:

```cpp
// Clamp exponential arguments
double max_exp = 700.0;
Eigen::VectorXd clamped_log = logqg2.array().min(max_exp / rho).max(-max_exp / rho);
Eigen::VectorXd qg2rho = (rho * clamped_log.array()).exp();

// Check F0 before taking log
if (F0 <= 0 || !std::isfinite(F0)) {
    std::cerr << "ERROR: Invalid F0 = " << F0 << ", returning fallback E0\n";
    E0 = 0.0;  // or some sensible default
    return E0;
}
E0 = -log2(F0);
```

**Advantages:**
- Quick fix
- Prevents crashes

**Disadvantages:**
- Results may be inaccurate
- Arbitrary clamping can introduce bias
- Not mathematically principled

### Solution 4: Hybrid Approach (BALANCED)

1. Use **double** instead of **float** for results
2. Add **overflow detection and fallback**:
   ```cpp
   // Detect overflow risk
   double max_log = logqg2.maxCoeff();
   if (abs(rho * max_log) > 700) {
       // Switch to log-space computation
       return E_0_co_log_space(r, rho, grad_rho, E0);
   }
   // Otherwise use normal computation (faster)
   ```
3. Implement **log-space version** for edge cases

**Advantages:**
- Fast for normal cases
- Robust for extreme cases
- Best of both worlds

**Disadvantages:**
- Two code paths to maintain

## Recommendation

**Use Solution 4 (Hybrid Approach):**

1. **Immediate fix:** Change `float*` to `double*` in interface
2. **Add detection:** Check for overflow risk before exponentials
3. **Fallback:** Implement log-space E_0_co for high SNR/N cases
4. **Return special marker:** If computation fails, return marker value (e.g., E0 = -1)

### Implementation Priority

**Phase 1 (Quick Fix - 30 min):**
- Change float→double in interface
- Add overflow detection with error return

**Phase 2 (Robust Fix - 2-3 hours):**
- Implement log-space E_0_co function
- Add automatic fallback logic

**Phase 3 (Polish - 1 hour):**
- Add unit tests for high SNR/N cases
- Document numerical stability guarantees

## Test Cases to Verify Fix

```javascript
// Test 1: Moderate SNR, High N
compute(M=16, type='PAM', SNR=10, R=0.5, N=100, n=100, threshold=1e-6)
// Expected: E0 > 0 (e.g., E0 ≈ 2.5)

// Test 2: High SNR, High N
compute(M=16, type='PAM', SNR=20, R=0.5, N=100, n=100, threshold=1e-6)
// Expected: E0 > 0 (e.g., E0 ≈ 5.0)

// Test 3: Very High SNR, High N
compute(M=64, type='QAM', SNR=30, R=0.5, N=100, n=100, threshold=1e-6)
// Expected: E0 > 0 (should not be 0 or NaN)
```

## Mathematical Background

The error exponent in information theory:
- **Definition:** `E0 = lim_{n→∞} -log(Pe) / n`
- **Physical meaning:** Exponential decay rate of error probability
- **Range:** `0 ≤ E0 ≤ ∞` (for capacity-achieving codes)
- **With high SNR:** E0 should **increase** (better channel = faster decay)

If E0 becomes 0 with high SNR, it means the computation is numerically broken, not that the channel is bad.

## References

1. **Log-sum-exp trick:** https://en.wikipedia.org/wiki/LogSumExp
2. **Numerical stability in ML:** https://gregorygundersen.com/blog/2020/02/09/log-sum-exp/
3. **IEEE 754 Double precision:** Range ≈ 10^-308 to 10^308
4. **Information Theory:** Cover & Thomas, "Elements of Information Theory"
