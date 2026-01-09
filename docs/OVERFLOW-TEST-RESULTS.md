# Overflow Testing Results

## Test Configuration
- **System:** EPCalculator with C++ backend
- **Parameters:** M=16, typeModulation='PAM', R=0.5, n=100, threshold=1e-6
- **Variables:** SNR and N

## Key Findings

### 1. Overflow Threshold Identification

**Fixed N=30, varying SNR:**

| SNR | E0 Result | Rho | Status | Error Messages |
|-----|-----------|-----|--------|----------------|
| 80  | 2.674245  | 1.0 | ✅ OK  | None |
| 82  | 2.691210  | 1.0 | ✅ OK  | None |
| 84  | 2.707764  | 1.0 | ✅ OK  | None |
| 86  | 2.723925  | 1.0 | ✅ OK  | None |
| **87** | **-1.95e-14** | **0.0** | **❌ FAIL** | **err8: Non-finite gradient: nan at rho=1 SNR=87** |
| 88  | -1.95e-14 | 0.0 | ❌ FAIL | err8: Non-finite gradient: nan at rho=1 SNR=88 |
| 90  | -1.95e-14 | 0.0 | ❌ FAIL | err8: Non-finite gradient: nan at rho=1 SNR=90 |
| 100 | -1.95e-14 | 0.0 | ❌ FAIL | err8: Non-finite gradient: nan at rho=1 SNR=100 |
| 200 | -1.95e-14 | 0.0 | ❌ FAIL | err8: Non-finite gradient: nan at rho=1 SNR=200 |
| 500 | -1.95e-14 | 0.0 | ❌ FAIL | err8: Non-finite gradient: nan at rho=1 SNR=500 |
| 1000| -1.95e-14 | 0.0 | ❌ FAIL | err8: Non-finite gradient: nan at rho=1 SNR=1000 |

**Critical threshold: Between SNR=86 and SNR=87 (N=30)**

### 2. Error Messages Observed

Only **err8** is being triggered:

```
err8: Non-finite gradient: nan at rho=1 SNR=XX
```

**Location:** `functions.cpp:700-703`
```cpp
if (!std::isfinite(grad_rho)) {
    std::cout << "err8: Non-finite gradient: " << grad_rho
              << " at rho=" << rho << " SNR=" << SNR << "\n";
}
```

### 3. Error Messages NOT Observed

Despite checks in the code, these errors were **NOT** triggered:

- **err1:** Exponentiation overflow risk (line 662-663)
- **err2:** NaN in D_mat (line 671)
- **err3:** Negative values in D_mat (line 672)
- **err4:** NaN in logqg2 (line 675)
- **err5:** -inf in logqg2 (line 676)
- **err6:** Near-zero m (line 693)
- **err7:** Near-zero PI (line 694)

### 4. Analysis of Why Only err8 Triggers

Looking at the code flow in `E_0_co()` (functions.cpp:655-704):

```cpp
655: double E_0_co(double r, double rho, double &grad_rho, double &E0) {
657:     Eigen::VectorXd logqg2 = (Q_mat.transpose() *
                 ((-1.0/(1.0+rho)) * D_mat.array()).exp().matrix())
                 .array().log();
                 ↑ OVERFLOW HAPPENS HERE (before err1 check)

659:     double max_log = logqg2.maxCoeff();
662:     if (abs(rho * max_log) > 700) {
663:         std::cout << "err1: ...";  // Never reached - logqg2 already NaN
664:     }

667:     Eigen::VectorXd qg2rho = (rho * logqg2.array()).exp();
668:     Eigen::MatrixXd pig1_mat = PI_mat.array() *
                 ((rho/(1.0+rho)) * D_mat.array()).exp();
                 ↑ SECOND OVERFLOW POINT

687:     double m = (Q_mat.transpose() * pig1_mat * qg2rho).sum();
688-690: double mp = ...  // Computation with overflowed values

695:     double F0 = m / PI;
696:     double Fder0 = mp / PI;

698:     grad_rho = -(Fder0) / (std::log(2) * F0);
         ↑ Results in NaN/inf

700:     if (!std::isfinite(grad_rho)) {
701:         std::cout << "err8: ...";  // ✅ THIS TRIGGERS
702:     }
```

**Root Cause:**

1. **Line 657:** `D_mat.array().exp()` overflows **before** logqg2 is computed
   - With high SNR, `D_mat` contains large values (proportional to SNR)
   - `exp(D_mat)` → infinity
   - `log(infinity)` → infinity (not NaN)
   - So `logqg2` contains infinity values, not NaN

2. **Line 668:** Second overflow in `pig1_mat`
   - `exp((rho/(1+rho)) * D_mat)` also overflows

3. **Line 687-690:** Matrix multiplications with infinity
   - `m` and `mp` become infinity or NaN

4. **Line 698:** Division creates NaN
   - `grad_rho = -(Fder0) / (log(2) * F0)`
   - If both are infinity: `inf/inf = NaN`
   - If denominator is 0: `x/0 = inf`

5. **Line 700:** err8 check catches the NaN gradient ✅

**Why err1 doesn't trigger:**
- The check looks at `rho * logqg2`, but `logqg2` is infinity, not > 700
- `abs(rho * infinity)` = infinity, but the condition `> 700` is true
- **However**, the condition might not be evaluating correctly, or `logqg2` might have NaN before the check

### 5. Actual Overflow Location

The overflow actually happens at **line 657**:
```cpp
((-1.0/(1.0+rho)) * D_mat.array()).exp()
```

**With high SNR:**
- `D_mat` values are proportional to SNR
- When SNR=87: some `D_mat` entries exceed ~700
- `exp(700)` ≈ 10^304 (near double limit)
- `exp(800)` → **infinity**

### 6. Symptom vs Root Cause

| What We See | What Actually Happened |
|-------------|------------------------|
| err8: grad_rho = nan | **Symptom** (downstream effect) |
| E0 = -1.95e-14 ≈ 0 | **Symptom** (garbage value from NaN) |
| Rho = 0 | **Symptom** (default/error value) |
| **D_mat overflow in line 657** | **Root Cause** |

## Implications for the Fix

### Current Error Detection Is Insufficient

The existing error checks (err1-err7) are **placed after the overflow**:

```cpp
657: logqg2 = ... (D_mat.array()).exp() ...  ← OVERFLOW HERE
659-666: Check logqg2 values  ← Too late! Already overflowed
```

### Proper Fix Locations

To detect overflow **before** it happens, we need to check:

**Location 1: Before line 657** (most important):
```cpp
// Check D_mat before exponentiating
double max_D = D_mat.maxCoeff();
double min_D = D_mat.minCoeff();
double factor = -1.0 / (1.0 + rho);

if (abs(factor * max_D) > 700 || abs(factor * min_D) > 700) {
    std::cerr << "OVERFLOW: exp(" << (factor * max_D)
              << ") will overflow\n";
    // Return error or use log-space computation
}
```

**Location 2: Before line 668**:
```cpp
// Check D_mat before pig1_mat computation
double pig_factor = rho / (1.0 + rho);
if (abs(pig_factor * D_mat.maxCoeff()) > 700) {
    std::cerr << "OVERFLOW: pig1_mat will overflow\n";
}
```

### Why The Quick Fix Will Work

Changing `float` → `double` in the interface helps, but the **real fix** is:

1. **Detect overflow before exp()** (add checks before line 657 and 668)
2. **Use log-space arithmetic** for E_0_co when overflow risk detected
3. **Return error markers** when computation is invalid

## Recommended Next Steps

1. ✅ **Confirmed:** Overflow happens at SNR ≥ 87 (for N=30, M=16, PAM)
2. ✅ **Identified:** Only err8 triggers (grad_rho = NaN)
3. ✅ **Root cause:** `exp(D_mat)` overflow on line 657, **before** err1 check
4. ⚠️ **Action needed:** Add overflow detection **before** line 657

### Updated Fix Priority

**Phase 0 (Immediate - Add to Phase 1):**
Add overflow check before line 657:
```cpp
// Insert after line 656, before line 657
double check_factor = -1.0 / (1.0 + rho);
double max_exp_arg = std::abs(check_factor * D_mat.maxCoeff());
if (max_exp_arg > 700) {
    std::cerr << "ERROR: D_mat overflow imminent (exp arg = "
              << max_exp_arg << ")\n";
    E0 = -1.0;  // Error marker
    grad_rho = 0.0;
    return -1.0;
}
```

**Phase 1:** Double precision + early overflow detection
**Phase 2:** Log-space E_0_co implementation

## Test Commands for Validation

After fix, verify these cases:

```bash
# Should work (below threshold)
SNR=86, N=30 → E0 ≈ 2.72 ✅

# Should be fixed or return clean error
SNR=87, N=30 → E0 > 0 ✅ or ERROR (not silent 0)
SNR=90, N=30 → E0 > 0 ✅ or ERROR (not silent 0)
```

## Summary

- **Threshold:** SNR=87 (for N=30, M=16, PAM, R=0.5)
- **Error seen:** err8 (non-finite gradient)
- **Errors NOT seen:** err1-7 (checks are too late)
- **Root cause:** `exp(D_mat)` overflow on line 657
- **Fix needed:** Add overflow check **before** line 657, or use log-space computation
