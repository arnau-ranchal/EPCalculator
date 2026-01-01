#!/bin/bash
# Test Maxwell-Boltzmann distribution via API

echo "Testing Maxwell-Boltzmann Distribution via API"
echo "================================================"
echo ""

# Test 1: 16-QAM with Maxwell-Boltzmann
echo "Test 1: 16-QAM with Maxwell-Boltzmann (beta = 1/π)"
echo "--------------------------------------------------"
curl -s -X POST http://localhost:8000/api/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "M": 16,
    "typeModulation": "QAM",
    "SNR": 10,
    "R": 0.5,
    "N": 200,
    "n": 1000,
    "threshold": 0.000001,
    "distribution": "maxwell-boltzmann",
    "shaping_param": 0.3183098861837907
  }' | python3 -m json.tool
echo ""

# Test 2: 4-PAM with Uniform (baseline)
echo "Test 2: 4-PAM with Uniform Distribution"
echo "---------------------------------------"
curl -s -X POST http://localhost:8000/api/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "M": 4,
    "typeModulation": "PAM",
    "SNR": 10,
    "R": 0.5,
    "N": 200,
    "n": 1000,
    "threshold": 0.000001,
    "distribution": "uniform",
    "shaping_param": 0
  }' | python3 -m json.tool
echo ""

# Test 3: 8-PSK with Maxwell-Boltzmann
echo "Test 3: 8-PSK with Maxwell-Boltzmann"
echo "------------------------------------"
curl -s -X POST http://localhost:8000/api/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "M": 8,
    "typeModulation": "PSK",
    "SNR": 10,
    "R": 0.5,
    "N": 200,
    "n": 1000,
    "threshold": 0.000001,
    "distribution": "maxwell-boltzmann",
    "shaping_param": 0.3183098861837907
  }' | python3 -m json.tool
echo ""

echo "✅ Tests completed!"
