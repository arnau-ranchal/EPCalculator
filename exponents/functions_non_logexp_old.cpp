//
// Created by TESTER on 03/11/2023.
// Cleaned version - only functions called from exponents.cpp
//

#ifndef TFG_FUNCTIONS_H
#define TFG_FUNCTIONS_H

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
#include "hermite.h"

using namespace std;
using namespace Eigen;

#define DEBUG true

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

#define PI M_PI
#define eu std::exp(1.0)
const complex<double> I(0.0, 1.0);
#define vms vector<chrono::microseconds>

bool is_db_connected = false;

bool get_db_connect_status(){
    return is_db_connected;
}

const std::string tableName = "SimulationResults";

// Global variables
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

double low = n;

// Timing vectors
vms e0_times;
vms NAG_cc_times;
vms NAG_iid_times;
vms NAG_times;
vms GD_cc_times;
vms NAG_co_times;
vms GD_iid_times;
vms GD_co_times;
vms GD_ccomp_times;
vms gradient_e0_co_times;
vms fa_times;
vms gradient_f_times;
vms gradient_f_co_times;
vms fa_co_times;
vms e02_times;
vms E_0_co_times;
vms gradient_e0_times;
vms compute_hweights_times;
vms mult_newhweights_times;

unordered_map<string, vector<chrono::microseconds>> get_times() {
    return
            {{"e0_times",               e0_times},
             {"NAG_iid_times",          NAG_iid_times},
             {"NAG_times",              NAG_times},
             {"GD_cc_times",            GD_cc_times},
             {"NAG_co_times",           NAG_co_times},
             {"GD_iid_times",           GD_iid_times},
             {"GD_co_times",            GD_co_times},
             {"GD_ccomp_times",         GD_ccomp_times},
             {"gradient_e0_co_times",   gradient_e0_co_times},
             {"fa_times",               fa_times},
             {"gradient_f_times",       gradient_f_times},
             {"gradient_f_co_times",    gradient_f_co_times},
             {"fa_co_times",            fa_co_times},
             {"e02_times",              e02_times},
             {"E_0_co_times",           E_0_co_times},
             {"gradient_e0_times",      gradient_e0_times},
             {"compute_hweights_times", compute_hweights_times},
             {"mult_newhweights_times", mult_newhweights_times}};
}

double abs_sq(std::complex<double> a) { return pow(real(a), 2) + pow(imag(a), 2); }

vector<double> getAllHweights() {
    return all_hweights[n];
}

vector<double> getAllRoots() {
    return all_roots[n];
}

vector<double> getAllMultHweights() {
    return all_multhweights[n];
}

unsigned long long factorial(unsigned int n) {
    if (n == 0)
        return 1;
    return n * factorial(n - 1);
}

void setQ() {
    Q_mat = VectorXd::Zero(sizeX);
    for (int i = 0; i < sizeX; i++) {
        Q_mat(i) = 1.0 / double(sizeX);
    }
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

    D_mat = MatrixXd::Zero(sizeX, n * n * sizeX);
    for (int i = 0; i < sizeX; i++) {
        for (int j = 0; j < n * n * sizeX; j++) {
            D_mat(i, j) = abs_sq(Y(j) - sqrt(SNR) * X_mat(i));
        }
    }
}

void setX(int npoints, string xmode) {
    sizeX = npoints;
    X.resize(npoints);
    X_mat = VectorXcd::Zero(sizeX);

    if (xmode == "PAM") {
        float delta = sqrt(3 / (pow(npoints, 2) - 1));
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
            X[n] = (cos(2.0 * PI * double(n) / npoints) + I * sin(2.0 * PI * double(n) / npoints));
            X_mat(n) = (cos(2.0 * PI * double(n) / npoints) + I * sin(2.0 * PI * double(n) / npoints));
        }
    } else if (xmode == "QAM") {
        int L = static_cast<int>(sqrt(npoints));
        if (L * L != npoints) {
            cout << "Warning: QAM requires M to be a perfect square. Defaulting to PAM." << endl;
            setX(npoints, "PAM");
            return;
        }
        float delta = sqrt(3.0 / (2.0 * (L * L - 1)));
        int idx = 0;
        for (int i = 0; i < L; i++) {
            for (int j = 0; j < L; j++) {
                double I_comp = (2 * i - L + 1) * delta;
                double Q_comp = (2 * j - L + 1) * delta;
                X[idx] = I_comp + I * Q_comp;
                X_mat(idx) = I_comp + I * Q_comp;
                idx++;
            }
        }
    }
}

void setA(vector<int> alphas) {
    A_mat = VectorXd::Zero(alphas.size());
    for (int i = 0; i < alphas.size(); i++) {
        A_mat(i) = alphas[i];
    }
}

void setR(double r) {
    R = r;
}

void setSNR(double snr) {
    SNR = snr;
}

void setMod(int mod, string xmode) {
    setX(mod, xmode);
}

std::chrono::microseconds sum_(vector<std::chrono::microseconds> vector1) {
    std::chrono::microseconds s = (std::chrono::microseconds) 0;
    for (auto x: vector1) {
        s += x;
    }
    return s;
}

string complextostr(complex<double> x) {
    return to_string(real(x)) + "+I*" + to_string(imag(x));
}

void initQ() {
    double r, mysum = 0;
    for (int n = 0; n < sizeX; n++) {
        r = rand();
        Qq.push_back(r);
        mysum += r;
    }
    for (int n = 0; n < sizeX; n++) {
        Qq[n] /= mysum;
    }
}

double Q(complex<double> x) {
    double sum = 0;
    int closest_index = 0;
    double min_distance = std::numeric_limits<double>::max();

    for (int i = 0; i < sizeX; i++) {
        double distance = abs(X[i] - x);
        if (distance < min_distance) {
            min_distance = distance;
            closest_index = i;
        }
    }
    return Qq[closest_index];
}

// Log-sum-exp trick for numerical stability
inline double log_sum_exp(const Eigen::VectorXd& log_values) {
    double max_val = log_values.maxCoeff();
    if (!std::isfinite(max_val)) {
        return max_val;
    }
    double sum_exp = (log_values.array() - max_val).exp().sum();
    return max_val + std::log(sum_exp);
}

// Fully log-space E_0_co implementation
double E_0_co(double r, double rho, double &grad_rho, double &E0) {
    const int sizeX = Q_mat.size();
    const int cols = D_mat.cols();
    const double s = 1.0 / (1.0 + rho);
    const double rho_factor = rho / (1.0 + rho);

    // STEP 1: Compute logqg2 using log-sum-exp
    Eigen::VectorXd logqg2(cols);
    for (int j = 0; j < cols; j++) {
        Eigen::VectorXd log_terms = Q_mat.array().log() + s * D_mat.col(j).array();
        logqg2(j) = log_sum_exp(log_terms);
    }

    // STEP 2: Compute log_pig1_mat in log-space
    Eigen::MatrixXd log_pig1_mat = PI_mat.array().log() + rho_factor * D_mat.array();

    // STEP 3: Compute m = sum_j [ (sum_i Q_i * pig1[i,j]) * qg2rho[j] ]
    Eigen::VectorXd log_m_components(cols);
    for (int j = 0; j < cols; j++) {
        Eigen::VectorXd inner_log_terms = Q_mat.array().log() + log_pig1_mat.col(j).array();
        double log_inner_sum = log_sum_exp(inner_log_terms);
        log_m_components(j) = log_inner_sum + rho * logqg2(j);
    }
    double log_m = log_sum_exp(log_m_components);

    // STEP 4: Compute gradient term mp
    std::vector<double> mp_positive_terms;
    std::vector<double> mp_negative_terms;

    for (int j = 0; j < cols; j++) {
        Eigen::VectorXd inner_log_terms = Q_mat.array().log() + log_pig1_mat.col(j).array();
        double log_inner_sum = log_sum_exp(inner_log_terms);
        double log_base = log_inner_sum + rho * logqg2(j);

        // Term 1: multiply by logqg2[j]
        if (logqg2(j) != 0) {
            double log_term1 = log_base + std::log(std::abs(logqg2(j)));
            if (logqg2(j) > 0) {
                mp_positive_terms.push_back(log_term1);
            } else {
                mp_negative_terms.push_back(log_term1);
            }
        }

        // Term 2: -s * sum_i Q_i * pig1[i,j] * D[i,j] * qg2rho[j]
        Eigen::VectorXd inner_log_terms_d = Q_mat.array().log() + log_pig1_mat.col(j).array()
                                           + D_mat.col(j).array().log();
        double log_inner_sum_d = log_sum_exp(inner_log_terms_d);
        double log_term2 = std::log(s) + log_inner_sum_d + rho * logqg2(j);
        mp_negative_terms.push_back(log_term2);
    }

    // Compute mp by combining positive and negative contributions
    double max_pos = mp_positive_terms.empty() ? -std::numeric_limits<double>::infinity()
                     : *std::max_element(mp_positive_terms.begin(), mp_positive_terms.end());
    double max_neg = mp_negative_terms.empty() ? -std::numeric_limits<double>::infinity()
                     : *std::max_element(mp_negative_terms.begin(), mp_negative_terms.end());
    double max_term = std::max(max_pos, max_neg);

    // Check if we can safely compute in regular space
    if (max_term < 690 && log_m < 690) {
        // Safe to exponentiate
        double m = std::exp(log_m);

        double mp_pos = 0.0;
        for (double log_val : mp_positive_terms) {
            mp_pos += std::exp(log_val);
        }

        double mp_neg = 0.0;
        for (double log_val : mp_negative_terms) {
            mp_neg += std::exp(log_val);
        }

        double mp = mp_pos - mp_neg;

        // Compute F0 and derivatives
        double F0 = m / PI;
        double Fder0 = mp / PI;

        if (!std::isfinite(F0) || F0 <= 0) {
            std::cerr << "ERROR: Invalid F0=" << F0 << " (SNR=" << SNR << ", rho=" << rho << ")\n";
            E0 = -1.0;
            grad_rho = 0.0;
            return -1.0;
        }

        grad_rho = -(Fder0) / (std::log(2) * F0);
        E0 = -std::log2(F0);

        if (!std::isfinite(E0) || !std::isfinite(grad_rho)) {
            std::cerr << "ERROR: Non-finite result: E0=" << E0 << ", grad_rho=" << grad_rho << "\n";
            E0 = -1.0;
            grad_rho = 0.0;
            return -1.0;
        }

        return E0;

    } else {
        // Extreme SNR case - compute E0 in pure log-space
        double log2_m = log_m / std::log(2);
        double log2_PI = std::log(PI) / std::log(2);
        E0 = -log2_m + log2_PI;

        // Gradient computation in extreme case is unreliable
        grad_rho = 0.0;

        if (!std::isfinite(E0)) {
            std::cerr << "ERROR: Non-finite E0 in extreme SNR case\n";
            E0 = -1.0;
            return -1.0;
        }

        return E0;
    }
}

double initial_guess(double r, double E0_0, double E0_1, double E0_0_der, double E0_1_der, double &max_g) {
    // Linear interpolation for initial guess
    double rho_guess;

    if (E0_1_der - r == 0 || E0_0_der - r == 0) {
        rho_guess = 0.5;
    } else {
        double m = (E0_1 - E0_0);
        double b = E0_0;
        double m_prime = (E0_1_der - E0_0_der);
        double b_prime = E0_0_der;

        if (m_prime == 0) {
            rho_guess = 0.5;
        } else {
            rho_guess = (r - b_prime) / m_prime;
        }
    }

    max_g = std::max(std::abs(E0_0_der - r), std::abs(E0_1_der - r));

    // Clamp to [0, 1]
    rho_guess = std::max(0.0, std::min(1.0, rho_guess));

    return rho_guess;
}

double GD_co(double &r, double &rho, double &rho_interpolated, int num_iterations, int n, bool updateR, double error) {
    auto start_XX = std::chrono::high_resolution_clock::now();
    is_db_connected = false;

    int my_n;
    double increment = (n - low) / num_iterations;

    int prev_n = -1;
    vector<double> hweights;
    vector<double> roots;
    vector<double> multhweights;
    double e0;
    double grad_r, grad_rho, grad_2_rho;
    double nextrho, auxrho = rho, nextauxrho;
    double nextr, auxr = rho, nextauxr;
    vms inner_times;

    hweights = all_hweights[n];
    roots = all_roots[n];
    multhweights = all_multhweights[n];

    E_0_co(R, 0, grad_rho, e0);
    double E0_0 = e0, E0_prime_0 = grad_rho;

    E_0_co(R, 1, grad_rho, e0);
    double E0_1 = e0, E0_prime_1 = grad_rho;

    double max_g;
    rho = initial_guess(R, E0_0, E0_1, E0_prime_0, E0_prime_1, max_g);

    rho_interpolated = rho;

    if (rho <= 0 || rho >= 1) return E_0_co(R, max(0.0, min(rho, 1.0)), grad_rho, e0) - max(0.0, min(rho, 1.0)) * R;

    E_0_co(R, rho + 0.0000001, grad_rho, e0);
    double E0_prime_guess_plus = grad_rho;

    E_0_co(R, rho, grad_rho, e0);
    double E0_prime_guess = grad_rho;

    double grad_2_guess = ((E0_prime_guess_plus - E0_prime_guess) / (0.0000001));
    double L = (-grad_2_guess);
    double learning_rate = 1 / L;

    for (int i = 0; i < num_iterations; ++i) {
        E_0_co(R, rho, grad_rho, e0);

        double g_rho = grad_rho - r;
        nextrho = rho - learning_rate * g_rho;

        if (nextrho < 0 || nextrho > 1) {
            break;
        }

        if (std::abs(g_rho) < error) {
            break;
        }

        rho = nextrho;
    }

    E_0_co(R, rho, grad_rho, e0);

    auto stop_XX = std::chrono::high_resolution_clock::now();
    auto duration_XX = std::chrono::duration_cast<std::chrono::microseconds>(stop_XX - start_XX);
    GD_co_times.push_back(duration_XX);

    return e0 - rho * R;
}

double GD_iid(double &r, double &rho, double &rho_interploated, int num_iterations, int n, double error) {
    auto start_NAG_iid = std::chrono::high_resolution_clock::now();

    double out = GD_co(r, rho, rho_interploated, num_iterations, n, false, error);

    auto stop_NAG_iid = std::chrono::high_resolution_clock::now();
    auto duration_NAG_iid = std::chrono::duration_cast<std::chrono::microseconds>(stop_NAG_iid - start_NAG_iid);
    NAG_iid_times.push_back(chrono::microseconds(0));

    return out;
}

#endif
