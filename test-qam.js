// Test QAM implementation
import { cppCalculator } from './src/services/cpp-exact.js';

console.log('Testing QAM modulation implementation...\n');

// Test 1: 4-QAM (2x2 grid)
console.log('Test 1: 4-QAM');
try {
  const result1 = cppCalculator.compute(4, 'QAM', 10, 0.5, 30, 100, 1e-6);
  console.log('✓ 4-QAM Success:', result1);
} catch (error) {
  console.log('✗ 4-QAM Failed:', error.message);
}

// Test 2: 16-QAM (4x4 grid)
console.log('\nTest 2: 16-QAM');
try {
  const result2 = cppCalculator.compute(16, 'QAM', 10, 0.5, 30, 100, 1e-6);
  console.log('✓ 16-QAM Success:', result2);
} catch (error) {
  console.log('✗ 16-QAM Failed:', error.message);
}

// Test 3: 64-QAM (8x8 grid)
console.log('\nTest 3: 64-QAM');
try {
  const result3 = cppCalculator.compute(64, 'QAM', 15, 0.5, 30, 100, 1e-6);
  console.log('✓ 64-QAM Success:', result3);
} catch (error) {
  console.log('✗ 64-QAM Failed:', error.message);
}

// Test 4: Invalid QAM (non-square) - should fall back to PAM
console.log('\nTest 4: 8-QAM (invalid - not a perfect square)');
try {
  const result4 = cppCalculator.compute(8, 'QAM', 10, 0.5, 30, 100, 1e-6);
  console.log('✓ 8-QAM (fallback to PAM):', result4);
} catch (error) {
  console.log('✗ 8-QAM Failed:', error.message);
}

// Test 5: Compare PAM vs PSK vs QAM
console.log('\nTest 5: Compare modulations (M=16, SNR=10dB)');
try {
  const pamResult = cppCalculator.compute(16, 'PAM', 10, 0.5, 30, 100, 1e-6);
  const pskResult = cppCalculator.compute(16, 'PSK', 10, 0.5, 30, 100, 1e-6);
  const qamResult = cppCalculator.compute(16, 'QAM', 10, 0.5, 30, 100, 1e-6);

  console.log('PAM E0:', pamResult.error_exponent, 'rho:', pamResult.optimal_rho);
  console.log('PSK E0:', pskResult.error_exponent, 'rho:', pskResult.optimal_rho);
  console.log('QAM E0:', qamResult.error_exponent, 'rho:', qamResult.optimal_rho);
} catch (error) {
  console.log('✗ Comparison Failed:', error.message);
}

console.log('\n✅ All QAM tests complete!');
