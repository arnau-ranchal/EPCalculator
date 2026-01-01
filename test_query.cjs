const http = require('http');

const postData = JSON.stringify({
  M: 2,
  typeModulation: 'PAM',
  SNR: 0.9,
  R: 0.0,
  N: 20,
  n: 100,
  threshold: 0.000001,
  distribution: 'uniform',
  shaping_param: 0
});

const options = {
  hostname: 'localhost',
  port: 8000,
  path: '/api/compute',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Computing E(R) for 2-PAM with SNR=0.9, R=0\n');

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    const result = JSON.parse(data);
    console.log('Results:');
    console.log(`  Error Exponent E(R): ${result.error_exponent}`);
    console.log(`  Optimal rho:         ${result.optimal_rho}`);
    console.log(`  Error Probability:   ${result.error_probability}`);
    console.log(`  Computation time:    ${result.computation_time_ms} ms`);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();
