#include <iostream>
#include <iomanip>
#include <vector>

// Include our exact implementation
#include "exponents/functions_wasm.cpp"

using namespace std;

int main() {
    cout << "Testing E_0_co variation with rho..." << endl;

    // Setup for M=2, PAM, SNR=5dB, R=0.5
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

    cout << "\nTesting E_0_co at different rho values:" << endl;
    cout << "rho\tE0\tE0-rho*R\tGradient" << endl;
    cout << "---\t--\t--------\t--------" << endl;

    vector<double> test_rhos = {0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0};

    for (double rho : test_rhos) {
        double grad_rho, E0;
        E_0_co(R, rho, grad_rho, E0);
        double objective = E0 - rho * R;

        cout << fixed << setprecision(3)
             << rho << "\t" << E0 << "\t" << objective << "\t\t" << grad_rho << endl;
    }

    cout << "\nNote: The optimization should maximize (E0 - rho*R)" << endl;
    cout << "The optimal rho should be where the gradient of (E0 - rho*R) is zero" << endl;

    // Test what the gradient descent actually does
    cout << "\nTesting gradient descent:" << endl;
    double rho_gd = 0.5;
    double rho_interpolated = 0.5;
    double r = R;

    double result = GD_iid(r, rho_gd, rho_interpolated, 20, 15, 1e-6);
    cout << "Gradient descent result: " << result << endl;
    cout << "Final rho: " << rho_gd << endl;
    cout << "Final E0: " << result + rho_gd * r << endl;

    return 0;
}