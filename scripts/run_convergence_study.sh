#!/bin/bash

echo "========================================================"
echo "     COMPREHENSIVE CONVERGENCE STUDY"
echo "========================================================"
echo ""

for SNR in 5 10 15 20 30 40 50; do
    echo "### SNR = $SNR dB ###"
    timeout 300 ./convergence_analysis 2 PAM $SNR 0.5 2>&1 | \
        awk '/MINIMUM N FOR GIVEN PRECISION/,/Note:/' | \
        grep -E "(Precision|1e-04|1e-06|1e-08)"
    echo ""
done

echo "========================================================"
