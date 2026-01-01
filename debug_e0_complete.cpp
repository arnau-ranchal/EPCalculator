#include <iostream>
#include <iomanip>

// Include our exact implementation
#include "exponents/functions_wasm.cpp"

using namespace std;

int main() {
    cout << "Testing complete E_0_co function..." << endl;

    // Setup
    setMod(2, "PAM");
    setR(0.3);
    setSNR(5.0);
    setN(15);
    setQ();
    setPI();
    setW();

    cout << "Testing E_0_co at different rho values:" << endl;
    cout << "rho\tE0\t\tgrad_rho\tStatus" << endl;

    vector<double> test_rhos = {0.0, 0.1, 0.5, 0.9, 0.95, 1.0};

    for (double rho : test_rhos) {
        double grad_rho, E0;

        try {
            E_0_co(0.3, rho, grad_rho, E0);

            cout << fixed << setprecision(6)
                 << rho << "\t" << E0 << "\t" << grad_rho << "\t";

            if (isnan(E0) || isnan(grad_rho)) {
                cout << "❌ NaN detected";
            } else if (isinf(E0) || isinf(grad_rho)) {
                cout << "❌ Inf detected";
            } else {
                cout << "✅ OK";
            }
            cout << endl;

        } catch (const exception& e) {
            cout << rho << "\t❌ Exception: " << e.what() << endl;
        }
    }

    // Test what the simple version gave us before
    cout << "\nTesting simple E_0_co call at rho=0.5:" << endl;
    double grad_rho, E0;
    E_0_co(0.3, 0.5, grad_rho, E0);
    cout << "E0 = " << E0 << ", grad_rho = " << grad_rho << endl;

    return 0;
}