#include <iostream>
#include <iomanip>

// Include the new WASM interface that uses old implementation
#include "exponents/exponents_wasm_new.cpp"

using namespace std;

int main() {
    cout << "Testing Final WASM Interface with Old Implementation" << endl;
    cout << "====================================================" << endl;

    // Test cases from the comparison harness
    vector<tuple<int, string, double, double, double, double>> test_cases = {
        {2, "PAM", 5.0, 0.3, 0.6903, 1.0000},
        {2, "PAM", 5.0, 0.5, 0.4903, 1.0000},
        {2, "PAM", 5.0, 0.7, 0.2903, 1.0000},
        {2, "PAM", 10.0, 0.3, 0.6999, 1.0000},
        {2, "PAM", 10.0, 0.5, 0.4999, 1.0000},
        {2, "PAM", 10.0, 0.7, 0.2999, 1.0000},
        {2, "PAM", 15.0, 0.3, 0.7000, 1.0000},
        {2, "PAM", 15.0, 0.5, 0.5000, 1.0000},
        {2, "PAM", 15.0, 0.7, 0.3000, 1.0000},
        {4, "PAM", 5.0, 0.3, 1.0491, 1.0000}
    };

    cout << "Test Case                    | Expected E0 | Computed E0 | Expected rho | Computed rho | Status" << endl;
    cout << "----------------------------+-------------+-------------+--------------+--------------+--------" << endl;

    int perfect_matches = 0;
    int total_tests = 0;

    for (auto [M, typeM, SNR, R, expected_E0, expected_rho] : test_cases) {
        float results[3];

        try {
            // Call the WASM interface
            float* result = exponents(M, typeM.c_str(), SNR, R, 15, 128, 1e-6, results);

            if (result != nullptr) {
                float Pe = results[0];
                float E0 = results[1];
                float rho = results[2];

                double E0_error = abs(E0 - expected_E0);
                double rho_error = abs(rho - expected_rho);

                string status;
                if (E0_error < 0.0001 && rho_error < 0.0001) {
                    status = "✅ PERFECT";
                    perfect_matches++;
                } else if (E0_error < 0.01 && rho_error < 0.01) {
                    status = "✅ GOOD";
                } else {
                    status = "❌ ERROR";
                }

                cout << fixed << setprecision(4);
                cout << "M=" << M << ", " << typeM << ", SNR=" << SNR << ", R=" << R;
                cout << " | " << setw(11) << expected_E0;
                cout << " | " << setw(11) << E0;
                cout << " | " << setw(12) << expected_rho;
                cout << " | " << setw(12) << rho;
                cout << " | " << status << endl;

            } else {
                cout << "M=" << M << ", " << typeM << ", SNR=" << SNR << ", R=" << R;
                cout << " | ERROR: exponents returned null" << endl;
            }

        } catch (const exception& ex) {
            cout << "M=" << M << ", " << typeM << ", SNR=" << SNR << ", R=" << R;
            cout << " | EXCEPTION: " << ex.what() << endl;
        }

        total_tests++;
    }

    cout << "\n" << string(100, '=') << endl;
    cout << "FINAL RESULTS:" << endl;
    cout << "Perfect matches: " << perfect_matches << " / " << total_tests << endl;
    cout << "Success rate: " << (100.0 * perfect_matches / total_tests) << "%" << endl;

    if (perfect_matches == total_tests) {
        cout << "🎉 ALL TESTS PASSED! Implementation matches old results exactly!" << endl;
    } else {
        cout << "❌ Some tests failed. Implementation needs debugging." << endl;
    }

    return 0;
}