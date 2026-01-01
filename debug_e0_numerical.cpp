#include <iostream>
#include <iomanip>

// Include our exact implementation
#include "exponents/functions_wasm.cpp"

using namespace std;

// Custom E_0_co with detailed numerical debugging
double debug_E_0_co_numerical(double r, double rho) {
    cout << "\n=== Debugging E_0_co numerical issues ===" << endl;
    cout << "Input: r=" << r << ", rho=" << rho << endl;

    try {
        // Step 1: Check basic matrix dimensions
        cout << "Matrix dimensions:" << endl;
        cout << "Q_mat: " << Q_mat.rows() << "x" << Q_mat.cols() << endl;
        cout << "D_mat: " << D_mat.rows() << "x" << D_mat.cols() << endl;
        cout << "PI_mat: " << PI_mat.rows() << "x" << PI_mat.cols() << endl;

        // Step 2: Check for NaN/inf in input matrices
        if (D_mat.hasNaN()) cout << "❌ D_mat contains NaN!" << endl;
        if (!D_mat.allFinite()) cout << "❌ D_mat contains inf!" << endl;
        if (PI_mat.hasNaN()) cout << "❌ PI_mat contains NaN!" << endl;
        if (!PI_mat.allFinite()) cout << "❌ PI_mat contains inf!" << endl;

        cout << "D_mat range: [" << D_mat.minCoeff() << ", " << D_mat.maxCoeff() << "]" << endl;

        // Step 3: Compute logqg2 step by step
        cout << "\nStep 1: Computing exp(-D/(1+rho))..." << endl;
        double scale = -1.0 / (1.0 + rho);
        cout << "Scale factor: " << scale << endl;

        MatrixXd scaled_D = scale * D_mat.array();
        cout << "Scaled D range: [" << scaled_D.minCoeff() << ", " << scaled_D.maxCoeff() << "]" << endl;

        MatrixXd exp_scaled_D = scaled_D.array().exp().matrix();
        cout << "exp(scaled D) range: [" << exp_scaled_D.minCoeff() << ", " << exp_scaled_D.maxCoeff() << "]" << endl;

        if (exp_scaled_D.hasNaN()) {
            cout << "❌ exp(scaled D) contains NaN!" << endl;
            return -999;
        }
        if (!exp_scaled_D.allFinite()) {
            cout << "❌ exp(scaled D) contains inf!" << endl;
            return -999;
        }

        // Step 4: Q^T * exp_scaled_D
        cout << "\nStep 2: Computing Q^T * exp(-D/(1+rho))..." << endl;
        RowVectorXd qt_exp = Q_mat.transpose() * exp_scaled_D;
        cout << "Q^T * exp range: [" << qt_exp.minCoeff() << ", " << qt_exp.maxCoeff() << "]" << endl;

        if (qt_exp.hasNaN()) {
            cout << "❌ Q^T * exp contains NaN!" << endl;
            return -999;
        }

        // Step 5: Check for zeros before taking log
        cout << "\nStep 3: Checking for zeros before log..." << endl;
        int zero_count = 0;
        double min_positive = 1e100;
        for (int i = 0; i < qt_exp.cols(); i++) {
            if (qt_exp(i) <= 0) {
                zero_count++;
            } else if (qt_exp(i) < min_positive) {
                min_positive = qt_exp(i);
            }
        }

        cout << "Zero/negative values in Q^T * exp: " << zero_count << " out of " << qt_exp.cols() << endl;
        if (zero_count == 0) {
            cout << "Minimum positive value: " << min_positive << endl;
        } else {
            cout << "❌ Found zero/negative values - will cause log problems!" << endl;
            return -999;
        }

        return 0;  // Success
    } catch (const exception& e) {
        cout << "❌ Exception: " << e.what() << endl;
        return -999;
    }
}

int main() {
    cout << "Debugging E_0_co numerical issues..." << endl;

    // Setup
    setMod(2, "PAM");
    setR(0.3);
    setSNR(5.0);
    setN(15);
    setQ();
    setPI();
    setW();

    cout << "Testing E_0_co at different rho values:" << endl;

    vector<double> test_rhos = {0.0, 0.1, 0.5, 0.9, 1.0};
    for (double rho : test_rhos) {
        cout << "\n" << string(50, '=') << endl;
        cout << "Testing rho = " << rho << endl;

        double result = debug_E_0_co_numerical(0.3, rho);

        if (result != -999) {
            cout << "✅ Numerical computation looks OK for rho=" << rho << endl;
        } else {
            cout << "❌ Numerical issues detected for rho=" << rho << endl;
        }
    }

    return 0;
}