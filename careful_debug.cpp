#include <iostream>
#include <iomanip>

// Include our exact implementation
#include "exponents/functions_wasm.cpp"

using namespace std;

int main() {
    cout << "Careful debugging with bounds checking..." << endl;

    int M = 2;
    const char* typeM = "PAM";
    double SNR_dB = 5.0;
    double R = 0.3;

    // Convert SNR from dB to linear scale
    double SNR = pow(10.0, SNR_dB / 10.0);
    cout << "SNR linear: " << SNR << endl;

    // Initialize parameters step by step
    cout << "Setting modulation M=" << M << ", type=" << typeM << endl;
    setMod(M, typeM);
    cout << "sizeX after setMod: " << sizeX << endl;

    cout << "Setting R=" << R << endl;
    setR(R);

    cout << "Setting SNR=" << SNR << endl;
    setSNR(SNR);

    cout << "Setting N=15" << endl;
    setN(15);
    cout << "n after setN: " << n << endl;

    cout << "Constellation values:" << endl;
    for (int i = 0; i < sizeX; i++) {
        cout << "X[" << i << "] = " << X[i] << endl;
    }

    cout << "\nCalling setQ()..." << endl;
    setQ();
    cout << "Q_mat size: " << Q_mat.size() << endl;
    for (int i = 0; i < Q_mat.size(); i++) {
        cout << "Q_mat[" << i << "] = " << Q_mat(i) << endl;
    }

    cout << "\nCalling setPI()..." << endl;
    cout << "Expected PI_mat dimensions: " << sizeX << " x " << (n * n * sizeX) << endl;

    try {
        setPI();
        cout << "setPI() completed successfully!" << endl;
        cout << "PI_mat actual dimensions: " << PI_mat.rows() << " x " << PI_mat.cols() << endl;
    } catch (const exception& e) {
        cout << "setPI() failed: " << e.what() << endl;
        return 1;
    }

    cout << "\nCalling setW()..." << endl;
    try {
        setW();
        cout << "setW() completed successfully!" << endl;
        cout << "W_mat dimensions: " << W_mat.rows() << " x " << W_mat.cols() << endl;
        cout << "D_mat dimensions: " << D_mat.rows() << " x " << D_mat.cols() << endl;
    } catch (const exception& e) {
        cout << "setW() failed: " << e.what() << endl;
        return 1;
    }

    cout << "\nTrying to compute E_0_co at rho=0.5..." << endl;
    try {
        double grad_rho, E0;
        double result = E_0_co(R, 0.5, grad_rho, E0);
        cout << "E_0_co successful: E0=" << E0 << ", grad=" << grad_rho << endl;
    } catch (const exception& e) {
        cout << "E_0_co failed: " << e.what() << endl;
        return 1;
    }

    return 0;
}