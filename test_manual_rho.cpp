#include <iostream>
#include <iomanip>

// Include our exact implementation
#include "exponents/functions_wasm.cpp"

using namespace std;

int main() {
    cout << "Testing manual rho=1.0 to match old implementation..." << endl;

    // Test cases from the comparison
    vector<tuple<int, string, double, double, double>> test_cases = {
        {2, "PAM", 5.0, 0.3, 0.6903},
        {2, "PAM", 5.0, 0.5, 0.4903},
        {2, "PAM", 5.0, 0.7, 0.2903},
        {2, "PAM", 10.0, 0.3, 0.6999},
        {2, "PAM", 10.0, 0.5, 0.4999},
        {2, "PAM", 10.0, 0.7, 0.2999}
    };

    cout << "Test Case                    | Old E0   | New E0@ρ=1 | Match | Difference" << endl;
    cout << "----------------------------+----------+------------+-------+-----------" << endl;

    for (auto [M, typeM, SNR_dB, R, expected_E0] : test_cases) {
        // Setup
        double SNR = pow(10.0, SNR_dB / 10.0);
        setMod(M, typeM.c_str());
        setR(R);
        setSNR(SNR);
        setN(15);
        setQ();
        setPI();
        setW();

        // Evaluate E_0_co at rho=1.0 (like old implementation)
        double grad_rho, E0;
        E_0_co(R, 1.0, grad_rho, E0);

        double error = abs(E0 - expected_E0);
        string match = (error < 0.01) ? "✅ YES" : "❌ NO";

        cout << fixed << setprecision(4);
        cout << "M=" << M << ", " << typeM << ", SNR=" << SNR_dB << "dB, R=" << R;
        cout << " | " << setw(8) << expected_E0;
        cout << " | " << setw(10) << E0;
        cout << " | " << setw(5) << match;
        cout << " | " << setw(9) << error << endl;
    }

    cout << "\nNote: If all values match at rho=1.0, then the issue is just" << endl;
    cout << "      that the optimization should find rho=1.0, not rho=0.0" << endl;

    return 0;
}