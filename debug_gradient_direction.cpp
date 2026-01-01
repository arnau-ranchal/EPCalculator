#include <iostream>
#include <iomanip>

// Include our exact implementation
#include "exponents/functions_wasm.cpp"

using namespace std;

int main() {
    cout << "Debugging gradient direction in optimization..." << endl;

    // Setup
    setMod(2, "PAM");
    setR(0.3);
    setSNR(5.0);
    setN(15);
    setQ();
    setPI();
    setW();

    cout << "\nTesting gradient of (E0 - rho*R) at different rho values:" << endl;
    cout << "rho\tE0\tE0-rho*R\tgrad_E0\tgrad_objective\tDirection_to_minimize" << endl;

    vector<double> test_rhos = {0.0, 0.2, 0.4, 0.6, 0.8, 0.95};

    for (double rho : test_rhos) {
        double grad_rho, E0;
        E_0_co(0.3, rho, grad_rho, E0);

        double objective = E0 - rho * 0.3;
        double grad_objective = grad_rho - 0.3;

        string direction = (grad_objective > 0) ? "decrease_rho" : "increase_rho";

        cout << fixed << setprecision(4)
             << rho << "\t" << E0 << "\t" << objective
             << "\t\t" << grad_rho << "\t" << grad_objective
             << "\t\t" << direction << endl;
    }

    cout << "\nFor minimization:" << endl;
    cout << "- If grad_objective > 0: should decrease rho" << endl;
    cout << "- If grad_objective < 0: should increase rho" << endl;

    cout << "\nTesting manual gradient descent step from rho=0.5:" << endl;
    double rho = 0.5;
    double learning_rate = 0.1;

    double grad_rho, E0;
    E_0_co(0.3, rho, grad_rho, E0);
    double grad_objective = grad_rho - 0.3;

    cout << "Current rho: " << rho << endl;
    cout << "Gradient: " << grad_objective << endl;
    cout << "Update: rho - learning_rate * grad_objective" << endl;
    cout << "New rho: " << rho << " - " << learning_rate << " * " << grad_objective
         << " = " << (rho - learning_rate * grad_objective) << endl;

    return 0;
}