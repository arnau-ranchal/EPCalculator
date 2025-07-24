// exponents.cpp
#include <cmath>
#include <cstring> 
#include "functions.h"
#include <iostream>

extern "C" {

    float* exponents(float M, const char* typeM, float SNR, float R, float N, float n, float threshold, float* results) {

        int it = 20;
        setMod(M, typeM);
        setQ(); // matrix Q
        setR(R);
        setSNR(SNR);
        setN(N);

        // matrices
        setPI();
        setW();

        double rho_gd, rho_interpolated;
        double r;
        double e0 = GD_iid(r, rho_gd, rho_interpolated, it, N, threshold);

        results[0] = pow(2,-n*e0); // Pe
        results[1] = e0; // exp
        results[2] = rho_gd;
        return results;
    }
}
