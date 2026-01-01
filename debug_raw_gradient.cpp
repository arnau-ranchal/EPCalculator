#include <iostream>
#include <iomanip>
#include <vector>

// Include our exact implementation
#include "exponents/functions_wasm.cpp"

using namespace std;

// Modified E_0_co to show raw gradient before any modifications
double debug_E_0_co_gradient(double r, double rho, double& raw_grad_E0, double& final_grad) {
    // Same computation as E_0_co but with detailed gradient output
    RowVectorXd qt_exp = Q_mat.transpose() * ((-1.0 / (1.0 + rho)) * D_mat.array()).exp().matrix();
    VectorXd logqg2 = qt_exp.transpose().array().log();
    VectorXd qg2rho = (rho * logqg2.array()).exp();
    MatrixXd pig1_mat = PI_mat.array() * ((rho / (1.0 + rho)) * D_mat.array()).exp();

    double m = (Q_mat.transpose() * pig1_mat * qg2rho).sum();
    double mp = (Q_mat.transpose() * pig1_mat * (qg2rho.array() * logqg2.array()).matrix()).sum()
                - (1.0 / (1.0 + rho)) *
                  (Q_mat.transpose() * (pig1_mat.array() * (-D_mat.array())).matrix() * qg2rho).sum();

    double F0 = m / PI;
    double Fder0 = mp / PI;

    // This is the raw gradient of E0 w.r.t. rho from the original formula
    raw_grad_E0 = -(Fder0) / (log(2) * F0);

    // Final gradient should be for maximizing E0 - rho*R
    final_grad = raw_grad_E0 - r;  // Gradient of (E0 - rho*R)

    double E0 = log2(F0);
    return E0;
}

int main() {
    cout << "Debugging raw gradient computation..." << endl;

    // Setup
    int M = 2;
    const char* typeM = "PAM";
    double SNR_dB = 5.0;
    double R = 0.5;

    double SNR = pow(10.0, SNR_dB / 10.0);
    setMod(M, typeM);
    setR(R);
    setSNR(SNR);
    setN(15);
    setQ();
    setPI();
    setW();

    cout << "\nAnalyzing gradients:" << endl;
    cout << "rho\tE0\tE0-rho*R\tRaw_dE0/drho\tFinal_Grad\tNumerical_Check" << endl;
    cout << "---\t--\t--------\t-----------\t----------\t--------------" << endl;

    vector<double> test_rhos = {0.1, 0.3, 0.5, 0.7, 0.9};

    for (double rho : test_rhos) {
        double raw_grad, final_grad;
        double E0 = debug_E_0_co_gradient(R, rho, raw_grad, final_grad);
        double objective = E0 - rho * R;

        // Numerical check: compute derivative of E0-rho*R numerically
        double h = 1e-6;
        double grad_dummy, E0_plus;
        debug_E_0_co_gradient(R, rho + h, E0_plus, grad_dummy);
        double numerical_grad = ((E0_plus - (rho + h) * R) - (E0 - rho * R)) / h;

        cout << fixed << setprecision(3)
             << rho << "\t" << E0 << "\t" << objective
             << "\t\t" << raw_grad << "\t\t" << final_grad
             << "\t\t" << numerical_grad << endl;
    }

    cout << "\nNote: For maximization, we want to move in direction of positive gradient" << endl;
    cout << "If Final_Grad matches Numerical_Check, then gradient computation is correct" << endl;

    return 0;
}