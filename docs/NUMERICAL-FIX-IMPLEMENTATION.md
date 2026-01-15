# Numerical Overflow Fix Implementation

## Quick Fix (Phase 1): Double Precision + Overflow Detection

This fix addresses the immediate problem where error exponents become 0 with high SNR and high N.

### Changes Required

#### 1. Update exponents.cpp interface (float → double)

**File:** `/home/arnau/Documents/tfg/EPCalculator/EPCalculatorOld/EPCalculatorOld/exponents/exponents.cpp`

**Current code:**
```cpp
extern "C" {
    float* exponents(float M, const char* typeM, float SNR, float R, float N, float n, float threshold, float* results) {
        int it = 20;
        setMod(M, typeM);
        setQ(); // matrix Q
        setR(R);
        setSNR(SNR);
        setN(N);

        // matrices
        setPI();
        setW();

        double rho_gd, rho_interpolated;
        double r;
        double e0 = GD_iid(r, rho_gd, rho_interpolated, it, N, threshold);

        results[0] = pow(2,-n*e0); // Pe
        results[1] = e0; // exp
        results[2] = rho_gd;
        return results;
    }
}
```

**Fixed code:**
```cpp
extern "C" {
    double* exponents(double M, const char* typeM, double SNR, double R, double N, double n, double threshold, double* results) {
        int it = 20;
        setMod(static_cast<int>(M), typeM);
        setQ(); // matrix Q
        setR(R);
        setSNR(SNR);
        setN(static_cast<int>(N));

        // matrices
        setPI();
        setW();

        double rho_gd, rho_interpolated;
        double r;

        // Compute error exponent
        double e0 = GD_iid(r, rho_gd, rho_interpolated, it, static_cast<int>(N), threshold);

        // Check for invalid results
        if (!std::isfinite(e0) || e0 < 0) {
            std::cerr << "ERROR: Invalid error exponent E0 = " << e0
                      << " (SNR=" << SNR << ", N=" << N << ")\n";
            // Return special marker for invalid computation
            results[0] = -1.0; // Marker: invalid Pe
            results[1] = -1.0; // Marker: invalid E0
            results[2] = rho_gd;
            return results;
        }

        // Compute error probability Pe = 2^(-n*e0)
        // Check for underflow: if n*e0 > 1000, Pe < 2^(-1000) ≈ 1e-301 (near underflow)
        double exponent = -n * e0;
        if (exponent < -1000) {
            // Severe underflow - Pe is effectively 0
            results[0] = 0.0;  // Pe ≈ 0
            std::cout << "INFO: Error probability Pe < 1e-300 (underflow), setting to 0\n";
        } else if (exponent > 0) {
            // This shouldn't happen (would mean E0 < 0)
            std::cerr << "ERROR: Positive exponent in Pe calculation\n";
            results[0] = 1.0;  // Safeguard
        } else {
            results[0] = pow(2.0, exponent);
        }

        results[1] = e0;      // Error exponent
        results[2] = rho_gd;  // Optimal rho

        return results;
    }
}
```

#### 2. Update E_0_co function with overflow protection

**File:** `/home/arnau/Documents/tfg/EPCalculator/EPCalculatorOld/EPCalculatorOld/exponents/functions.cpp`

**Location:** Around line 655 (E_0_co function)

**Add before line 667:**
```cpp
double E_0_co(double r, double rho, double &grad_rho, double &E0) {
    // does not compute second der
    Eigen::VectorXd logqg2 = (Q_mat.transpose() * ((-1.0 / (1.0 + rho)) * D_mat.array()).exp().matrix()).array().log();

    // *** NEW: Check for overflow risk ***
    double max_log = logqg2.maxCoeff();
    double min_log = logqg2.minCoeff();
    double max_exp_arg = std::abs(rho * max_log);
    double min_exp_arg = std::abs(rho * min_log);

    // exp(709) is near double overflow
    const double OVERFLOW_THRESHOLD = 700.0;

    if (max_exp_arg > OVERFLOW_THRESHOLD || min_exp_arg > OVERFLOW_THRESHOLD) {
        std::cerr << "\n=== OVERFLOW DETECTED ===\n";
        std::cerr << "rho = " << rho << "\n";
        std::cerr << "max(rho * logqg2) = " << max_exp_arg << "\n";
        std::cerr << "min(rho * logqg2) = " << min_exp_arg << "\n";
        std::cerr << "SNR = " << SNR << "\n";
        std::cerr << "========================\n";

        // Return error marker
        E0 = -1.0;  // Marker for invalid computation
        grad_rho = 0.0;
        return -1.0;
    }

    // Original computation continues...
    Eigen::VectorXd qg2rho = (rho * logqg2.array()).exp();
    // ... rest of function
```

#### 3. Update cpp-exact.js to handle double

**File:** `/home/arnau/Documents/tfg/EPCalculator/src/services/cpp-exact.js`

**Current code:**
```javascript
// Define types
const FloatArray = ref.refType(ref.types.float);

cppLib = ffi.Library(libPath, {
    'exponents': [FloatArray, [
        'float',        // M
        'string',       // typeM
        'float',        // SNR
        'float',        // R
        'float',        // N
        'float',        // n
        'float',        // threshold
        FloatArray      // results (output array)
    ]]
});

// Allocate output array for results [Pe, E0, rho]
const results = Buffer.alloc(3 * ref.types.float.size);

// Extract results from the output array
const Pe = results.readFloatLE(0);
const errorExponent = results.readFloatLE(4);
const optimalRho = results.readFloatLE(8);
```

**Fixed code:**
```javascript
// Define types - CHANGE: Use double instead of float
const DoubleArray = ref.refType(ref.types.double);

cppLib = ffi.Library(libPath, {
    'exponents': [DoubleArray, [
        'double',       // M (was float)
        'string',       // typeM
        'double',       // SNR (was float)
        'double',       // R (was float)
        'double',       // N (was float)
        'double',       // n (was float)
        'double',       // threshold (was float)
        DoubleArray     // results (output array) - was FloatArray
    ]]
});

// Allocate output array for results [Pe, E0, rho] - CHANGE: double size
const results = Buffer.alloc(3 * ref.types.double.size);  // 8 bytes per double

// Extract results from the output array - CHANGE: Use double read
const Pe = results.readDoubleLE(0);
const errorExponent = results.readDoubleLE(8);   // Offset 8 (was 4)
const optimalRho = results.readDoubleLE(16);     // Offset 16 (was 8)

// CHANGE: Add error detection
if (errorExponent < 0) {
    throw new Error(`Numerical overflow detected in C++ computation (SNR=${SNR}, N=${N}). ` +
                    `Try reducing SNR or N, or increasing threshold.`);
}
```

#### 4. Rebuild C++ library

After making changes to exponents.cpp and functions.cpp:

```bash
cd /home/arnau/Documents/tfg/EPCalculator/EPCalculatorOld/EPCalculatorOld/build
make clean
make
```

#### 5. Restart server

```bash
killall node
npm run build:frontend
node simple-server-working.js
```

## Testing the Fix

### Test Case 1: Moderate SNR, High N
```bash
curl -X POST http://localhost:8001/api/compute \
  -H "Content-Type: application/json" \
  -d '{
    "M": 16,
    "typeModulation": "PAM",
    "SNR": 10,
    "R": 0.5,
    "N": 80,
    "n": 100,
    "threshold": 1e-6
  }'
```

**Expected Result:**
- `error_exponent > 0` (e.g., 2.5-3.0)
- `error_probability < 1e-100` (very small)
- No error messages

### Test Case 2: High SNR, High N
```bash
curl -X POST http://localhost:8001/api/compute \
  -H "Content-Type: application/json" \
  -d '{
    "M": 16,
    "typeModulation": "PAM",
    "SNR": 20,
    "R": 0.5,
    "N": 100,
    "n": 100,
    "threshold": 1e-6
  }'
```

**Expected Result:**
- `error_exponent > 0` (e.g., 5.0-6.0)
- `error_probability ≈ 0` (underflow is OK)
- Possible INFO message about underflow
- No ERROR messages

### Test Case 3: Extreme Parameters (Should trigger overflow detection)
```bash
curl -X POST http://localhost:8001/api/compute \
  -H "Content-Type: application/json" \
  -d '{
    "M": 64,
    "typeModulation": "QAM",
    "SNR": 50,
    "R": 0.5,
    "N": 150,
    "n": 200,
    "threshold": 1e-6
  }'
```

**Expected Result:**
- Should return error with descriptive message
- Or compute valid E0 if fix works properly
- Check C++ stderr for overflow detection messages

## Validation Checklist

- [ ] Changed `float*` to `double*` in exponents.cpp
- [ ] Updated FFI interface in cpp-exact.js to use double
- [ ] Added overflow detection in E_0_co function
- [ ] Added error checking in exponents() function
- [ ] Rebuilt C++ library (make clean && make)
- [ ] Restarted server
- [ ] Tested with moderate SNR/N (should work)
- [ ] Tested with high SNR/N (should work or return descriptive error)
- [ ] Checked for error messages in console
- [ ] Verified error_exponent is positive (not 0 or negative)

## Limitations of This Fix

This Phase 1 fix **detects and prevents** numerical overflow but doesn't fully **solve** it. For very high SNR/N, the computation may still fail with an error.

**For a complete solution (Phase 2),** implement log-space arithmetic in E_0_co function. This would:
- Eliminate overflow completely
- Work for arbitrarily high SNR and N
- Require more extensive code changes (2-3 hours)

## If Phase 1 Fix Is Not Sufficient

If you still see errors with high SNR/N after Phase 1, proceed to Phase 2:

### Phase 2: Log-Space E_0_co Implementation

Create a new function `E_0_co_log_space()` that:
1. Computes `log(qg2rho)` instead of `qg2rho`
2. Uses log-sum-exp trick for matrix multiplications
3. Returns `log(F0)` directly, then `E0 = -log(F0) / log(2)`

This requires refactoring the matrix operations to work in log-space, which is more involved but guarantees numerical stability.

Would you like me to implement Phase 2 as well?
