#!/usr/bin/env node
/**
 * Test script for the current EPCalculator implementation
 * Tests both the JavaScript fallback and WASM (if available)
 */

import path from 'path';
import fs from 'fs';

// Import the JavaScript fallback implementation
async function loadCurrentImplementation() {
    try {
        // Load the ES6 module
        const { epCalculator } = await import('./src/services/wasm-fallback.js');
        return epCalculator;
    } catch (error) {
        console.error('❌ Error loading current implementation:', error.message);
        return null;
    }
}

async function testCurrentImplementation() {
    console.log('🔬 Testing Current EPCalculator Implementation (JavaScript Fallback)');
    console.log('=' * 70);

    const calculator = await loadCurrentImplementation();
    if (!calculator) {
        console.log('❌ Failed to load current implementation');
        return false;
    }

    console.log('✅ Successfully loaded JavaScript fallback implementation');

    // Test parameters - same as used for old implementation
    const testParams = {
        M: 4,           // 4-PAM
        modType: 'PAM',
        SNR: 10.0,      // 10 dB
        R: 0.5,         // Rate = 0.5
        N: 15,          // Hermite integration order
        n: 128,         // Block length exponent
        threshold: 1e-6 // Convergence threshold
    };

    console.log(`🧪 Testing with parameters:`);
    console.log(`   M=${testParams.M}, type=${testParams.modType}, SNR=${testParams.SNR} dB, R=${testParams.R}`);
    console.log(`   N=${testParams.N}, n=${testParams.n}, threshold=${testParams.threshold}`);

    try {
        // Call the compute method
        const result = calculator.compute(
            testParams.M,
            testParams.modType,
            testParams.SNR,
            testParams.R,
            testParams.N,
            testParams.n,
            testParams.threshold
        );

        console.log(`📊 Results from current implementation (JS fallback):`);
        console.log(`   Error Probability (Pe): ${result.error_probability.toExponential(6)}`);
        console.log(`   Error Exponent (E0):    ${result.error_exponent.toFixed(6)}`);
        console.log(`   Optimal Rho (ρ):       ${result.optimal_rho.toFixed(6)}`);

        // Sanity checks
        let allValid = true;

        if (result.error_probability >= 0 && result.error_probability <= 1) {
            console.log('✅ Error probability is in valid range [0,1]');
        } else {
            console.log(`❌ Error probability ${result.error_probability} is outside valid range!`);
            allValid = false;
        }

        if (result.error_exponent >= 0) {
            console.log('✅ Error exponent is non-negative');
        } else {
            console.log(`❌ Error exponent ${result.error_exponent} is negative!`);
            allValid = false;
        }

        if (result.optimal_rho >= 0 && result.optimal_rho <= 10) { // More lenient range for rho
            console.log('✅ Optimal rho is in reasonable range');
        } else {
            console.log(`❌ Optimal rho ${result.optimal_rho} is outside reasonable range!`);
            allValid = false;
        }

        if (allValid) {
            console.log('✅ Current implementation test completed successfully!');
            return { success: true, results: result };
        } else {
            console.log('❌ Current implementation test failed validation!');
            return { success: false, results: result };
        }

    } catch (error) {
        console.error(`❌ Error during computation:`, error);
        return { success: false, error: error.message };
    }
}

// Additional tests with different modulation types
async function testDifferentModulations() {
    console.log('\\n🧪 Testing different modulation types:');
    console.log('-'.repeat(50));

    const calculator = await loadCurrentImplementation();
    if (!calculator) {
        return false;
    }

    const modulations = [
        { M: 2, type: 'PAM', name: '2-PAM (BPSK equivalent)' },
        { M: 4, type: 'PAM', name: '4-PAM' },
        { M: 4, type: 'PSK', name: 'QPSK' },
        { M: 16, type: 'QAM', name: '16-QAM' }
    ];

    const results = [];

    for (const mod of modulations) {
        try {
            const result = calculator.compute(
                mod.M, mod.type, 10.0, 0.5, 15, 128, 1e-6
            );

            console.log(`📊 ${mod.name}:`);
            console.log(`    E0 = ${result.error_exponent.toFixed(4)}, ρ = ${result.optimal_rho.toFixed(4)}`);

            results.push({
                modulation: mod.name,
                errorExponent: result.error_exponent,
                optimalRho: result.optimal_rho
            });
        } catch (error) {
            console.log(`❌ ${mod.name}: Error - ${error.message}`);
        }
    }

    return results;
}

// Main execution
async function main() {
    const testResult = await testCurrentImplementation();

    if (testResult.success) {
        console.log('\\n🎉 Basic test passed!');

        // Run additional tests
        await testDifferentModulations();

    } else {
        console.log('\\n💥 Basic test failed!');
    }

    return testResult;
}

// Run the test
main().catch(console.error);