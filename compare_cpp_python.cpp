// Direct comparison of C++ vs Python for Maxwell-Boltzmann
// Test with same parameters: 16-QAM, beta = 1/π

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

int main() {
    double beta = 1.0 / M_PI;

    cout << "============================================================\n";
    cout << "C++ vs Python Comparison: 16-QAM with β = 1/π\n";
    cout << "============================================================\n\n";

    cout << fixed << setprecision(15);
    cout << "Beta = 1/π = " << beta << "\n\n";

    // Set up 16-QAM
    setMod(16, "QAM");

    // Apply Maxwell-Boltzmann with beta = 1/π
    setQ("maxwell-boltzmann", beta);
    normalizeX_for_Q();

    cout << "\n============================================================\n";
    cout << "CONSTELLATION POINTS X (16-QAM)\n";
    cout << "============================================================\n\n";

    cout << "C++ Results:\n";
    cout << "---------------------------------------------------------\n";
    for (int i = 0; i < 16; i++) {
        cout << "X[" << setw(2) << i << "] = "
             << showpos << X[i].real() << " " << X[i].imag() << "j" << noshowpos << "\n";
    }

    cout << "\n\nPython Reference (from test_maxwell_fixedpoint.py):\n";
    cout << "---------------------------------------------------------\n";
    cout << "X[ 0] = -1.007987203780295 -1.007987203780295j\n";
    cout << "X[ 1] = -1.007987203780295 -0.335995734593432j\n";
    cout << "X[ 2] = -1.007987203780295 +0.335995734593432j\n";
    cout << "X[ 3] = -1.007987203780295 +1.007987203780295j\n";
    cout << "X[ 4] = -0.335995734593432 -1.007987203780295j\n";
    cout << "X[ 5] = -0.335995734593432 -0.335995734593432j\n";
    cout << "X[ 6] = -0.335995734593432 +0.335995734593432j\n";
    cout << "X[ 7] = -0.335995734593432 +1.007987203780295j\n";
    cout << "X[ 8] = +0.335995734593432 -1.007987203780295j\n";
    cout << "X[ 9] = +0.335995734593432 -0.335995734593432j\n";
    cout << "X[10] = +0.335995734593432 +0.335995734593432j\n";
    cout << "X[11] = +0.335995734593432 +1.007987203780295j\n";
    cout << "X[12] = +1.007987203780295 -1.007987203780295j\n";
    cout << "X[13] = +1.007987203780295 -0.335995734593432j\n";
    cout << "X[14] = +1.007987203780295 +0.335995734593432j\n";
    cout << "X[15] = +1.007987203780295 +1.007987203780295j\n";

    cout << "\n\n============================================================\n";
    cout << "PROBABILITIES Q (16-QAM)\n";
    cout << "============================================================\n\n";

    cout << "C++ Results:\n";
    cout << "---------------------------------------------------------\n";
    for (int i = 0; i < 16; i++) {
        cout << "Q[" << setw(2) << i << "] = " << Q_mat(i) << "\n";
    }

    cout << "\n\nPython Reference:\n";
    cout << "---------------------------------------------------------\n";
    cout << "Q[ 0] = 0.04592897227582352221\n";
    cout << "Q[ 1] = 0.06122625656979036046\n";
    cout << "Q[ 2] = 0.06122625656979036046\n";
    cout << "Q[ 3] = 0.04592897227582352221\n";
    cout << "Q[ 4] = 0.06122625656979036046\n";
    cout << "Q[ 5] = 0.08161851458459577768\n";
    cout << "Q[ 6] = 0.08161851458459577768\n";
    cout << "Q[ 7] = 0.06122625656979036046\n";
    cout << "Q[ 8] = 0.06122625656979036046\n";
    cout << "Q[ 9] = 0.08161851458459577768\n";
    cout << "Q[10] = 0.08161851458459577768\n";
    cout << "Q[11] = 0.06122625656979036046\n";
    cout << "Q[12] = 0.04592897227582352221\n";
    cout << "Q[13] = 0.06122625656979036046\n";
    cout << "Q[14] = 0.06122625656979036046\n";
    cout << "Q[15] = 0.04592897227582352221\n";

    cout << "\n\n============================================================\n";
    cout << "DIFFERENCE ANALYSIS\n";
    cout << "============================================================\n\n";

    // Python values for comparison
    vector<complex<double>> X_python = {
        {-1.007987203780295, -1.007987203780295},
        {-1.007987203780295, -0.335995734593432},
        {-1.007987203780295, +0.335995734593432},
        {-1.007987203780295, +1.007987203780295},
        {-0.335995734593432, -1.007987203780295},
        {-0.335995734593432, -0.335995734593432},
        {-0.335995734593432, +0.335995734593432},
        {-0.335995734593432, +1.007987203780295},
        {+0.335995734593432, -1.007987203780295},
        {+0.335995734593432, -0.335995734593432},
        {+0.335995734593432, +0.335995734593432},
        {+0.335995734593432, +1.007987203780295},
        {+1.007987203780295, -1.007987203780295},
        {+1.007987203780295, -0.335995734593432},
        {+1.007987203780295, +0.335995734593432},
        {+1.007987203780295, +1.007987203780295}
    };

    vector<double> Q_python = {
        0.04592897227582352221,
        0.06122625656979036046,
        0.06122625656979036046,
        0.04592897227582352221,
        0.06122625656979036046,
        0.08161851458459577768,
        0.08161851458459577768,
        0.06122625656979036046,
        0.06122625656979036046,
        0.08161851458459577768,
        0.08161851458459577768,
        0.06122625656979036046,
        0.04592897227582352221,
        0.06122625656979036046,
        0.06122625656979036046,
        0.04592897227582352221
    };

    cout << "Constellation Points Difference |X_cpp - X_python|:\n";
    cout << "---------------------------------------------------------\n";
    double max_X_diff = 0.0;
    for (int i = 0; i < 16; i++) {
        double diff = abs(X[i] - X_python[i]);
        cout << "ΔX[" << setw(2) << i << "] = " << scientific << diff << fixed << "\n";
        max_X_diff = max(max_X_diff, diff);
    }
    cout << "\nMaximum X difference: " << scientific << max_X_diff << fixed << "\n";

    cout << "\n\nProbabilities Difference |Q_cpp - Q_python|:\n";
    cout << "---------------------------------------------------------\n";
    double max_Q_diff = 0.0;
    for (int i = 0; i < 16; i++) {
        double diff = abs(Q_mat(i) - Q_python[i]);
        cout << "ΔQ[" << setw(2) << i << "] = " << scientific << diff << fixed << "\n";
        max_Q_diff = max(max_Q_diff, diff);
    }
    cout << "\nMaximum Q difference: " << scientific << max_Q_diff << fixed << "\n";

    cout << "\n\n============================================================\n";
    cout << "VERIFICATION\n";
    cout << "============================================================\n\n";

    // C++ verification
    double cpp_energy = 0.0;
    double cpp_q_sum = 0.0;
    for (int i = 0; i < 16; i++) {
        double energy = abs(X[i]) * abs(X[i]);
        cpp_energy += Q_mat(i) * energy;
        cpp_q_sum += Q_mat(i);
    }

    cout << "C++ Implementation:\n";
    cout << "  E[|X|²] = " << cpp_energy << " (error: " << scientific << abs(cpp_energy - 1.0) << fixed << ")\n";
    cout << "  Σ Q_i  = " << cpp_q_sum << " (error: " << scientific << abs(cpp_q_sum - 1.0) << fixed << ")\n";

    // Python verification
    double py_energy = 0.0;
    double py_q_sum = 0.0;
    for (int i = 0; i < 16; i++) {
        double energy = abs(X_python[i]) * abs(X_python[i]);
        py_energy += Q_python[i] * energy;
        py_q_sum += Q_python[i];
    }

    cout << "\nPython Reference:\n";
    cout << "  E[|X|²] = " << py_energy << " (error: " << scientific << abs(py_energy - 1.0) << fixed << ")\n";
    cout << "  Σ Q_i  = " << py_q_sum << " (error: " << scientific << abs(py_q_sum - 1.0) << fixed << ")\n";

    cout << "\n\n============================================================\n";
    if (max_X_diff < 1e-8 && max_Q_diff < 1e-8) {
        cout << "✅ EXCELLENT: C++ matches Python within 1e-8!\n";
    } else if (max_X_diff < 1e-6 && max_Q_diff < 1e-6) {
        cout << "✅ GOOD: C++ matches Python within 1e-6!\n";
    } else {
        cout << "⚠️ WARNING: Differences exceed 1e-6\n";
    }
    cout << "============================================================\n";

    return 0;
}
