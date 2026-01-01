// Test the convergence fix for various beta values
// Including extreme cases that previously failed

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

void test_beta(double beta, const string& description) {
    cout << "\n" << string(70, '=') << "\n";
    cout << "TEST: " << description << "\n";
    cout << "Beta = " << fixed << setprecision(10) << beta << "\n";
    cout << string(70, '=') << "\n\n";

    // Set up 16-QAM
    setMod(16, "QAM");

    // Apply Maxwell-Boltzmann
    setQ("maxwell-boltzmann", beta);
    normalizeX_for_Q();

    // Verify results
    double energy = 0.0;
    double q_sum = 0.0;
    for (int i = 0; i < sizeX && i < 16; i++) {
        double e = abs(X[i]) * abs(X[i]);
        energy += Q_mat(i) * e;
        q_sum += Q_mat(i);
    }

    cout << "\nVerification:\n";
    cout << "  E[|X|²] = " << setprecision(15) << energy
         << " (error: " << scientific << abs(energy - 1.0) << fixed << ")\n";
    cout << "  Σ Q_i  = " << setprecision(15) << q_sum
         << " (error: " << scientific << abs(q_sum - 1.0) << fixed << ")\n";

    // Show probability distribution
    cout << "\nProbability Distribution:\n";
    double min_q = 1.0, max_q = 0.0;
    for (int i = 0; i < 16; i++) {
        min_q = min(min_q, Q_mat(i));
        max_q = max(max_q, Q_mat(i));
    }
    cout << "  Q_min = " << setprecision(10) << min_q << "\n";
    cout << "  Q_max = " << setprecision(10) << max_q << "\n";
    cout << "  Ratio (max/min) = " << (max_q / min_q) << "\n";

    // Status
    if (abs(energy - 1.0) < 1e-10 && abs(q_sum - 1.0) < 1e-10) {
        cout << "\n✅ TEST PASSED: Perfect normalization!\n";
    } else {
        cout << "\n❌ TEST FAILED: Normalization error!\n";
    }
}

int main() {
    cout << "\n" << string(70, '=') << "\n";
    cout << "CONVERGENCE FIX VALIDATION\n";
    cout << "Testing multiple beta values for robust convergence\n";
    cout << string(70, '=') << "\n";

    // Test 1: Small beta (easy case)
    test_beta(0.1, "Small Beta (β=0.1) - Easy convergence");

    // Test 2: Normal beta (1/π, our standard test case)
    test_beta(1.0 / M_PI, "Normal Beta (β=1/π≈0.318) - Standard case");

    // Test 3: Medium beta
    test_beta(0.5, "Medium Beta (β=0.5) - Moderate case");

    // Test 4: Beta = 1 (previously caused warning)
    test_beta(1.0, "High Beta (β=1.0) - Previously failed!");

    // Test 5: Very high beta (extreme case)
    test_beta(2.0, "Very High Beta (β=2.0) - Extreme case");

    // Test 6: Ultra high beta (most extreme)
    test_beta(5.0, "Ultra High Beta (β=5.0) - Most extreme case");

    cout << "\n" << string(70, '=') << "\n";
    cout << "ALL TESTS COMPLETED\n";
    cout << string(70, '=') << "\n\n";

    return 0;
}
