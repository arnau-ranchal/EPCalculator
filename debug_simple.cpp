#include <iostream>
#include <iomanip>

// Include our exact implementation
#include "exponents/functions_wasm.cpp"

using namespace std;

int main() {
    cout << "Simple debugging of matrix dimensions..." << endl;

    int M = 2;
    const char* typeM = "PAM";
    double SNR_dB = 5.0;
    double R = 0.3;

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

    cout << "Matrix dimensions:" << endl;
    cout << "Q_mat: " << Q_mat.rows() << " x " << Q_mat.cols() << endl;
    cout << "PI_mat: " << PI_mat.rows() << " x " << PI_mat.cols() << endl;
    cout << "D_mat: " << D_mat.rows() << " x " << D_mat.cols() << endl;
    cout << "W_mat: " << W_mat.rows() << " x " << W_mat.cols() << endl;

    double test_rho = 0.5;

    cout << "\nTesting individual operations:" << endl;

    // Test 1: Check if (-1.0 / (1.0 + rho)) * D_mat works
    try {
        MatrixXd scaled_D = (-1.0 / (1.0 + test_rho)) * D_mat.array();
        cout << "✅ Scaled D_mat: " << scaled_D.rows() << " x " << scaled_D.cols() << endl;

        // Test 2: exp of scaled D
        MatrixXd exp_scaled_D = scaled_D.array().exp().matrix();
        cout << "✅ exp(scaled D): " << exp_scaled_D.rows() << " x " << exp_scaled_D.cols() << endl;

        // Test 3: Q_mat.transpose() * exp_scaled_D
        RowVectorXd qt_times_exp = Q_mat.transpose() * exp_scaled_D;
        cout << "✅ Q^T * exp: " << qt_times_exp.rows() << " x " << qt_times_exp.cols() << endl;

        // Test 4: log of the result
        VectorXd logqg2 = qt_times_exp.transpose().array().log();
        cout << "✅ logqg2: " << logqg2.rows() << " x " << logqg2.cols() << endl;

        cout << "logqg2 sample values: " << logqg2.head(5).transpose() << endl;

    } catch (const exception& e) {
        cout << "❌ Error: " << e.what() << endl;
    }

    return 0;
}