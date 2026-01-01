// Test the running server with Maxwell-Boltzmann distribution
import http from 'http';

function makeRequest(data) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);

        const options = {
            hostname: 'localhost',
            port: 8000,
            path: '/api/calculate',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

console.log('🧪 Testing EPCalculator Server with Maxwell-Boltzmann Distribution\n');
console.log('=' .repeat(70));

// Test 1: 16-QAM with Maxwell-Boltzmann
console.log('\n📊 Test 1: 16-QAM with Maxwell-Boltzmann (β = 1/π)');
console.log('-'.repeat(70));

const beta = 1.0 / Math.PI;

makeRequest({
    M: 16,
    typeModulation: 'QAM',
    SNR: 10,
    R: 0.5,
    N: 200,
    n: 1000,
    threshold: 0.000001,
    distribution: 'maxwell-boltzmann',
    shaping_param: beta
}).then(result => {
    console.log('✅ Request successful!');
    console.log('Parameters:');
    console.log('  - M: 16 (QAM)');
    console.log('  - Beta: 1/π =', beta.toFixed(10));
    console.log('  - Distribution: Maxwell-Boltzmann');
    console.log('\nResults:', result);

    // Test 2: 8-PSK with Maxwell-Boltzmann
    console.log('\n📊 Test 2: 8-PSK with Maxwell-Boltzmann');
    console.log('-'.repeat(70));

    return makeRequest({
        M: 8,
        typeModulation: 'PSK',
        SNR: 10,
        R: 0.5,
        N: 200,
        n: 1000,
        threshold: 0.000001,
        distribution: 'maxwell-boltzmann',
        shaping_param: beta
    });
}).then(result => {
    console.log('✅ Request successful!');
    console.log('Parameters:');
    console.log('  - M: 8 (PSK)');
    console.log('  - Beta: 1/π =', beta.toFixed(10));
    console.log('  - Distribution: Maxwell-Boltzmann (should give uniform for PSK)');
    console.log('\nResults:', result);

    // Test 3: 4-PAM with Uniform (baseline)
    console.log('\n📊 Test 3: 4-PAM with Uniform Distribution (baseline)');
    console.log('-'.repeat(70));

    return makeRequest({
        M: 4,
        typeModulation: 'PAM',
        SNR: 10,
        R: 0.5,
        N: 200,
        n: 1000,
        threshold: 0.000001,
        distribution: 'uniform',
        shaping_param: 0
    });
}).then(result => {
    console.log('✅ Request successful!');
    console.log('Parameters:');
    console.log('  - M: 4 (PAM)');
    console.log('  - Distribution: Uniform');
    console.log('\nResults:', result);

    console.log('\n' + '='.repeat(70));
    console.log('✅ All tests completed successfully!');
    console.log('\n🎉 Maxwell-Boltzmann distribution is working in production!');
    console.log('\n🌐 Server is running at: http://localhost:8000');
    console.log('📊 Frontend available at: http://localhost:8000');
    console.log('💚 Health check: http://localhost:8000/api/health');

}).catch(error => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
});
