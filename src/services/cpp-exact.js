// Direct C++ interface using FFI for exact results
// This uses the proven old implementation for 100% accuracy

import ffi from 'ffi-napi';
import ref from 'ref-napi';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define types - CHANGED: Use double instead of float for better precision
const DoubleArray = ref.refType(ref.types.double);

// Load the C++ implementation library from the unified build directory
const libPath = path.join(__dirname, '../../build/libfunctions.so');

let cppLib = null;
let isLibraryLoaded = false;

try {
    // Define the library interface
    cppLib = ffi.Library(libPath, {
        'exponents': [DoubleArray, [
            'double',       // M (was float)
            'string',       // typeM
            'double',       // SNR (was float)
            'double',       // R (was float)
            'double',       // N (was float)
            'double',       // n (was float)
            'double',       // threshold (was float)
            'string',       // distribution type
            'double',       // shaping_param (beta)
            DoubleArray     // results (output array) - was FloatArray
        ]],
        'exponents_custom': [DoubleArray, [
            DoubleArray,    // real_parts
            DoubleArray,    // imag_parts
            DoubleArray,    // probabilities
            'int',          // num_points
            'double',       // SNR
            'double',       // R
            'double',       // N
            'double',       // n
            'double',       // threshold
            DoubleArray     // results (output array)
        ]]
    });

    isLibraryLoaded = true;
    console.log('✅ C++ library loaded successfully from:', libPath);
} catch (error) {
    console.error('❌ Failed to load C++ library:', error.message);
    console.error('Library path:', libPath);
    isLibraryLoaded = false;
}

export class EPCalculatorCPP {
    constructor() {
        this.isAvailable = isLibraryLoaded;
    }

    /**
     * Compute error exponents using exact C++ implementation
     * @param {number} M - Constellation size
     * @param {string} typeModulation - Modulation type (PAM, PSK, QAM)
     * @param {number} SNR - Signal-to-noise ratio
     * @param {number} R - Code rate
     * @param {number} N - Block length parameter
     * @param {number} n - Channel uses
     * @param {number} threshold - Convergence threshold
     * @param {string} distribution - Distribution type (uniform, maxwell-boltzmann)
     * @param {number} shaping_param - Shaping parameter (beta for Maxwell-Boltzmann)
     * @returns {Object} Computation results
     */
    compute(M, typeModulation, SNR, R, N, n, threshold, distribution = 'uniform', shaping_param = 0.0) {
        if (!this.isAvailable) {
            throw new Error('C++ library not available - FFI loading failed');
        }

        try {
            // Allocate output array for results [Pe, E0, rho, mutual_info, cutoff_rate] - 5 doubles
            const results = Buffer.alloc(5 * ref.types.double.size);

            // Call the exact C++ implementation
            const resultPtr = cppLib.exponents(
                M,
                typeModulation,
                SNR,
                R,
                N,
                n,
                threshold,
                distribution,
                shaping_param,
                results
            );

            if (resultPtr.isNull()) {
                throw new Error('C++ computation returned null pointer');
            }

            // Extract results from the output array - 5 doubles at 8-byte offsets
            const Pe = results.readDoubleLE(0);
            let errorExponent = results.readDoubleLE(8);   // Offset 8 - use 'let' for clamping
            const optimalRho = results.readDoubleLE(16);   // Offset 16
            const mutualInformation = results.readDoubleLE(24);  // Offset 24 - I(X;Y) = E0'(0)
            const cutoffRate = results.readDoubleLE(32);         // Offset 32 - R0 = E0(1)

            // Check for error marker (-1.0 indicates overflow/numerical error)
            // Only trigger on actual error markers (< -0.5), not on tiny negative values from floating point noise
            if (errorExponent < -0.5) {
                throw new Error(
                    `Numerical overflow detected in C++ computation (SNR=${SNR}, N=${N}). ` +
                    `The error exponent computation overflowed. Try reducing SNR or N values, ` +
                    `or contact support for log-space implementation.`
                );
            }

            // Clamp very small negative values to 0 (floating point precision issues)
            if (errorExponent < 0 && errorExponent > -0.5) {
                errorExponent = 0.0;
            }

            // Validate results
            if (isNaN(Pe) || isNaN(errorExponent) || isNaN(optimalRho)) {
                throw new Error('C++ computation returned invalid values (NaN)');
            }

            if (!isFinite(Pe) || !isFinite(errorExponent) || !isFinite(optimalRho)) {
                throw new Error('C++ computation returned infinite values');
            }

            return {
                error_probability: Pe,
                error_exponent: errorExponent,
                optimal_rho: optimalRho,
                mutual_information: mutualInformation,
                cutoff_rate: cutoffRate,
                success: true,
                computation_method: 'cpp_exact'
            };

        } catch (error) {
            console.error('C++ computation error:', error);
            throw new Error(`C++ computation failed: ${error.message}`);
        }
    }

    /**
     * Compute error exponents using custom constellation
     * @param {Array} points - Array of constellation points {real, imag, prob}
     * @param {number} SNR - Signal-to-noise ratio
     * @param {number} R - Code rate
     * @param {number} N - Block length parameter
     * @param {number} n - Channel uses
     * @param {number} threshold - Convergence threshold
     * @returns {Object} Computation results
     */
    computeCustom(points, SNR, R, N, n, threshold) {
        if (!this.isAvailable) {
            throw new Error('C++ library not available - FFI loading failed');
        }

        if (!points || points.length < 2) {
            throw new Error('Custom constellation must have at least 2 points');
        }

        try {
            const numPoints = points.length;

            // Allocate arrays for constellation points and probabilities
            const realParts = Buffer.alloc(numPoints * ref.types.double.size);
            const imagParts = Buffer.alloc(numPoints * ref.types.double.size);
            const probabilities = Buffer.alloc(numPoints * ref.types.double.size);

            // Fill arrays
            for (let i = 0; i < numPoints; i++) {
                realParts.writeDoubleLE(points[i].real, i * ref.types.double.size);
                imagParts.writeDoubleLE(points[i].imag, i * ref.types.double.size);
                probabilities.writeDoubleLE(points[i].prob, i * ref.types.double.size);
            }

            // Allocate output array - 5 doubles: [Pe, E0, rho, mutual_info, cutoff_rate]
            const results = Buffer.alloc(5 * ref.types.double.size);

            // Call the C++ implementation
            const resultPtr = cppLib.exponents_custom(
                realParts,
                imagParts,
                probabilities,
                numPoints,
                SNR,
                R,
                N,
                n,
                threshold,
                results
            );

            if (resultPtr.isNull()) {
                throw new Error('C++ computation returned null pointer');
            }

            // Extract results - 5 doubles at 8-byte offsets
            const Pe = results.readDoubleLE(0);
            let errorExponent = results.readDoubleLE(8);
            const optimalRho = results.readDoubleLE(16);
            const mutualInformation = results.readDoubleLE(24);  // I(X;Y) = E0'(0)
            const cutoffRate = results.readDoubleLE(32);         // R0 = E0(1)

            // Check for error marker
            if (errorExponent < -0.5) {
                throw new Error(
                    `Numerical overflow detected in C++ computation (SNR=${SNR}, N=${N})`
                );
            }

            // Clamp small negative values to 0
            if (errorExponent < 0 && errorExponent > -0.5) {
                errorExponent = 0.0;
            }

            // Validate results
            if (isNaN(Pe) || isNaN(errorExponent) || isNaN(optimalRho)) {
                throw new Error('C++ computation returned invalid values (NaN)');
            }

            if (!isFinite(Pe) || !isFinite(errorExponent) || !isFinite(optimalRho)) {
                throw new Error('C++ computation returned infinite values');
            }

            return {
                error_probability: Pe,
                error_exponent: errorExponent,
                optimal_rho: optimalRho,
                mutual_information: mutualInformation,
                cutoff_rate: cutoffRate,
                success: true,
                computation_method: 'cpp_custom'
            };

        } catch (error) {
            console.error('C++ custom constellation computation error:', error);
            throw new Error(`C++ custom computation failed: ${error.message}`);
        }
    }

    /**
     * Check if the C++ library is available
     * @returns {boolean} True if library is loaded and ready
     */
    isReady() {
        return this.isAvailable;
    }

    /**
     * Get library status information
     * @returns {Object} Status information
     */
    getStatus() {
        return {
            library_loaded: this.isAvailable,
            library_path: libPath,
            computation_method: 'cpp_exact_ffi'
        };
    }
}

// Create singleton instance
export const cppCalculator = new EPCalculatorCPP();

// Test the library on startup
if (cppCalculator.isReady()) {
    try {
        const testResult = cppCalculator.compute(2, 'PAM', 5.0, 0.3, 15, 128, 1e-6);
        console.log('✅ C++ library test successful:', {
            error_exponent: testResult.error_exponent.toFixed(6),
            optimal_rho: testResult.optimal_rho.toFixed(6)
        });

        // Verify it matches expected exact values
        const expectedE0 = 0.6903;
        const expectedRho = 1.0000;
        const E0_error = Math.abs(testResult.error_exponent - expectedE0);
        const rho_error = Math.abs(testResult.optimal_rho - expectedRho);

        if (E0_error < 0.0001 && rho_error < 0.0001) {
            console.log('🎉 PERFECT: C++ results match expected exact values!');
        } else {
            console.log('⚠️ WARNING: C++ results differ from expected values');
        }

    } catch (error) {
        console.error('❌ C++ library test failed:', error.message);
    }
} else {
    console.log('⚠️ C++ library not available - will fall back to JavaScript approximations');
}