#include <iostream>
#include <iomanip>
#include <chrono>
#include <cmath>
#include <vector>
#include <dlfcn.h>

// Include our new exact implementation
#include "exponents/functions_wasm.cpp"

using namespace std;
using namespace std::chrono;

// Function pointer type for the old implementation
typedef double (*exponents_func_t)(int M, const char* typeM, double SNR_dB, double R, int N, double threshold, double& Pe, double& rho_optimal);

struct TestCase {
    int M;
    string typeM;
    double SNR_dB;
    double R;
};

void compare_implementations() {
    vector<TestCase> test_cases = {
        {4, "PAM", 10.0, 0.5},
        {8, "PAM", 10.0, 0.5},
        {4, "PSK", 10.0, 0.5},
        {8, "PSK", 10.0, 0.5},
        {16, "QAM", 10.0, 0.5},
        {4, "PAM", 5.0, 0.1},
        {4, "PAM", 15.0, 0.9},
        {16, "QAM", 12.0, 0.7}
    };

    // Load the old implementation library
    void* lib_handle = dlopen("EPCalculatorOld/EPCalculatorOld/build/libfunctions.so", RTLD_LAZY);
    if (!lib_handle) {
        cout << "Error loading old implementation: " << dlerror() << endl;
        cout << "Building old implementation first..." << endl;

        system("cd EPCalculatorOld/EPCalculatorOld && make clean && make");

        lib_handle = dlopen("EPCalculatorOld/EPCalculatorOld/build/libfunctions.so", RTLD_LAZY);
        if (!lib_handle) {
            cout << "Failed to load old implementation after building: " << dlerror() << endl;
            return;
        }
    }

    // Get function pointer to the old implementation
    exponents_func_t old_exponents = (exponents_func_t) dlsym(lib_handle, "exponents");
    if (!old_exponents) {
        cout << "Error finding exponents function in old implementation: " << dlerror() << endl;
        dlclose(lib_handle);
        return;
    }

    cout << "Comparison of Old vs New (Exact) Implementation" << endl;
    cout << "=============================================" << endl;
    cout << left << setw(12) << "M" << setw(8) << "Type" << setw(12) << "SNR(dB)" << setw(8) << "R"
         << setw(18) << "Old E0" << setw(18) << "New E0" << setw(15) << "Rel Error %"
         << setw(12) << "Old rho" << setw(12) << "New rho" << setw(15) << "Time Old" << setw(15) << "Time New" << endl;
    cout << string(140, '-') << endl;

    double total_error = 0.0;
    int valid_comparisons = 0;

    for (const auto& test : test_cases) {
        // Test old implementation
        auto start_old = high_resolution_clock::now();
        double old_Pe, old_rho;
        double old_E0 = old_exponents(test.M, test.typeM.c_str(), test.SNR_dB, test.R, 15, 1e-6, old_Pe, old_rho);
        auto end_old = high_resolution_clock::now();
        auto old_time = duration_cast<microseconds>(end_old - start_old);

        // Test new implementation
        double SNR = pow(10.0, test.SNR_dB / 10.0);
        setMod(test.M, test.typeM.c_str());
        setR(test.R);
        setSNR(SNR);
        setN(15);

        double new_rho_gd = 0.5;
        double new_rho_interpolated = 0.5;
        double r = test.R;

        auto start_new = high_resolution_clock::now();
        double new_E0 = GD_iid(r, new_rho_gd, new_rho_interpolated, 20, 15, 1e-6);
        auto end_new = high_resolution_clock::now();
        auto new_time = duration_cast<microseconds>(end_new - start_new);

        // Calculate relative error
        double rel_error = 0.0;
        if (abs(old_E0) > 1e-10) {
            rel_error = 100.0 * abs(new_E0 - old_E0) / abs(old_E0);
            total_error += rel_error;
            valid_comparisons++;
        }

        // Output comparison
        cout << left << setw(12) << test.M << setw(8) << test.typeM << setw(12) << test.SNR_dB << setw(8) << test.R
             << setw(18) << fixed << setprecision(8) << old_E0
             << setw(18) << new_E0
             << setw(15) << setprecision(4) << rel_error
             << setw(12) << setprecision(6) << old_rho
             << setw(12) << new_rho_gd
             << setw(15) << old_time.count() << "μs"
             << setw(15) << new_time.count() << "μs" << endl;
    }

    cout << string(140, '-') << endl;

    if (valid_comparisons > 0) {
        double mean_error = total_error / valid_comparisons;
        cout << "Mean Relative Error: " << fixed << setprecision(4) << mean_error << "%" << endl;

        if (mean_error < 0.01) {
            cout << "✅ EXCELLENT: Results match within 0.01% - exact implementation successful!" << endl;
        } else if (mean_error < 1.0) {
            cout << "✅ GOOD: Results match within 1% - implementation is accurate!" << endl;
        } else if (mean_error < 10.0) {
            cout << "⚠️  WARNING: Results differ by " << mean_error << "% - needs investigation" << endl;
        } else {
            cout << "❌ ERROR: Large discrepancy of " << mean_error << "% - implementation incorrect" << endl;
        }
    }

    dlclose(lib_handle);
}

int main() {
    compare_implementations();
    return 0;
}