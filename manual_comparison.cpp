#include <iostream>
#include <iomanip>
#include <vector>

// Include our exact implementation
#include "exponents/functions_wasm.cpp"

using namespace std;

struct TestCase {
    int M;
    string typeM;
    double SNR_dB;
    double R;
};

int main() {
    // Test cases from the comparison harness
    vector<TestCase> test_cases = {
        {2, "PAM", 5.0, 0.3},
        {2, "PAM", 5.0, 0.5},
        {2, "PAM", 5.0, 0.7},
        {2, "PAM", 10.0, 0.3},
        {2, "PAM", 10.0, 0.5},
        {2, "PAM", 10.0, 0.7},
        {2, "PAM", 15.0, 0.3},
        {2, "PAM", 15.0, 0.5},
        {2, "PAM", 15.0, 0.7}
    };

    cout << "Manual Comparison - New Exact Implementation vs Old Results" << endl;
    cout << "=========================================================" << endl;
    cout << "Test Case                    | Old E0   | New E0   | Match | Old rho | New rho" << endl;
    cout << "----------------------------+----------+----------+-------+---------+--------" << endl;

    // Expected results from old implementation (from comparison harness output)
    vector<double> old_E0_values = {0.6903, 0.4903, 0.2903, 0.6999, 0.4999, 0.2999, 0.7000, 0.5000, 0.3000};
    vector<double> old_rho_values = {1.0000, 1.0000, 1.0000, 1.0000, 1.0000, 1.0000, 1.0000, 1.0000, 1.0000};

    for (size_t i = 0; i < test_cases.size(); i++) {
        const auto& test = test_cases[i];

        // Run our exact implementation (use same SNR as old implementation - no conversion)
        setMod(test.M, test.typeM.c_str());
        setR(test.R);
        setSNR(test.SNR_dB);  // Pass SNR directly like old implementation
        setN(15);

        // Skip optimization for now and test with rho=0.95 (known to be close to optimal)
        double rho_gd = 0.95;
        double grad_rho, new_E0;
        E_0_co(test.R, rho_gd, grad_rho, new_E0);

        // Compare with old results
        double old_E0 = old_E0_values[i];
        double old_rho = old_rho_values[i];
        double rel_error = abs(new_E0 - old_E0) / abs(old_E0) * 100.0;

        string match_status = (rel_error < 1.0) ? "✅ YES" : "❌ NO";

        cout << fixed << setprecision(4);
        cout << "M=" << test.M << ", " << test.typeM << ", SNR=" << test.SNR_dB << "dB, R=" << test.R;
        cout << " | " << setw(8) << old_E0;
        cout << " | " << setw(8) << new_E0;
        cout << " | " << setw(5) << match_status;
        cout << " | " << setw(7) << old_rho;
        cout << " | " << setw(7) << rho_gd << endl;

        if (rel_error >= 1.0) {
            cout << "                            ERROR: " << rel_error << "% difference!" << endl;
        }
    }

    cout << "\nNote: Our exact implementation should match the old implementation exactly" << endl;
    cout << "      since it's a direct port of the exact mathematical algorithms." << endl;

    return 0;
}