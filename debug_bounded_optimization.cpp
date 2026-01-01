#include <iostream>
#include <iomanip>

// Include our exact implementation
#include "exponents/functions_wasm.cpp"

using namespace std;

// Test optimization with different boundary constraints
double bounded_optimization(double R, double lower_bound = 0.01, double upper_bound = 0.99) {
    cout << "Testing bounded optimization with bounds [" << lower_bound << ", " << upper_bound << "]" << endl;

    double rho = 0.5;  // Start in middle
    double learning_rate = 0.1;
    int max_iterations = 50;
    double threshold = 1e-6;

    cout << "Iteration\trho\t\tE0\t\tE0-rho*R\tGradient" << endl;
    cout << "---------\t---\t\t--\t\t--------\t--------" << endl;

    for (int i = 0; i < max_iterations; i++) {
        double grad_rho, E0;
        E_0_co(R, rho, grad_rho, E0);

        double objective = E0 - rho * R;
        double grad_objective = grad_rho - R;

        cout << fixed << setprecision(6)
             << i << "\t\t" << rho << "\t" << E0 << "\t" << objective << "\t" << grad_objective << endl;

        // Check convergence
        if (abs(grad_objective) < threshold) {
            cout << "Converged!" << endl;
            break;
        }

        // Update rho with gradient ascent (maximize objective)
        double new_rho = rho + learning_rate * grad_objective;

        // Apply bounds
        new_rho = max(lower_bound, min(new_rho, upper_bound));

        // If we hit a boundary and gradient still points outward, we're at the constrained optimum
        if ((new_rho == lower_bound && grad_objective > 0) ||
            (new_rho == upper_bound && grad_objective < 0)) {
            cout << "Hit boundary constraint. Optimal rho = " << new_rho << endl;
            rho = new_rho;
            break;
        }

        rho = new_rho;
    }

    // Final evaluation
    double final_grad, final_E0;
    E_0_co(R, rho, final_grad, final_E0);

    cout << "\nFinal result:" << endl;
    cout << "Optimal rho: " << rho << endl;
    cout << "E0: " << final_E0 << endl;
    cout << "E0-rho*R: " << (final_E0 - rho * R) << endl;

    return final_E0;
}

int main() {
    cout << "Testing different boundary constraints for optimization..." << endl;

    // Setup same as old implementation test case
    int M = 2;
    const char* typeM = "PAM";
    double SNR_dB = 5.0;
    double R = 0.3;

    double SNR = pow(10.0, SNR_dB / 10.0);
    setMod(M, typeM);
    setR(R);
    setSNR(SNR);
    setN(15);
    setQ();
    setPI();
    setW();

    cout << "\nTest case: M=2, PAM, SNR=5dB, R=0.3" << endl;
    cout << "Expected from old implementation: E0=0.6903, rho=1.0" << endl;
    cout << "\n" << string(80, '=') << endl;

    // Test 1: No bounds (should go to rho=0)
    cout << "\nTest 1: Unconstrained optimization" << endl;
    bounded_optimization(R, 0.0, 1.0);

    cout << "\n" << string(80, '=') << endl;

    // Test 2: Constrained to avoid exact boundaries
    cout << "\nTest 2: Constrained to [0.01, 0.99]" << endl;
    bounded_optimization(R, 0.01, 0.99);

    cout << "\n" << string(80, '=') << endl;

    // Test 3: Constrained more tightly
    cout << "\nTest 3: Constrained to [0.1, 0.9]" << endl;
    bounded_optimization(R, 0.1, 0.9);

    return 0;
}