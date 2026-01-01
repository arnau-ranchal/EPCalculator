#include <iostream>
#include <iomanip>

// Include our exact implementation
#include "exponents/functions_wasm.cpp"

using namespace std;

int main() {
    cout << "Detailed debugging of E_0_co computation..." << endl;

    int M = 2;
    const char* typeM = "PAM";
    double SNR_dB = 5.0;
    double R = 0.3;
    double test_rho = 0.5;

    // Convert SNR from dB to linear scale
    double SNR = pow(10.0, SNR_dB / 10.0);

    // Initialize parameters
    setMod(M, typeM);
    setR(R);
    setSNR(SNR);
    setN(15);
    setQ();
    setPI();
    setW();

    cout << fixed << setprecision(6);
    cout << "PI constant: " << PI << endl;
    cout << "sizeX: " << sizeX << ", n: " << n << endl;

    // Manual computation to debug E_0_co
    cout << "\nManual E_0_co computation at rho=" << test_rho << ":" << endl;

    // Compute logqg2
    VectorXd exp_term = ((-1.0 / (1.0 + test_rho)) * D_mat.array()).exp().matrix();
    cout << "exp_term min: " << exp_term.minCoeff() << ", max: " << exp_term.maxCoeff() << endl;

    VectorXd qt_exp = Q_mat.transpose() * exp_term;
    cout << "Q^T * exp_term min: " << qt_exp.minCoeff() << ", max: " << qt_exp.maxCoeff() << endl;

    VectorXd logqg2 = qt_exp.array().log();
    cout << "logqg2 min: " << logqg2.minCoeff() << ", max: " << logqg2.maxCoeff() << endl;

    // Compute qg2rho
    VectorXd qg2rho = (test_rho * logqg2.array()).exp();
    cout << "qg2rho min: " << qg2rho.minCoeff() << ", max: " << qg2rho.maxCoeff() << endl;

    // Compute pig1_mat
    MatrixXd pig1_mat = PI_mat.array() * ((test_rho / (1.0 + test_rho)) * D_mat.array()).exp();
    cout << "pig1_mat min: " << pig1_mat.minCoeff() << ", max: " << pig1_mat.maxCoeff() << endl;

    // Compute m
    double m = (Q_mat.transpose() * pig1_mat * qg2rho).sum();
    cout << "m: " << m << endl;

    // Compute F0
    double F0 = m / PI;
    cout << "F0: " << F0 << endl;

    // Check if F0 is reasonable (should be positive and < 1 for meaningful error exponent)
    double E0 = -log2(F0);
    cout << "E0 = -log2(F0): " << E0 << endl;

    // Compare with direct function call
    double grad_rho, E0_direct;
    E_0_co(R, test_rho, grad_rho, E0_direct);
    cout << "\nDirect E_0_co call: E0=" << E0_direct << ", grad=" << grad_rho << endl;

    return 0;
}