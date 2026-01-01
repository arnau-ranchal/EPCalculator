// Simple test of C++ Maxwell-Boltzmann implementation
// Outputs constellation points and probabilities for comparison with Python

#include <iostream>
#include <iomanip>
#include <cmath>
#include <complex>
#include <vector>
#include <Eigen/Dense>

using namespace std;
using namespace Eigen;

// External variables from functions.cpp
extern vector<complex<double>> X;
extern int sizeX;
extern VectorXd Q_mat;

// Functions from functions.h
void setMod(int mod, string xmode);
void setQ(string distribution, double shaping_param);
void normalizeX_for_Q();

void test_QAM_detailed(int M, double beta) {
    cout << "\n========================================\n";
    cout << "Testing QAM with M=" << M << ", beta=" << beta << "\n";
    cout << "========================================\n";

    // Set up QAM constellation
    setMod(M, "QAM");

    // Set Maxwell-Boltzmann distribution
    setQ("maxwell-boltzmann", beta);

    // Run fixed-point iteration
    normalizeX_for_Q();

    // Output constellation points
    cout << "\nFinal Constellation Points X (" << M << "-QAM):\n";
    for (int i = 0; i < sizeX && i < M; i++) {
        cout << "  X[" << setw(2) << i << "] = "
             << showpos << fixed << setprecision(15)
             << X[i].real() << " " << X[i].imag() << "j\n" << noshowpos;
    }

    // Output probabilities
    cout << "\nProbabilities Q:\n";
    double Q_sum = 0.0;
    for (int i = 0; i < sizeX && i < M; i++) {
        cout << "  Q[" << i << "] = " << fixed << setprecision(20) << Q_mat(i) << "\n";
        Q_sum += Q_mat(i);
    }

    // Verification
    cout << "\n========================================\n";
    cout << "VERIFICATION\n";
    cout << "========================================\n";

    // Check average energy
    double avg_energy = 0.0;
    for (int i = 0; i < sizeX && i < M; i++) {
        double energy = abs(X[i]) * abs(X[i]);
        avg_energy += Q_mat(i) * energy;
    }

    cout << "\nAverage energy E[|X|²] = " << fixed << setprecision(20) << avg_energy << "\n";
    cout << "Error from 1.0: " << scientific << abs(avg_energy - 1.0) << "\n";

    cout << "\nSum of probabilities: " << fixed << setprecision(20) << Q_sum << "\n";
    cout << "Error from 1.0: " << scientific << abs(Q_sum - 1.0) << "\n";

    // Check Q ∝ exp(-beta*|X|²) by comparing ratios
    cout << "\nVerify Q ∝ exp(-β|X|²) (sample of 5 pairs):\n";
    int pairs[][2] = {{0, 5}, {1, 6}, {5, 10}, {0, 10}, {0, 15}};
    for (int k = 0; k < 5; k++) {
        int i = pairs[k][0];
        int j = pairs[k][1];
        if (i < sizeX && j < sizeX && i < M && j < M) {
            double ratio_Q = Q_mat(j) / Q_mat(i);
            double energy_i = abs(X[i]) * abs(X[i]);
            double energy_j = abs(X[j]) * abs(X[j]);
            double ratio_expected = exp(-beta * (energy_j - energy_i));
            double error = abs(ratio_Q - ratio_expected);
            cout << "  Q[" << setw(2) << j << "]/Q[" << setw(2) << i << "] = "
                 << fixed << setprecision(12) << ratio_Q
                 << ", exp(-β(|X[" << j << "]|² - |X[" << i << "]|²)) = "
                 << ratio_expected
                 << ", error = " << scientific << error << "\n";
        }
    }
}

int main() {
    double beta_1_over_pi = 1.0 / M_PI;

    cout << fixed << setprecision(20);
    cout << "Beta = 1/π = " << beta_1_over_pi << "\n";

    // Test QAM (compare with Python output)
    test_QAM_detailed(16, beta_1_over_pi);

    return 0;
}
