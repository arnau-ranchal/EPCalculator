// Test C++ Maxwell-Boltzmann implementation
// Compare with Python results for PAM and QAM

#include <iostream>
#include <iomanip>
#include <cmath>
#include "exponents/functions.h"

using namespace std;

void test_PAM(int M, double beta) {
    cout << "\n========================================\n";
    cout << "Testing PAM with M=" << M << ", beta=" << beta << "\n";
    cout << "========================================\n";

    // Set up PAM constellation
    setMod(M, "PAM");

    // Set Maxwell-Boltzmann distribution
    setQ("maxwell-boltzmann", beta);

    // Run fixed-point iteration
    normalizeX_for_Q();

    cout << "\nDone!\n";
}

void test_QAM(int M, double beta) {
    cout << "\n========================================\n";
    cout << "Testing QAM with M=" << M << ", beta=" << beta << "\n";
    cout << "========================================\n";

    // Set up QAM constellation
    setMod(M, "QAM");

    // Set Maxwell-Boltzmann distribution
    setQ("maxwell-boltzmann", beta);

    // Run fixed-point iteration
    normalizeX_for_Q();

    cout << "\nDone!\n";
}

void test_PSK(int M, double beta) {
    cout << "\n========================================\n";
    cout << "Testing PSK with M=" << M << ", beta=" << beta << "\n";
    cout << "========================================\n";

    // Set up PSK constellation
    setMod(M, "PSK");

    // Set Maxwell-Boltzmann distribution
    setQ("maxwell-boltzmann", beta);

    // Run fixed-point iteration
    normalizeX_for_Q();

    cout << "\nDone!\n";
}

int main() {
    double beta_1_over_pi = 1.0 / M_PI;

    cout << fixed << setprecision(15);
    cout << "Beta = 1/π = " << beta_1_over_pi << "\n";

    // Test PAM (should converge in ~30 iterations like Python)
    test_PAM(4, beta_1_over_pi);

    // Test QAM (should converge in ~16 iterations like Python)
    test_QAM(16, beta_1_over_pi);

    // Test PSK
    test_PSK(8, beta_1_over_pi);

    return 0;
}
