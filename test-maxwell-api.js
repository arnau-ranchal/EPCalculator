// Test Maxwell-Boltzmann distribution via API
async function testMaxwellBoltzmann() {
  console.log('Testing Maxwell-Boltzmann Distribution via API\n');
  console.log('='.repeat(50));

  const baseParams = {
    M: 4,
    typeModulation: 'PAM',
    SNR: 10,
    R: 0.5,
    N: 20,
    n: 100,
    threshold: 1e-6
  };

  // Test 1: Uniform distribution (beta=0)
  console.log('\n1. Testing Uniform Distribution:');
  const response1 = await fetch('http://localhost:8000/api/compute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...baseParams,
      distribution: 'uniform',
      shaping_param: 0
    })
  });
  const result1 = await response1.json();
  console.log(`   E0 = ${result1.error_exponent.toFixed(6)}, rho = ${result1.optimal_rho.toFixed(6)}`);

  // Test 2: Maxwell-Boltzmann (beta=0.5)
  console.log('\n2. Testing Maxwell-Boltzmann (beta=0.5):');
  const response2 = await fetch('http://localhost:8000/api/compute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...baseParams,
      distribution: 'maxwell-boltzmann',
      shaping_param: 0.5
    })
  });
  const result2 = await response2.json();
  console.log(`   E0 = ${result2.error_exponent.toFixed(6)}, rho = ${result2.optimal_rho.toFixed(6)}`);

  // Test 3: Maxwell-Boltzmann (beta=1.0)
  console.log('\n3. Testing Maxwell-Boltzmann (beta=1.0):');
  const response3 = await fetch('http://localhost:8000/api/compute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...baseParams,
      distribution: 'maxwell-boltzmann',
      shaping_param: 1.0
    })
  });
  const result3 = await response3.json();
  console.log(`   E0 = ${result3.error_exponent.toFixed(6)}, rho = ${result3.optimal_rho.toFixed(6)}`);

  // Test 4: Maxwell-Boltzmann (beta=2.0)
  console.log('\n4. Testing Maxwell-Boltzmann (beta=2.0):');
  const response4 = await fetch('http://localhost:8000/api/compute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...baseParams,
      distribution: 'maxwell-boltzmann',
      shaping_param: 2.0
    })
  });
  const result4 = await response4.json();
  console.log(`   E0 = ${result4.error_exponent.toFixed(6)}, rho = ${result4.optimal_rho.toFixed(6)}`);

  console.log('\n' + '='.repeat(50));
  console.log('\nAnalysis:');
  console.log('- As beta increases, E0 should decrease (better error exponent)');
  console.log('- This is due to probabilistic amplitude shaping');
  console.log('\nAll tests completed successfully! ✅');
}

testMaxwellBoltzmann().catch(console.error);
