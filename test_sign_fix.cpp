#include <iostream>
#include <iomanip>

// Include our exact implementation
#include "exponents/functions_wasm.cpp"

using namespace std;

// Test if flipping the sign gives the right result
double test_sign_fix() {
    int M = 2;
    const char* typeM = "PAM";
    double SNR_dB = 5.0;
    double R = 0.3;

    // Initialize
    double SNR = pow(10.0, SNR_dB / 10.0);
    setMod(M, typeM);
    setR(R);
    setSNR(SNR);
    setN(15);
    setQ();
    setPI();
    setW();

    // Get our current result at rho=1.0
    double rho = 1.0;
    double grad_rho, E0;
    E_0_co(R, rho, grad_rho, E0);

    cout << "Current E0: " << E0 << endl;
    cout << "Flipped sign: " << -E0 << endl;
    cout << "Expected (old impl): 0.6903" << endl;

    return E0;
}

int main() {
    cout << "Testing sign fix for E0..." << endl;
    test_sign_fix();
    return 0;
}