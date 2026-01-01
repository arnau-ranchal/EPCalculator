// Test SNR=0 via HTTP API
const http = require('http');

const data = JSON.stringify({
    M: 2,
    typeModulation: 'PAM',
    SNR: 0,
    R: 0.5,
    N: 20,
    n: 100,
    threshold: 0.000001
});

const options = {
    hostname: 'localhost',
    port: 8000,
    path: '/api/compute',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
        responseData += chunk;
    });

    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Response:');
        console.log(JSON.stringify(JSON.parse(responseData), null, 2));
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.write(data);
req.end();
