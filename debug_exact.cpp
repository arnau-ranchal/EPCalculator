#include <iostream>
#include <iomanip>

// Include our exact implementation
#include "exponents/functions_wasm.cpp"

using namespace std;

int main() {
    cout << "Debugging exact implementation with M=2, PAM, SNR=5dB, R=0.3" << endl;

    int M = 2;
    const char* typeM = "PAM";
    double SNR_dB = 5.0;
    double R = 0.3;

    // Convert SNR from dB to linear scale
    double SNR = pow(10.0, SNR_dB / 10.0);
    cout << "SNR linear: " << SNR << endl;

    // Initialize parameters
    setMod(M, typeM);
    setR(R);
    setSNR(SNR);
    setN(15);

    cout << "Initialized parameters. Checking constellation:" << endl;
    for (int i = 0; i < sizeX; i++) {
        cout << "X[" << i << "] = " << X[i] << endl;
    }

    cout << "\nTesting E_0_co function directly..." << endl;

    // Test E_0_co at different rho values
    vector<double> test_rhos = {0.0, 0.1, 0.5, 0.9, 1.0};

    for (double rho : test_rhos) {
        double grad_rho, E0;
        double result = E_0_co(R, rho, grad_rho, E0);

        cout << "rho=" << rho << ": E0=" << E0 << ", grad=" << grad_rho << ", E0-rho*R=" << (E0-rho*R) << endl;
    }

    cout << "\nRunning initial guess calculation..." << endl;

    // Get boundary values for initial guess
    double grad_rho, e0;
    E_0_co(R, 0, grad_rho, e0);
    double E0_0 = e0, E0_prime_0 = grad_rho;
    cout << "At rho=0: E0=" << E0_0 << ", E0'=" << E0_prime_0 << endl;

    E_0_co(R, 1, grad_rho, e0);
    double E0_1 = e0, E0_prime_1 = grad_rho;
    cout << "At rho=1: E0=" << E0_1 << ", E0'=" << E0_prime_1 << endl;

    // Calculate initial guess
    double max_g;
    double initial_rho = initial_guess(R, E0_0, E0_1, E0_prime_0, E0_prime_1, max_g);
    cout << "Initial guess: rho=" << initial_rho << ", max_g=" << max_g << endl;

    cout << "\nRunning full gradient descent..." << endl;

    double rho_gd = 0.5;
    double rho_interpolated = 0.5;
    double r = R;

    double final_result = GD_iid(r, rho_gd, rho_interpolated, 20, 15, 1e-6);

    cout << "Final result: E0-rho*R=" << final_result << ", optimal rho=" << rho_gd << endl;

    // Calculate the actual E0
    E_0_co(r, rho_gd, grad_rho, e0);
    cout << "Final E0=" << e0 << ", should equal " << (final_result + rho_gd * r) << endl;

    return 0;
}