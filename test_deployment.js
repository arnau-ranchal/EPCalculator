// Test the deployed library with Maxwell-Boltzmann distribution
import { cppCalculator } from './src/services/cpp-exact.js';

console.log('Testing Maxwell-Boltzmann implementation via FFI...\n');

// Test 1: 16-QAM with Maxwell-Boltzmann (beta = 1/pi)
console.log('Test 1: 16-QAM with Maxwell-Boltzmann (beta = 1/π)');
console.log('='.repeat(50));

const beta = 1.0 / Math.PI;
const result = cppCalculator.compute(
    16,                      // M
    'QAM',                   // type
    10.0,                    // SNR (dB)
    0.5,                     // R
    200,                     // N
    1000,                    // n
    1e-6,                    // threshold
    'maxwell-boltzmann',     // distribution
    beta                     // shaping_param (beta)
);

console.log('Parameters:');
console.log('  M = 16 (QAM)');
console.log('  Beta = 1/π =', beta);
console.log('  SNR = 10 dB');
console.log('  N = 200, n = 1000');
console.log('\nResults:');
console.log('  Pe (Error Probability) =', result.Pe);
console.log('  E0 (Error Exponent) =', result.E0);
console.log('  rho (Optimal parameter) =', result.rho);
console.log();

// Test 2: PAM with uniform distribution (baseline)
console.log('Test 2: 4-PAM with Uniform Distribution (baseline)');
console.log('='.repeat(50));

const result2 = cppCalculator.compute(
    4,                      // M
    'PAM',                  // type
    10.0,                   // SNR (dB)
    0.5,                    // R
    200,                    // N
    1000,                   // n
    1e-6,                   // threshold
    'uniform',              // distribution
    0.0                     // shaping_param
);

console.log('Parameters:');
console.log('  M = 4 (PAM)');
console.log('  Distribution = Uniform');
console.log('  SNR = 10 dB');
console.log('  N = 200, n = 1000');
console.log('\nResults:');
console.log('  Pe (Error Probability) =', result2.Pe);
console.log('  E0 (Error Exponent) =', result2.E0);
console.log('  rho (Optimal parameter) =', result2.rho);
console.log();

// Test 3: PSK with Maxwell-Boltzmann (should give uniform Q due to equal energies)
console.log('Test 3: 8-PSK with Maxwell-Boltzmann');
console.log('='.repeat(50));

const result3 = cppCalculator.compute(
    8,                       // M
    'PSK',                   // type
    10.0,                    // SNR (dB)
    0.5,                     // R
    200,                     // N
    1000,                    // n
    1e-6,                    // threshold
    'maxwell-boltzmann',     // distribution
    beta                     // shaping_param (beta)
);

console.log('Parameters:');
console.log('  M = 8 (PSK)');
console.log('  Beta = 1/π =', beta);
console.log('  SNR = 10 dB');
console.log('  N = 200, n = 1000');
console.log('\nResults:');
console.log('  Pe (Error Probability) =', result3.Pe);
console.log('  E0 (Error Exponent) =', result3.E0);
console.log('  rho (Optimal parameter) =', result3.rho);
console.log();

console.log('✅ All tests completed successfully!');
