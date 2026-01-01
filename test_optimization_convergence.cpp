#include <iostream>
#include <iomanip>

// Include our exact implementation
#include "exponents/functions_wasm.cpp"

using namespace std;

int main() {
    cout << "Testing optimization convergence..." << endl;

    // Test case: M=2, PAM, SNR=5, R=0.3
    int M = 2;
    const char* typeM = "PAM";
    double SNR = 5.0;
    double R = 0.3;

    setMod(M, typeM);
    setR(R);
    setSNR(SNR);
    setN(15);

    // Test what my optimization actually finds
    double rho_gd = 0.5;  // Starting point
    double rho_interpolated = 0.5;
    double r = R;

    cout << "Running gradient descent..." << endl;
    double optimization_result = GD_iid(r, rho_gd, rho_interpolated, 20, 15, 1e-6);

    cout << "Optimization results:" << endl;
    cout << "Final rho: " << rho_gd << endl;
    cout << "Optimization result (E0-rho*R): " << optimization_result << endl;

    // Calculate actual E0
    double grad_rho, E0;
    E_0_co(R, rho_gd, grad_rho, E0);
    cout << "Final E0: " << E0 << endl;
    cout << "Expected E0: 0.6903" << endl;
    cout << "Difference: " << abs(E0 - 0.6903) << endl;

    // Test if the old implementation might be finding a different rho
    cout << "\nTesting E0 at different rho values:" << endl;
    cout << "rho\tE0\tDifference from expected" << endl;

    vector<double> test_rhos = {0.0, 0.2, 0.4, 0.6, 0.8, 0.9, 0.95, 0.99, 1.0};
    for (double rho : test_rhos) {
        E_0_co(R, rho, grad_rho, E0);
        double diff = abs(E0 - 0.6903);
        cout << fixed << setprecision(4) << rho << "\t" << E0 << "\t" << diff;
        if (diff < 0.01) cout << " ← CLOSE MATCH!";
        cout << endl;
    }

    return 0;
}