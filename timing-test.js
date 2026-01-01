// Direct timing test of the C++ library via FFI (without HTTP overhead)
import { cppCalculator } from './src/services/cpp-exact.js';
import { performance } from 'perf_hooks';

const testCases = [
  {M: 2, typeModulation: 'PAM', SNR: 5.0, R: 0.3, N: 15, n: 128, desc: 'M=2, PAM, SNR=5'},
  {M: 2, typeModulation: 'PAM', SNR: 10.0, R: 0.5, N: 15, n: 128, desc: 'M=2, PAM, SNR=10'},
  {M: 4, typeModulation: 'PAM', SNR: 6.0, R: 0.4, N: 20, n: 200, desc: 'M=4, PAM, SNR=6'},
  {M: 8, typeModulation: 'PAM', SNR: 8.0, R: 0.6, N: 25, n: 150, desc: 'M=8, PAM, SNR=8'},
  {M: 16, typeModulation: 'PAM', SNR: 10.0, R: 0.5, N: 15, n: 128, desc: 'M=16, PAM, SNR=10'}
];

function benchmarkDirectFFI(testCase, runs = 10) {
  const times = [];

  for (let i = 0; i < runs; i++) {
    const start = performance.now();

    const result = cppCalculator.compute(
      testCase.M, testCase.typeModulation, testCase.SNR,
      testCase.R, testCase.N, testCase.n, 1e-6
    );

    const end = performance.now();
    times.push(end - start);
  }

  return {
    mean: times.reduce((a, b) => a + b, 0) / times.length,
    min: Math.min(...times),
    max: Math.max(...times)
  };
}

console.log('⚡ Direct FFI Performance Benchmark (No HTTP Overhead)');
console.log('====================================================');

for (const testCase of testCases) {
  console.log(`\\n=== ${testCase.desc} ===`);

  const results = benchmarkDirectFFI(testCase, 10);

  console.log(`Direct FFI Performance (10 runs):`);
  console.log(`  Mean: ${results.mean.toFixed(3)}ms`);
  console.log(`  Min:  ${results.min.toFixed(3)}ms`);
  console.log(`  Max:  ${results.max.toFixed(3)}ms`);
}

console.log('\\n📊 Performance Analysis:');
console.log('- Direct FFI calls bypass HTTP/JSON overhead');
console.log('- Shows pure C++ computation + FFI marshaling time');
console.log('- Compare with API times to see network overhead impact');