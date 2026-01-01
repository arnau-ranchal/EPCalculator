#include <iostream>
#include <iomanip>

// Include our exact implementation
#include "exponents/functions_wasm.cpp"

using namespace std;

int main() {
    cout << "Testing corrected gradient computation..." << endl;

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

    // Get analytical gradient
    double grad_rho, E0;
    E_0_co(R, test_rho, grad_rho, E0);
    double analytical_grad_objective = grad_rho - R;  // Gradient of (E0 - rho*R)

    // Get numerical gradient (with stable step size)
    auto compute_obj = [&](double rho) {
        double dummy_grad, E0_val;
        E_0_co(R, rho, dummy_grad, E0_val);
        return E0_val - rho * R;
    };

    double h = 1e-4;  // Use stable step size
    double obj_current = compute_obj(test_rho);
    double obj_plus = compute_obj(test_rho + h);
    double numerical_grad = (obj_plus - obj_current) / h;

    cout << "\nComparison at rho = " << test_rho << ":" << endl;
    cout << "Analytical gradient of (E0-rho*R): " << analytical_grad_objective << endl;
    cout << "Numerical gradient of (E0-rho*R):  " << numerical_grad << endl;
    cout << "Difference: " << abs(analytical_grad_objective - numerical_grad) << endl;

    if (abs(analytical_grad_objective - numerical_grad) < 0.1) {
        cout << "✅ GRADIENTS MATCH! Gradient computation is correct." << endl;
    } else {
        cout << "❌ Gradients don't match. Still have an error." << endl;
    }

    return 0;
}