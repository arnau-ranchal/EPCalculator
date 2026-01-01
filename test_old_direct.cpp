#include <iostream>
#include <iomanip>

// Include the old implementation directly
#define DEBUG false  // Disable debug output
#include "exponents/functions_old.cpp"

using namespace std;

int main() {
    cout << "Testing direct integration of old C++ implementation" << endl;
    cout << "====================================================" << endl;

    // Test cases from the comparison harness
    vector<tuple<int, string, double, double, double>> test_cases = {
        {2, "PAM", 5.0, 0.3, 0.6903},
        {2, "PAM", 5.0, 0.5, 0.4903},
        {2, "PAM", 5.0, 0.7, 0.2903},
        {2, "PAM", 10.0, 0.3, 0.6999},
        {2, "PAM", 10.0, 0.5, 0.4999},
        {2, "PAM", 10.0, 0.7, 0.2999}
    };

    cout << "Test Case                    | Expected | Computed | Match | Rho    | Status" << endl;
    cout << "----------------------------+----------+----------+-------+--------+-------" << endl;

    for (auto [M, typeM, SNR, R, expected_E0] : test_cases) {
        try {
            // Call the old implementation exactly as it expects
            int it = 20;
            setMod(M, typeM);
            setQ(); // matrix Q
            setR(R);
            setSNR(SNR);
            setN(15);

            // matrices
            setPI();
            setW();

            double rho_gd, rho_interpolated;
            double r;
            double e0 = GD_iid(r, rho_gd, rho_interpolated, it, 15, 1e-6);

            double error = abs(e0 - expected_E0);
            string match = (error < 0.01) ? "✅ YES" : "❌ NO";
            string status = (error < 0.01) ? "PERFECT" : "ERROR";

            cout << fixed << setprecision(4);
            cout << "M=" << M << ", " << typeM << ", SNR=" << SNR << ", R=" << R;
            cout << " | " << setw(8) << expected_E0;
            cout << " | " << setw(8) << e0;
            cout << " | " << setw(5) << match;
            cout << " | " << setw(6) << rho_gd;
            cout << " | " << setw(7) << status << endl;

        } catch (const exception& ex) {
            cout << "M=" << M << ", " << typeM << ", SNR=" << SNR << ", R=" << R;
            cout << " | ERROR: " << ex.what() << endl;
        }
    }

    cout << "\nNote: This uses the exact same old implementation that works correctly." << endl;
    return 0;
}