#include <iostream>
#include <iomanip>

// Include our exact implementation
#include "exponents/functions_wasm.cpp"

using namespace std;

double compute_objective(double rho, double R) {
    double grad_dummy, E0;
    E_0_co(R, rho, grad_dummy, E0);
    return E0 - rho * R;
}

int main() {
    cout << "Testing numerical gradient with different step sizes..." << endl;

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

    double test_rho = 0.5;
    double objective = compute_objective(test_rho, R);

    cout << "\nObjective at rho=" << test_rho << ": " << objective << endl;
    cout << "\nNumerical gradients with different step sizes:" << endl;
    cout << "Step_size\tNumerical_grad\tObjective_at_rho+h" << endl;

    vector<double> step_sizes = {1e-2, 1e-3, 1e-4, 1e-5, 1e-6, 1e-7, 1e-8};

    for (double h : step_sizes) {
        double obj_plus = compute_objective(test_rho + h, R);
        double numerical_grad = (obj_plus - objective) / h;

        cout << scientific << setprecision(2)
             << h << "\t\t" << numerical_grad << "\t\t" << fixed << setprecision(6) << obj_plus << endl;
    }

    // Also check what happens around rho boundaries
    cout << "\nObjective function near boundaries:" << endl;
    cout << "rho\tE0-rho*R" << endl;

    vector<double> test_points = {0.001, 0.01, 0.1, 0.2, 0.5, 0.8, 0.9, 0.99, 0.999};
    for (double rho : test_points) {
        double obj = compute_objective(rho, R);
        cout << rho << "\t" << obj << endl;
    }

    return 0;
}