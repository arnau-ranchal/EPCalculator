// Test edge cases and boundary conditions
import http from 'http';

// Edge case test scenarios
const edgeCases = [
  // Low SNR edge case
  {M: 2, typeModulation: 'PAM', SNR: 0.1, R: 0.3, N: 15, n: 128, description: 'Very low SNR'},
  // High SNR edge case
  {M: 2, typeModulation: 'PAM', SNR: 20.0, R: 0.3, N: 15, n: 128, description: 'Very high SNR'},
  // Low rate edge case
  {M: 2, typeModulation: 'PAM', SNR: 5.0, R: 0.01, N: 15, n: 128, description: 'Very low rate'},
  // High rate edge case
  {M: 2, typeModulation: 'PAM', SNR: 5.0, R: 0.99, N: 15, n: 128, description: 'Very high rate'},
  // Large constellation
  {M: 16, typeModulation: 'PAM', SNR: 10.0, R: 0.5, N: 15, n: 128, description: 'Large constellation (M=16)'},
  // Different modulation types
  {M: 4, typeModulation: 'PSK', SNR: 5.0, R: 0.5, N: 15, n: 128, description: 'PSK modulation'},
  {M: 4, typeModulation: 'QAM', SNR: 5.0, R: 0.5, N: 15, n: 128, description: 'QAM modulation'},
  // Very tight threshold
  {M: 2, typeModulation: 'PAM', SNR: 5.0, R: 0.3, N: 15, n: 128, threshold: 1e-12, description: 'Very tight threshold'}
];

async function testEdgeCase(testCase, index) {
  return new Promise((resolve) => {
    const data = JSON.stringify(testCase);
    const options = {
      hostname: 'localhost', port: 8000, path: '/api/compute', method: 'POST',
      headers: {'Content-Type': 'application/json', 'Content-Length': data.length}
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);

          // Check for valid results
          const validE0 = isFinite(result.error_exponent) && !isNaN(result.error_exponent) && result.error_exponent >= 0;
          const validRho = isFinite(result.optimal_rho) && !isNaN(result.optimal_rho) && result.optimal_rho >= 0 && result.optimal_rho <= 1;
          const validPe = isFinite(result.error_probability) && !isNaN(result.error_probability) && result.error_probability >= 0 && result.error_probability <= 1;

          console.log(`\\n=== Edge Case ${index + 1}: ${testCase.description} ===`);
          console.log(`Parameters: M=${testCase.M}, ${testCase.typeModulation}, SNR=${testCase.SNR}, R=${testCase.R}`);
          console.log(`Results: E0=${result.error_exponent.toFixed(4)}, rho=${result.optimal_rho.toFixed(4)}, Pe=${result.error_probability.toExponential(3)}`);
          console.log(`Validity: E0=${validE0 ? '✅' : '❌'}, rho=${validRho ? '✅' : '❌'}, Pe=${validPe ? '✅' : '❌'}`);
          console.log(`Time: ${result.computation_time_ms}ms`);

          const allValid = validE0 && validRho && validPe;
          console.log(`Status: ${allValid ? '✅ PASS' : '❌ FAIL'}`);

          resolve({passed: allValid, result});
        } catch (e) {
          console.log(`Edge case ${index + 1} failed to parse response:`, e.message);
          resolve({passed: false, error: e.message});
        }
      });
    });

    req.on('error', (e) => {
      console.log(`Edge case ${index + 1} network error:`, e.message);
      resolve({passed: false, error: e.message});
    });

    req.write(data);
    req.end();
  });
}

async function runEdgeCaseTests() {
  console.log('🧪 Testing EPCalculator API edge cases and boundary conditions\\n');

  const results = [];
  for (let i = 0; i < edgeCases.length; i++) {
    const result = await testEdgeCase(edgeCases[i], i);
    results.push(result);
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const passedCount = results.filter(r => r.passed).length;
  console.log(`\\n📊 Edge Cases Summary: ${passedCount}/${edgeCases.length} tests passed`);

  if (passedCount === edgeCases.length) {
    console.log('🎉 All edge case tests PASSED - Implementation is robust!');
  } else {
    console.log('⚠️ Some edge cases failed - may need investigation');
    const failures = results.filter(r => !r.passed);
    console.log(`Failed cases: ${failures.length}`);
  }
}

runEdgeCaseTests();