// Test EPCalculator API accuracy with multiple parameter combinations
import http from 'http';

// Test cases with exact expected values from old implementation
const testCases = [
  {M: 2, typeModulation: 'PAM', SNR: 5.0, R: 0.3, N: 15, n: 128, expected_E0: 0.6903, expected_rho: 1.0},
  {M: 2, typeModulation: 'PAM', SNR: 5.0, R: 0.5, N: 15, n: 128, expected_E0: 0.4903, expected_rho: 1.0},
  {M: 2, typeModulation: 'PAM', SNR: 5.0, R: 0.7, N: 15, n: 128, expected_E0: 0.2903, expected_rho: 1.0},
  {M: 2, typeModulation: 'PAM', SNR: 10.0, R: 0.3, N: 15, n: 128, expected_E0: 0.6999, expected_rho: 1.0},
  {M: 2, typeModulation: 'PAM', SNR: 10.0, R: 0.5, N: 15, n: 128, expected_E0: 0.4999, expected_rho: 1.0},
  {M: 2, typeModulation: 'PAM', SNR: 10.0, R: 0.7, N: 15, n: 128, expected_E0: 0.2999, expected_rho: 1.0}
];

async function testAPI(testCase, index) {
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
          const E0_error = Math.abs(result.error_exponent - testCase.expected_E0);
          const rho_error = Math.abs(result.optimal_rho - testCase.expected_rho);

          console.log(`\n=== Test Case ${index + 1} ===`);
          console.log(`Parameters: M=${testCase.M}, SNR=${testCase.SNR}, R=${testCase.R}`);
          console.log(`Expected E0: ${testCase.expected_E0.toFixed(4)}, Got: ${result.error_exponent.toFixed(4)}, Error: ${E0_error.toFixed(6)}`);
          console.log(`Expected rho: ${testCase.expected_rho.toFixed(4)}, Got: ${result.optimal_rho.toFixed(4)}, Error: ${rho_error.toFixed(6)}`);
          console.log(`Status: ${(E0_error < 0.01 && rho_error < 0.1) ? '✅ PASS' : '❌ FAIL'}`);

          resolve({passed: E0_error < 0.01 && rho_error < 0.1, E0_error, rho_error});
        } catch (e) {
          console.log(`Test ${index + 1} failed to parse response:`, e.message);
          resolve({passed: false, error: e.message});
        }
      });
    });

    req.on('error', (e) => {
      console.log(`Test ${index + 1} network error:`, e.message);
      resolve({passed: false, error: e.message});
    });

    req.write(data);
    req.end();
  });
}

async function runAllTests() {
  console.log('🧪 Testing EPCalculator API with exact C++ implementation\n');

  const results = [];
  for (let i = 0; i < testCases.length; i++) {
    const result = await testAPI(testCases[i], i);
    results.push(result);
  }

  const passedCount = results.filter(r => r.passed).length;
  console.log(`\n📊 Summary: ${passedCount}/${testCases.length} tests passed`);

  if (passedCount === testCases.length) {
    console.log('🎉 All tests PASSED - Exact implementation is working correctly!');
  } else {
    console.log('⚠️ Some tests failed - may need investigation');
  }
}

runAllTests();