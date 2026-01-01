#include <iostream>
#include <iomanip>

// Include our exact implementation
#include "exponents/functions_wasm.cpp"

using namespace std;

int main() {
    cout << "Debugging boundary constraint behavior..." << endl;

    // Setup
    setMod(2, "PAM");
    setR(0.3);
    setSNR(5.0);
    setN(15);

    // Test the exact gradient descent steps manually
    double rho = 0.5;  // Start at middle
    double learning_rate = 0.1;
    double r = 0.3;
    int max_iterations = 10;

    cout << "Manual gradient descent simulation:" << endl;
    cout << "Iter\trho\t\tE0\t\tObjective\tGradient\tNew_rho\tConstrained" << endl;

    for (int i = 0; i < max_iterations; i++) {
        double grad_rho, e0;
        E_0_co(r, rho, grad_rho, e0);

        double objective = e0 - rho * r;
        double grad_objective = grad_rho - r;

        double new_rho_unconstrained = rho - learning_rate * grad_objective;
        double new_rho_constrained = max(0.0, min(new_rho_unconstrained, 1.0));

        cout << fixed << setprecision(4)
             << i << "\t" << rho << "\t\t" << e0 << "\t" << objective
             << "\t\t" << grad_objective << "\t\t" << new_rho_unconstrained
             << "\t" << new_rho_constrained << endl;

        if (abs(grad_objective) < 1e-6) {
            cout << "Converged!" << endl;
            break;
        }

        rho = new_rho_constrained;
    }

    cout << "\nFinal result: rho = " << rho << endl;

    // Test what happens if we use a smaller learning rate
    cout << "\n" << string(60, '=') << endl;
    cout << "Testing with smaller learning rate (0.01):" << endl;

    rho = 0.5;
    learning_rate = 0.01;

    for (int i = 0; i < 30; i++) {
        double grad_rho, e0;
        E_0_co(r, rho, grad_rho, e0);

        double grad_objective = grad_rho - r;
        double new_rho = max(0.0, min(rho - learning_rate * grad_objective, 1.0));

        if (i % 5 == 0) {  // Print every 5th iteration
            cout << "Iter " << i << ": rho=" << fixed << setprecision(6) << rho
                 << ", grad=" << grad_objective << ", new_rho=" << new_rho << endl;
        }

        if (abs(grad_objective) < 1e-6) {
            cout << "Converged at iteration " << i << "!" << endl;
            break;
        }

        rho = new_rho;
    }

    cout << "Final result with small learning rate: rho = " << rho << endl;

    return 0;
}