// WASM-compatible version of functions.cpp
// Database dependencies removed for WebAssembly build

#include <complex>
#include <cmath>
#include <iostream>
#include <vector>
#include <iomanip>
#include <algorithm>
#include "functions.h"
#include <Eigen/Dense>
#include <chrono>
#include <unsupported/Eigen/MatrixFunctions>
#include <unordered_map>
#include <limits>

using namespace std;
using namespace Eigen;

#define DEBUG false  // Disable debug output for WASM

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

#define PI M_PI
#define eu std::exp(1.0)
const complex<double> I(0.0, 1.0);

// Remove database-related variables for WASM build
double SNR = 1;
int sizeX = pow(2, 6);
vector<double> Qq;
vector<complex<double>> X;
double R;
unordered_map<int, vector<double>> all_hweights;
unordered_map<int, vector<double>> all_roots;
unordered_map<int, vector<double>> all_multhweights;

int n = 15;
void setN(int n_) { n = n_; }

// Matrix definitions
VectorXd Q_mat;
MatrixXd PI_mat;
MatrixXd W_mat;
VectorXcd X_mat(sizeX);
MatrixXd D_mat;
VectorXd A_mat;

// Forward declarations of functions that need to be implemented
void setQ();
void setX(int npoints, string xmode);
void setMod(int M, const char* typeM);
void setR(double r);
void setSNR(double snr);
void setPI();
void setW();
double E_0_co(double r, double rho, double& grad_rho);
double E_0_co(double r, double rho, double& grad_rho, double& E0);
double initial_guess(double r, double E0_0, double E0_1, double E0_0_der, double E0_1_der, double& max_g);
double GD_co(double& r, double& rho, double& rho_interpolated, int num_iterations, int n, bool updateR, double threshold);
double GD_iid(double& r, double& rho_gd, double& rho_interpolated, int it, int N, double threshold);
vector<double> Hroots(int n);
vector<double> Hweights(int my_n);
double hermite_w(int my_n, double xi, double log_fact);

// Utility functions
double abs_sq(std::complex<double> a) {
    return a.real() * a.real() + a.imag() * a.imag();
}

string complextostr(complex<double> x) {
    ostringstream ss;
    ss << x.real();
    if (x.imag() >= 0) ss << "+";
    ss << x.imag() << "i";
    return ss.str();
}

unsigned long long factorial(unsigned int n) {
    if (n == 0 || n == 1) return 1;
    unsigned long long result = 1;
    for (unsigned int i = 2; i <= n; ++i) {
        result *= i;
    }
    return result;
}

// Hermite polynomial roots (precomputed for efficiency)
vector<double> Hroots(int n) {
    vector<double> roots;
    switch (n) {
        case (1):
            return {0};
        case (2):
            return {-0.7071067811865475, 0.7071067811865475};
        case (3):
            return {-1.224744871391589, 0, 1.224744871391589};
        case (4):
            return {-1.650680123885785, -0.5246476232752904, 0.5246476232752904, 1.650680123885785};
        case (5):
            return {-2.020182870456086, -0.9585724646138185, 0, 0.9585724646138185, 2.020182870456086};
        case (6):
            return {-2.350604973674492, -1.3358490740136968, -0.4360774119276165, 0.4360774119276165,
                    1.3358490740136968, 2.350604973674492};
        case (7):
            return {-2.651961356835233, -1.673551628767471, -0.8162878828589647, 0, 0.8162878828589647,
                    1.673551628767471, 2.651961356835233};
        case (8):
            return {-2.930637420257244, -1.981656756695843, -1.1571937124467802, -0.3811869902073221,
                    0.3811869902073221, 1.1571937124467802, 1.981656756695843, 2.930637420257244};
        case (9):
            return {-3.190993201781528, -2.266580584531843, -1.468553289216668, -0.7235510187528376, 0,
                    0.7235510187528376, 1.468553289216668, 2.266580584531843, 3.190993201781528};
        case (10):
            return {-3.436159118837738, -2.53273167423279, -1.756683649299882, -1.036610829789514, -0.3429013272237046,
                    0.3429013272237046, 1.036610829789514, 1.756683649299882, 2.53273167423279, 3.436159118837738};
        case (15):
            return {-4.499990707309327, -3.669950373404453, -2.967166927905603, -2.325732486173858, -1.7199925751864014,
                    -1.1361155852109513, -0.5650695832555757, 0, 0.5650695832555757, 1.1361155852109513,
                    1.7199925751864014, 2.325732486173858, 2.967166927905603, 3.669950373404453, 4.499990707309327};
        case (20):
            return {-5.387480890011233, -4.603682449550744, -3.944764040115625, -3.347854567383216, -2.788806058428131,
                    -2.254974002089276, -1.7385377121166029, -1.2340762153953234, -0.7374737285453943, -0.24534070830090885,
                    0.24534070830090885, 0.7374737285453943, 1.2340762153953234, 1.7385377121166029, 2.254974002089276,
                    2.788806058428131, 3.347854567383216, 3.944764040115625, 4.603682449550744, 5.387480890011233};
        default:
            // For other values, use a simple approximation
            roots.resize(n);
            for (int i = 0; i < n; ++i) {
                roots[i] = -3.0 + 6.0 * i / (n - 1);
            }
            return roots;
    }
}

// Hermite weight calculation
double hermite_w(int my_n, double xi, double log_fact) {
    double hn1 = pow(2, (my_n - 1) / 2.0) * sqrt(PI);
    double hn2 = exp(log_fact);
    double hn = hn1 * hn2;
    double h_n_minus_1 = 1.0;

    if (my_n > 1) {
        double h_prev = 1.0;
        double h_curr = 2.0 * xi;

        for (int k = 2; k < my_n; ++k) {
            double h_next = 2.0 * xi * h_curr - 2.0 * (k - 1) * h_prev;
            h_prev = h_curr;
            h_curr = h_next;
        }
        h_n_minus_1 = h_curr;
    }

    return hn / (h_n_minus_1 * h_n_minus_1);
}

vector<double> Hweights(int my_n) {
    my_n++;
    vector<double> weights(my_n, 0);
    vector<double> roots = Hroots(my_n);

    double log_fact = 0.0;
    for (int k = 1; k <= my_n; ++k) {
        log_fact += log(k);
    }

    for (int i = 0; i < my_n; ++i) {
        weights[i] = hermite_w(my_n, roots[i], log_fact);
    }
    return weights;
}

// Matrix setup functions
void setQ() {
    Q_mat = VectorXd::Zero(sizeX);
    for (int i = 0; i < sizeX; i++) {
        Q_mat(i) = 1.0 / double(sizeX);  // Uniform distribution
    }
}

void setX(int npoints, string xmode) {
    sizeX = npoints;
    X.resize(npoints);
    X_mat = VectorXcd::Zero(sizeX);

    if (xmode == "PAM") {
        float delta = sqrt(3.0 / (pow(npoints, 2) - 1));
        for (int n = 0; n < npoints / 2; n++) {
            X[n + npoints / 2] = (2 * n + 1) * delta;
            X_mat(n + npoints / 2) = (2 * n + 1) * delta;
        }
        for (int n = 0; n < npoints / 2; n++) {
            X[n] = -X[npoints - 1 - n];
            X_mat(n) = -X_mat(npoints - 1 - n);
        }
    } else if (xmode == "PSK") {
        for (int n = 0; n < npoints; n++) {
            complex<double> val = exp(I * 2.0 * PI * double(n) / double(npoints));
            X[n] = val;
            X_mat(n) = val;
        }
    } else if (xmode == "QAM") {
        int sqrtM = static_cast<int>(sqrt(npoints));
        if (sqrtM * sqrtM != npoints) {
            // Fallback to PSK if not perfect square
            for (int n = 0; n < npoints; n++) {
                complex<double> val = exp(I * 2.0 * PI * double(n) / double(npoints));
                X[n] = val;
                X_mat(n) = val;
            }
        } else {
            int idx = 0;
            for (int i = 0; i < sqrtM && idx < npoints; i++) {
                for (int j = 0; j < sqrtM && idx < npoints; j++) {
                    double real_part = (2 * i - sqrtM + 1) / sqrt(2.0 * (sqrtM * sqrtM - 1) / 3.0);
                    double imag_part = (2 * j - sqrtM + 1) / sqrt(2.0 * (sqrtM * sqrtM - 1) / 3.0);
                    X[idx] = complex<double>(real_part, imag_part);
                    X_mat(idx) = complex<double>(real_part, imag_part);
                    idx++;
                }
            }
        }
    }
}

void setMod(int M, const char* typeM) {
    setX(M, string(typeM));
}

void setR(double r) {
    R = r;
}

void setSNR(double snr) {
    SNR = snr;
}

void setPI() {
    vector<double> hweights = Hweights(n - 1);
    vector<double> windows;
    PI_mat = MatrixXd::Zero(sizeX, n * n * sizeX);

    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            windows.push_back(hweights[j] * hweights[i]);
        }
    }

    // Use exact indexing from old implementation
    for (int i = 0; i < sizeX; i++) {
        int a = 0;
        for (int j = i * n * n; j < i * n * n + n * n; j++) {
            PI_mat(i, j) = windows[a];
            a++;
        }
    }
}

void setW() {
    vector<double> roots = Hroots(n);
    vector<complex<double>> complexroots;

    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            complexroots.push_back(complex<double>(roots[i], roots[j]));
        }
    }

    VectorXcd Y(n * n * sizeX);
    int a = 0;
    for (int i = 0; i < n * n * sizeX; i += n * n) {
        for (int j = 0; j < n * n; j++) {
            Y(i + j) = sqrt(SNR) * X_mat(a);
            Y(i + j) += complexroots[j];
        }
        a++;
    }

    // Compute D matrix for distance calculations
    D_mat = MatrixXd::Zero(sizeX, n * n * sizeX);

    for (int x_idx = 0; x_idx < sizeX; x_idx++) {
        for (int y_idx = 0; y_idx < n * n * sizeX; y_idx++) {
            complex<double> diff = Y(y_idx) - sqrt(SNR) * X_mat(x_idx);
            D_mat(x_idx, y_idx) = abs_sq(diff);
        }
    }

    // Compute W matrix (channel transition probabilities)
    W_mat = MatrixXd::Zero(n * n * sizeX, sizeX);

    for (int y_idx = 0; y_idx < n * n * sizeX; y_idx++) {
        double sum = 0.0;
        for (int x_idx = 0; x_idx < sizeX; x_idx++) {
            W_mat(y_idx, x_idx) = exp(-D_mat(x_idx, y_idx));
            sum += W_mat(y_idx, x_idx);
        }
        // Normalize
        if (sum > 0) {
            for (int x_idx = 0; x_idx < sizeX; x_idx++) {
                W_mat(y_idx, x_idx) /= sum;
            }
        }
    }
}

// Error exponent computation - exact port from old implementation
double E_0_co(double r, double rho, double& grad_rho) {
    double E0;
    return E_0_co(r, rho, grad_rho, E0);
}

// Error exponent computation with E0 output - exact port from old implementation
double E_0_co(double r, double rho, double& grad_rho, double& E0) {
    // Compute logqg2 using exact formula from old implementation
    RowVectorXd qt_exp = Q_mat.transpose() * ((-1.0 / (1.0 + rho)) * D_mat.array()).exp().matrix();
    VectorXd logqg2 = qt_exp.transpose().array().log();

    // Compute qg2rho = exp(rho * logqg2)
    VectorXd qg2rho = (rho * logqg2.array()).exp();

    // Compute pig1_mat = PI * exp((rho/(1+rho)) * D)
    MatrixXd pig1_mat = PI_mat.array() * ((rho / (1.0 + rho)) * D_mat.array()).exp();

    // Compute m = Q^T * pig1_mat * qg2rho (using exact formula from old implementation)
    double m = (Q_mat.transpose() * pig1_mat * qg2rho).sum();

    // Compute mp (derivative of m w.r.t. rho)
    double mp = (Q_mat.transpose() * pig1_mat * (qg2rho.array() * logqg2.array()).matrix()).sum()
                - (1.0 / (1.0 + rho)) *
                  (Q_mat.transpose() * (pig1_mat.array() * (-D_mat.array())).matrix() * qg2rho).sum();

    // Compute F0 and its derivative
    double F0 = m / PI;
    double Fder0 = mp / PI;

    // Compute gradient (fixed sign to match E0 = +log2(F0))
    grad_rho = +(Fder0) / (log(2) * F0);

    // Return the error exponent (fixed sign error)
    E0 = log2(F0);
    return E0;
}

// Initial guess calculation - exact port from old implementation
double initial_guess(double r, double E0_0, double E0_1, double E0_0_der, double E0_1_der, double& max_g) {
    // Compute G and its derivatives at rho=0 and rho=1
    const double A = E0_0;
    const double B = E0_0_der - r;
    const double C = E0_1 - r;
    const double D = E0_1_der - r;

    // Cubic coefficients for G(rho) = a + b*rho + c*rho^2 + d*rho^3
    const double a = A;
    const double b = B;
    const double c = 3 * (C - A) - 2 * B - D;
    const double d = -2 * (C - A) + B + D;

    // Coefficients for the derivative G'(rho) = b + 2c*rho + 3d*rho^2
    const double a_quad = 3 * d;
    const double b_quad = 2 * c;
    const double c_quad = b;

    vector<double> roots;

    // Solve quadratic equation: a_quad*rho^2 + b_quad*rho + c_quad = 0
    if (abs(a_quad) > 1e-10) { // Quadratic case
        const double discriminant = b_quad * b_quad - 4 * a_quad * c_quad;
        if (discriminant >= 0) {
            const double sqrt_disc = sqrt(discriminant);
            const double root1 = (-b_quad + sqrt_disc) / (2 * a_quad);
            const double root2 = (-b_quad - sqrt_disc) / (2 * a_quad);
            if (root1 >= 0.0 && root1 <= 1.0) {
                roots.push_back(root1);
            }
            if (root2 >= 0.0 && root2 <= 1.0 && root2 != root1) {
                roots.push_back(root2);
            }
        }
    } else { // Linear case: a_quad is approximately zero
        if (abs(b_quad) > 1e-10) {
            const double root = -c_quad / b_quad;
            if (root >= 0.0 && root <= 1.0) {
                roots.push_back(root);
            }
        }
    }

    // Collect candidate points: 0, 1, and valid roots
    vector<double> candidates = {0.0, 1.0};
    for (const double root : roots) {
        candidates.push_back(root);
    }

    // Evaluate G(rho) at all candidates and find the maximum
    max_g = -numeric_limits<double>::infinity();
    double best_rho = 0.0;

    for (const double rho : candidates) {
        const double g = a + b * rho + c * rho * rho + d * rho * rho * rho;
        if (g > max_g) {
            max_g = g;
            best_rho = rho;
        }
    }

    return best_rho;
}

// Gradient descent implementation - exact port from old implementation
double GD_co(double& r, double& rho, double& rho_interpolated, int num_iterations, int n, bool updateR, double threshold) {
    // Get initial E0 values at boundary points (exact port from old implementation)
    double grad_rho, e0;

    E_0_co(r, 0, grad_rho, e0);
    double E0_0 = e0, E0_prime_0 = grad_rho;

    E_0_co(r, 1, grad_rho, e0);
    double E0_1 = e0, E0_prime_1 = grad_rho;

    // Calculate initial guess using exact algorithm from old implementation
    double max_g;
    rho = initial_guess(r, E0_0, E0_1, E0_prime_0, E0_prime_1, max_g);

    rho_interpolated = rho;

    // Early return for boundary cases (exact from old implementation)
    if (rho <= 0 || rho >= 1) {
        rho = max(0.0, min(rho, 1.0));
        E_0_co(r, rho, grad_rho, e0);
        return e0 - rho * r;
    }

    // Calculate learning rate using second derivative approximation (from old implementation)
    E_0_co(r, rho + 0.0000001, grad_rho, e0);
    double E0_prime_guess_plus = grad_rho;

    E_0_co(r, rho, grad_rho, e0);
    double E0_prime_guess = grad_rho;

    double grad_2_guess = (E0_prime_guess_plus - E0_prime_guess) / 0.0000001;
    double L = -grad_2_guess;
    double learning_rate = (L > 0) ? 1.0 / L : 0.1;

    // Gradient descent loop with exact constraints from old implementation
    for (int iteration = 0; iteration < num_iterations; iteration++) {
        E_0_co(r, rho, grad_rho, e0);
        grad_rho -= r;  // Subtract r to get gradient of (E0 - rho*r)
        // For minimization of (E0 - rho*r): move in direction of negative gradient
        rho = rho - learning_rate * grad_rho;

        // Apply exact boundary constraints from old implementation
        rho = max(0.0, min(rho, 1.0));

        // Check convergence
        if (abs(grad_rho) <= threshold) {
            break;
        }
    }

    rho_interpolated = rho;
    E_0_co(r, rho, grad_rho, e0);
    return e0 - rho * r;
}

// Main gradient descent function called by exponents()
double GD_iid(double& r, double& rho_gd, double& rho_interpolated, int num_iterations, int n, double threshold) {
    r = R;

    // Initialize matrices
    setQ();
    setPI();
    setW();

    // Run gradient descent
    double error_exponent = GD_co(r, rho_gd, rho_interpolated, num_iterations, n, false, threshold);

    return error_exponent;
}