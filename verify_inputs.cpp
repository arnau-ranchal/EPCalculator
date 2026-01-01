#include <iostream>
#include <iomanip>

// Include our exact implementation
#include "exponents/functions_wasm.cpp"

using namespace std;

int main() {
    cout << "Verifying that both implementations get identical inputs..." << endl;

    // Test case exactly as comparison harness: M=2, PAM, SNR=5, R=0.3
    int M = 2;
    const char* typeM = "PAM";
    double SNR = 5.0;  // Linear value as passed by comparison harness
    double R = 0.3;

    cout << "Input parameters:" << endl;
    cout << "M = " << M << endl;
    cout << "typeM = " << typeM << endl;
    cout << "SNR = " << SNR << " (linear)" << endl;
    cout << "R = " << R << endl;
    cout << "N = 15" << endl;

    // Initialize exactly as old implementation does
    setMod(M, typeM);
    setR(R);
    setSNR(SNR);
    setN(15);

    // Debug what constellation we get
    cout << "\nConstellation values:" << endl;
    for (int i = 0; i < sizeX; i++) {
        cout << "X[" << i << "] = " << X[i] << endl;
    }

    cout << "\nSNR after setSNR: " << ::SNR << endl;
    cout << "R after setR: " << ::R << endl;
    cout << "sizeX: " << sizeX << ", n: " << n << endl;

    // Now run one step of the optimization to see what we get
    setQ();
    setPI();
    setW();

    // Test E_0_co at rho=1.0 (where old implementation converges)
    double grad_rho, E0;
    E_0_co(R, 1.0, grad_rho, E0);

    cout << "\nE_0_co results at rho=1.0:" << endl;
    cout << "E0 = " << E0 << endl;
    cout << "grad_rho = " << grad_rho << endl;

    // Expected from old implementation: E0=0.6903, rho=1.0000
    cout << "\nExpected from old implementation: E0=0.6903" << endl;
    cout << "Difference: " << abs(E0 - 0.6903) << endl;

    if (abs(E0 - 0.6903) < 0.01) {
        cout << "✅ Results match at rho=1.0!" << endl;
    } else {
        cout << "❌ Results don't match - still debugging needed" << endl;
    }

    return 0;
}