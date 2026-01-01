#include <iostream>
#include <iomanip>

// Include our exact implementation
#include "exponents/functions_wasm.cpp"

using namespace std;

// Custom E_0_co with debug output
double debug_E_0_co(double r, double rho, double& grad_rho, double& E0) {
    cout << "\n=== DEBUG E_0_co computation ===" << endl;
    cout << "Input: r=" << r << ", rho=" << rho << endl;

    // Compute logqg2 using exact formula from old implementation
    cout << "Computing logqg2..." << endl;
    RowVectorXd qt_exp = Q_mat.transpose() * ((-1.0 / (1.0 + rho)) * D_mat.array()).exp().matrix();
    cout << "Q^T * exp(-D/(1+rho)) size: " << qt_exp.rows() << " x " << qt_exp.cols() << endl;
    cout << "Q^T * exp(-D/(1+rho)) sample: " << qt_exp.head(5) << endl;

    VectorXd logqg2 = qt_exp.transpose().array().log();
    cout << "logqg2 size: " << logqg2.rows() << " x " << logqg2.cols() << endl;
    cout << "logqg2 min: " << logqg2.minCoeff() << ", max: " << logqg2.maxCoeff() << endl;
    cout << "logqg2 sample: " << logqg2.head(5).transpose() << endl;

    // Compute qg2rho = exp(rho * logqg2)
    cout << "\nComputing qg2rho..." << endl;
    VectorXd qg2rho = (rho * logqg2.array()).exp();
    cout << "qg2rho min: " << qg2rho.minCoeff() << ", max: " << qg2rho.maxCoeff() << endl;
    cout << "qg2rho sample: " << qg2rho.head(5).transpose() << endl;

    // Compute pig1_mat = PI * exp((rho/(1+rho)) * D)
    cout << "\nComputing pig1_mat..." << endl;
    MatrixXd pig1_mat = PI_mat.array() * ((rho / (1.0 + rho)) * D_mat.array()).exp();
    cout << "pig1_mat size: " << pig1_mat.rows() << " x " << pig1_mat.cols() << endl;
    cout << "pig1_mat min: " << pig1_mat.minCoeff() << ", max: " << pig1_mat.maxCoeff() << endl;

    // Compute m = Q^T * pig1_mat * qg2rho
    cout << "\nComputing m..." << endl;
    RowVectorXd q_pig = Q_mat.transpose() * pig1_mat;
    cout << "Q^T * pig1_mat size: " << q_pig.rows() << " x " << q_pig.cols() << endl;
    double m = (q_pig * qg2rho).sum();
    cout << "m = " << m << endl;

    // Compute F0 and E0
    cout << "\nComputing final values..." << endl;
    cout << "PI = " << PI << endl;
    double F0 = m / PI;
    cout << "F0 = m/PI = " << F0 << endl;

    E0 = -log2(F0);
    cout << "E0 = -log2(F0) = " << E0 << endl;

    // Compute gradient (simplified for debug)
    grad_rho = 0.0;  // Skip gradient computation for now

    cout << "=== END DEBUG ===" << endl;
    return E0;
}

int main() {
    cout << "Debugging E_0_co intermediate values..." << endl;
    cout << "Test case: M=2, PAM, SNR=5dB, R=0.3" << endl;

    int M = 2;
    const char* typeM = "PAM";
    double SNR_dB = 5.0;
    double R = 0.3;

    // Initialize exactly as the old implementation would
    double SNR = pow(10.0, SNR_dB / 10.0);
    setMod(M, typeM);
    setR(R);
    setSNR(SNR);
    setN(15);

    cout << "\nInitialization complete:" << endl;
    cout << "sizeX: " << sizeX << ", n: " << n << endl;
    cout << "SNR: " << SNR << ", R: " << R << endl;

    // Set up matrices
    setQ();
    setPI();
    setW();

    cout << "\nMatrix setup complete:" << endl;
    cout << "Q_mat size: " << Q_mat.rows() << " x " << Q_mat.cols() << endl;
    cout << "PI_mat size: " << PI_mat.rows() << " x " << PI_mat.cols() << endl;
    cout << "D_mat size: " << D_mat.rows() << " x " << D_mat.cols() << endl;

    // Test E_0_co at rho=1.0 (since we know optimization converges there)
    double test_rho = 1.0;
    double grad_rho, E0;

    cout << fixed << setprecision(8);
    debug_E_0_co(R, test_rho, grad_rho, E0);

    cout << "\nFinal result: E0 = " << E0 << endl;
    cout << "Expected: E0 ≈ 0.6903 (from old implementation)" << endl;

    return 0;
}