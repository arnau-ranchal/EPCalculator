#include <iostream>
#include <iomanip>
#include <vector>
#include <cmath>
#include "functions.h"

using namespace std;

struct ConvergenceResult {
    int N;
    double E0;
    double rho;
    double abs_error;
    double rel_error;
    double computation_time_us;
};

int main(int argc, char* argv[]) {
    // Default parameters
    int M = 2;
    string type = "PAM";
    double SNR = 20.0;
    double R = 0.5;

    // Parse command line arguments
    if (argc > 1) M = atoi(argv[1]);
    if (argc > 2) type = string(argv[2]);
    if (argc > 3) SNR = atof(argv[3]);
    if (argc > 4) R = atof(argv[4]);

    cout << "=========================================================" << endl;
    cout << "      QUADRATURE CONVERGENCE ANALYSIS" << endl;
    cout << "=========================================================" << endl;
    cout << "Parameters:" << endl;
    cout << "  M = " << M << endl;
    cout << "  Type = " << type << endl;
    cout << "  SNR = " << SNR << " dB" << endl;
    cout << "  R = " << R << endl;
    cout << "=========================================================" << endl;
    cout << endl;

    // Valid N values to test (N=99, 101, 300, 500 cause numerical issues)
    vector<int> N_values = {15, 20, 25, 30, 35, 40, 100, 200};
    vector<ConvergenceResult> results;

    // First, compute reference value with N=200 (N=500 fails numerically)
    cout << "Computing reference value with N=200..." << endl;
    setN(200);
    setMod(M, type.c_str());
    setSNR(SNR);
    setR(R);
    setQ();
    setPI();
    setW();

    double r_ref = R;
    double rho_ref = 1.0;
    double rho_interp_ref = 0.0;

    auto start_ref = chrono::high_resolution_clock::now();
    double E0_ref = GD_iid(r_ref, rho_ref, rho_interp_ref, 20, 200, 1e-6);
    auto end_ref = chrono::high_resolution_clock::now();
    auto duration_ref = chrono::duration_cast<chrono::microseconds>(end_ref - start_ref);

    cout << "Reference: E0(200) = " << fixed << setprecision(10) << E0_ref
         << ", rho = " << rho_ref << endl;
    cout << "Reference computation time: " << duration_ref.count() << " μs" << endl;
    cout << endl;

    // Check if reference value is valid
    if (!isfinite(E0_ref) || E0_ref < 0) {
        cerr << "ERROR: Invalid reference value E0_ref=" << E0_ref << endl;
        return 1;
    }

    // Now test convergence for each N
    cout << "Testing convergence for different N values..." << endl;
    cout << endl;

    for (int N : N_values) {
        ConvergenceResult result;
        result.N = N;

        // Setup for this N
        setN(N);
        setMod(M, type.c_str());
        setSNR(SNR);
        setR(R);
        setQ();
        setPI();
        setW();

        double r = R;
        double rho = 1.0;
        double rho_interp = 0.0;

        // Compute E0 with this N
        auto start = chrono::high_resolution_clock::now();
        result.E0 = GD_iid(r, rho, rho_interp, 20, N, 1e-6);
        auto end = chrono::high_resolution_clock::now();
        auto duration = chrono::duration_cast<chrono::microseconds>(end - start);

        result.rho = rho;
        result.computation_time_us = duration.count();

        // Calculate errors relative to N=500
        result.abs_error = abs(result.E0 - E0_ref);
        if (E0_ref != 0) {
            result.rel_error = result.abs_error / abs(E0_ref);
        } else {
            result.rel_error = 0;
        }

        results.push_back(result);
    }

    // Print results table
    cout << "=========================================================" << endl;
    cout << "                  CONVERGENCE RESULTS" << endl;
    cout << "=========================================================" << endl;
    cout << endl;

    cout << setw(6) << "N"
         << setw(16) << "E0(N)"
         << setw(12) << "rho(N)"
         << setw(16) << "Abs Error"
         << setw(16) << "Rel Error"
         << setw(14) << "Time (μs)" << endl;
    cout << string(80, '-') << endl;

    for (const auto& res : results) {
        cout << setw(6) << res.N
             << setw(16) << scientific << setprecision(8) << res.E0
             << setw(12) << fixed << setprecision(6) << res.rho
             << setw(16) << scientific << setprecision(2) << res.abs_error
             << setw(16) << scientific << setprecision(2) << res.rel_error
             << setw(14) << fixed << setprecision(0) << res.computation_time_us
             << endl;
    }

    cout << endl;
    cout << "Reference (N=200):" << endl;
    cout << "  E0 = " << scientific << setprecision(10) << E0_ref << endl;
    cout << "  rho = " << fixed << setprecision(8) << rho_ref << endl;
    cout << "  Time = " << duration_ref.count() << " μs" << endl;
    cout << endl;

    // Precision recommendations
    cout << "=========================================================" << endl;
    cout << "          MINIMUM N FOR GIVEN PRECISION" << endl;
    cout << "=========================================================" << endl;
    cout << endl;

    vector<double> precision_levels = {1e-2, 1e-3, 1e-4, 1e-5, 1e-6, 1e-7, 1e-8};

    cout << setw(15) << "Precision" << setw(15) << "Min N" << setw(20) << "Actual Error" << endl;
    cout << string(50, '-') << endl;

    for (double prec : precision_levels) {
        int min_N = -1;
        double actual_error = 1e10;

        for (const auto& res : results) {
            if (res.rel_error <= prec) {
                min_N = res.N;
                actual_error = res.rel_error;
                break;
            }
        }

        if (min_N > 0) {
            cout << setw(15) << scientific << setprecision(0) << prec
                 << setw(15) << min_N
                 << setw(20) << scientific << setprecision(2) << actual_error
                 << endl;
        } else {
            cout << setw(15) << scientific << setprecision(0) << prec
                 << setw(15) << "N/A"
                 << setw(20) << "---"
                 << endl;
        }
    }

    cout << endl;
    cout << "=========================================================" << endl;
    cout << "Note: Errors are relative to E0(N=200) as reference" << endl;
    cout << "      N>200 values (300, 500) have numerical issues" << endl;
    cout << "=========================================================" << endl;

    return 0;
}
