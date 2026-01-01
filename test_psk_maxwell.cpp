// Test PSK with Maxwell-Boltzmann distribution
// PSK has all points on unit circle, so all energies are equal
// Result: Q should be uniform even with Maxwell-Boltzmann!

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

void test_PSK_detailed(int M, double beta) {
    cout << "\n========================================\n";
    cout << "Testing PSK with M=" << M << ", beta=" << beta << "\n";
    cout << "========================================\n";

    // Set up PSK constellation
    setMod(M, "PSK");

    // Set Maxwell-Boltzmann distribution
    setQ("maxwell-boltzmann", beta);

    // Run fixed-point iteration
    normalizeX_for_Q();

    // Output constellation points
    cout << "\nFinal Constellation Points X (" << M << "-PSK):\n";
    for (int i = 0; i < M; i++) {
        double magnitude = abs(X[i]);
        double phase = arg(X[i]) * 180.0 / M_PI; // Convert to degrees
        cout << "  X[" << setw(2) << i << "] = "
             << showpos << fixed << setprecision(10)
             << X[i].real() << " " << X[i].imag() << "j"
             << noshowpos << "  (r=" << magnitude << ", θ=" << phase << "°)\n";
    }

    // Output probabilities
    cout << "\nProbabilities Q:\n";
    double Q_sum = 0.0;
    double Q_min = 1.0, Q_max = 0.0;
    for (int i = 0; i < M; i++) {
        cout << "  Q[" << i << "] = " << fixed << setprecision(15) << Q_mat(i) << "\n";
        Q_sum += Q_mat(i);
        Q_min = min(Q_min, Q_mat(i));
        Q_max = max(Q_max, Q_mat(i));
    }

    // Verification
    cout << "\n========================================\n";
    cout << "VERIFICATION\n";
    cout << "========================================\n";

    // Check all energies are equal (unit circle)
    cout << "\nEnergies |X|²:\n";
    double energy_sum = 0.0;
    for (int i = 0; i < M; i++) {
        double energy = abs(X[i]) * abs(X[i]);
        cout << "  |X[" << i << "]|² = " << fixed << setprecision(15) << energy << "\n";
        energy_sum += energy;
    }

    // Check average energy
    double avg_energy = 0.0;
    for (int i = 0; i < M; i++) {
        double energy = abs(X[i]) * abs(X[i]);
        avg_energy += Q_mat(i) * energy;
    }

    cout << "\nAverage energy E[|X|²] = " << fixed << setprecision(15) << avg_energy << "\n";
    cout << "Error from 1.0: " << scientific << abs(avg_energy - 1.0) << "\n";

    cout << "\nSum of probabilities: " << fixed << setprecision(15) << Q_sum << "\n";
    cout << "Error from 1.0: " << scientific << abs(Q_sum - 1.0) << "\n";

    cout << "\nProbability uniformity:\n";
    cout << "  Q_min = " << fixed << setprecision(15) << Q_min << "\n";
    cout << "  Q_max = " << fixed << setprecision(15) << Q_max << "\n";
    cout << "  Range = " << scientific << (Q_max - Q_min) << "\n";
    cout << "  Expected (uniform) = " << fixed << setprecision(15) << (1.0 / M) << "\n";

    // For PSK, all energies are equal, so Q should be uniform!
    cout << "\n** PSK Insight: All constellation points have equal energy (unit circle) **\n";
    cout << "** Therefore, Q ∝ exp(-β|X|²) = constant → uniform distribution **\n";
}

int main() {
    double beta_1_over_pi = 1.0 / M_PI;

    cout << fixed << setprecision(15);
    cout << "Beta = 1/π = " << beta_1_over_pi << "\n";

    // Test PSK with different M values
    test_PSK_detailed(8, beta_1_over_pi);
    test_PSK_detailed(16, beta_1_over_pi);

    return 0;
}
