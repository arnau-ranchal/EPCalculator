#!/usr/bin/env node

/**
 * Test the new exact implementation by creating a temporary test version
 * of the functions_wasm.cpp algorithms ported to JavaScript
 */

// Import the WASM fallback functions
import wasmFallback from './src/services/wasm-fallback.js';

// Test cases that match the comparison harness
const testCases = [
    { M: 4, typeM: "PAM", SNR: 10.0, R: 0.5 },
    { M: 8, typeM: "PAM", SNR: 10.0, R: 0.5 },
    { M: 4, typeM: "PSK", SNR: 10.0, R: 0.5 },
    { M: 8, typeM: "PSK", SNR: 10.0, R: 0.5 },
    { M: 16, typeM: "QAM", SNR: 10.0, R: 0.5 },
    { M: 4, typeM: "PAM", SNR: 5.0, R: 0.1 },
    { M: 4, typeM: "PAM", SNR: 15.0, R: 0.9 },
    { M: 16, typeM: "QAM", SNR: 12.0, R: 0.7 }
];

console.log("Testing New JavaScript Implementation (Current System)");
console.log("====================================================");
console.log("M     Type   SNR(dB)  R      Error Exp      Pe           Rho        Time(ms)");
console.log("-----------------------------------------------------------------------------");

async function runTests() {
    for (const test of testCases) {
        try {
            const startTime = Date.now();
            const result = await wasmFallback.calculateErrorExponent(
                test.M, test.typeM, test.SNR, test.R, 15, 128, 1e-6
            );
            const endTime = Date.now();

            const timeMs = endTime - startTime;

            console.log(`${String(test.M).padEnd(5)} ${String(test.typeM).padEnd(7)} ${String(test.SNR).padEnd(8)} ${String(test.R).padEnd(6)} ` +
                       `${result.errorExponent.toFixed(8).padEnd(14)} ${result.Pe.toExponential(3).padEnd(12)} ` +
                       `${result.rho.toFixed(6).padEnd(10)} ${timeMs}`);
        } catch (error) {
            console.log(`${String(test.M).padEnd(5)} ${String(test.typeM).padEnd(7)} ${String(test.SNR).padEnd(8)} ${String(test.R).padEnd(6)} ERROR: ${error.message}`);
        }
    }
}

runTests().then(() => {
    console.log("\\nNew implementation testing completed!");
}).catch(console.error);