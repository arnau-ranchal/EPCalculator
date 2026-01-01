//
// Created by TESTER on 03/11/2023.
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
// #include "database.h" // Commented out to avoid MySQL dependency

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
// MYSQL* conn; // database reference - commented out

bool get_db_connect_status(){
    return is_db_connected;
}

const std::string tableName = "SimulationResults";
/*
bool connect_to_db(){ // connect to mysql and create table if not present
    try{
        conn = connectToDatabase();
        is_db_connected = true;
        createTable(conn, tableName);
        return true;
    }
    catch (const std::exception& e) {
        std::cerr << "Database error: " << e.what() << std::endl;
        return false;
    }
}

bool disconnect_from_db(){
    try{
        // mysql_close(conn); // todo db
        is_db_connected = false;
        free(conn);
        return true;
    }
    catch (const std::exception& e) {
        std::cerr << "Database error: " << e.what() << std::endl;
        return false;
    }
}
*/
double SNR = 1; // positive
// vector<complex<double>> X = {1,1,1,1};
// vector<complex<double>> X = {1,2};
int sizeX = pow(2, 6);
vector<double> Qq;

// Global variables for distribution type and shaping parameter
static string current_distribution = "uniform";
static double current_beta = 0.0;

// Flag to force consistent computation method during optimization
// This ensures all E0 evaluations in one GD_co run use the same method (regular or log-space)
// preventing discontinuities at the transition boundary
static bool force_log_space_mode = false;

// Global variables to store mutual information and cutoff rate from interpolation
// These are computed during GD_co and exposed via getter functions
static double g_mutual_information = 0.0;  // E0'(0) = I(X;Y)
static double g_cutoff_rate = 0.0;         // E0(1) = R0

vector<complex<double>> X;
//vector<complex<double>> X;
// complex<double> I1 (0,2 * PI * 1 / 4), I2 (0,2 * PI * 2 / 4), I3 (0,2 * PI * 3 / 4);
// vector<complex<double>> X = {1,exp(I1), exp(I2), exp(I3)};
/* vector<complex<double>> X = {complex<double> (-1/sqrt(2),-1/sqrt(2) ),
                             complex<double> ( 1/sqrt(2),-1/sqrt(2) ),
                             complex<double> (-1/sqrt(2), 1/sqrt(2) ),
                             complex<double> ( 1/sqrt(2), 1/sqrt(2) )   };*/

double R;
unordered_map<int, vector<double>> all_hweights;
unordered_map<int, vector<double>> all_roots;
unordered_map<int, vector<double>> all_multhweights;

int n = 15; // todo: warning: temporary
void setN(int n_) { n = n_; }

// -- MATRIX DEFINITIONS --
VectorXd Q_mat;
MatrixXd PI_mat;
MatrixXd W_mat;
VectorXcd X_mat(sizeX);
MatrixXd D_mat;
VectorXd A_mat; // alphas

double low = n; // todo: warning: temporary: before was 17.0

vms e0_times;// = {std::chrono::microseconds(1), std::chrono::microseconds(2), std::chrono::microseconds(3)};
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
            {{"e0_times",               e0_times},// = {std::chrono::microseconds(1), std::chrono::microseconds(2), std::chrono::microseconds(3)};{NAG_cc_times, "NAG_cc_times",
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


void setQ(string distribution = "uniform", double shaping_param = 0.0) {
    // Store distribution type and beta parameter for use in normalizeX_for_Q()
    current_distribution = distribution;
    current_beta = shaping_param;

    Q_mat = VectorXd::Zero(sizeX);

    if (distribution == "maxwell-boltzmann" || distribution == "boltzmann") {
        // Maxwell-Boltzmann / Boltzmann distribution: Q(i) ∝ exp(-beta * |X(i)|²)
        // Don't compute Q_mat here - let normalizeX_for_Q() do it via fixed-point iteration
        // This ensures Q and X maintain the correct relationship
        std::cout << "INFO: Maxwell-Boltzmann distribution requested with beta=" << shaping_param
                  << " (Q will be computed via fixed-point iteration)\n";
    } else {
        // Uniform distribution (default)
        for (int i = 0; i < sizeX; i++) {
            Q_mat(i) = 1.0 / double(sizeX);
        }
        std::cout << "INFO: Uniform distribution set\n";
    }

    //cout << endl << "Q" << endl << Q_mat << endl;
}

void setPI() {
    vector<double> hweights = Hweights(n - 1); // todo change n
    vector<double> windows;

    PI_mat = MatrixXd::Zero(sizeX, n * n * sizeX);
    //for(auto h: hweights){  cout << "weights: " << h << endl; }

    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            windows.push_back(hweights[j] * hweights[i]); // windows is size n*n
        }
    }

    //for(auto w: windows){  cout << "windows: " << w << endl; }

    for (int i = 0; i < sizeX; i++) {
        int a = 0;
        for (int j = i * n * n; j < i * n * n + n * n; j++) {
            PI_mat(i, j) = windows[a];//all_hweights[n][i]*all_hweights[n][j]
            a++;
        }
    }
    //cout << endl << "PI: " << endl << PI_mat << endl;
    //cout << PI_mat.rows() << " " << PI_mat.cols();
    //std::cout << "hweights size: " << hweights.size() << "\n"; // Should be n
}

void setW() {
    //W_mat = MatrixXd::Zero(sizeX, n*n*sizeX);
    vector<double> roots = Hroots(n);
    vector<complex<double>> complexroots; // n*n
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            complexroots.push_back(complex<double>(roots[i], roots[j]));
        }
    }
    /*
    cout << endl << "X: " << endl;
    for(auto x: X_mat){
        cout << x << endl;
    }


    cout << endl << "Z: " << endl;
    for(auto z: complexroots){
        cout << z << endl;
    }
    */
    VectorXcd Y(n * n * sizeX);
    int a = 0;
    for (int i = 0; i < n * n * sizeX; i += n * n) {
        for (int j = 0; j < n * n; j++) {
            Y(i + j) = sqrt(SNR) * X_mat(a);
            Y(i + j) += complexroots[j];
        }
        a++;
    }
    // cout << endl << "Y: " << endl << Y << endl;

    //MatrixXd D_mat(sizeX, n*n*sizeX);
    D_mat = MatrixXd::Zero(sizeX, n * n * sizeX);
    for (int i = 0; i < sizeX; i++) {
        for (int j = 0; j < n * n * sizeX; j++) {
            D_mat(i, j) = abs_sq(Y(j) - sqrt(SNR) * X_mat(i));
        }
    }
    //cout << endl << "D: " << endl << D_mat << endl;
    // cout << D_mat.rows() << " " << D_mat.cols();

    //W_mat = exp(-D_mat.array());

    //cout << endl << "W: " << endl <<W_mat << endl;
    // cout << endl << endl;
    // In setW():
    //std::cout << "roots size: " << roots.size() << "\n"; // Should be n
    //std::cout << "Y[0]: " << Y(0) << "\n"; // Should be X_mat[0] + complexroots[0]
}

void setX(int npoints, string xmode) {
    sizeX = npoints;
    X.resize(npoints);
    X_mat = VectorXd::Zero(sizeX);
    if (xmode == "PAM") { // pam
        float delta = sqrt(3 / (pow(npoints, 2) - 1));
        for (int n = 0; n < npoints / 2; n++) {
            X[n + npoints / 2] = (2 * n + 1) * delta;
            X_mat(n + npoints / 2) = (2 * n + 1) * delta;
        }

        for (int n = 0; n < npoints / 2; n++) {
            X[n] = -X[npoints - 1 - n];
            X_mat(n) = -X_mat(npoints - 1 - n);
        }
    } else if (xmode == "PSK") { // psk
        for (int n = 0; n < npoints; n++) {
            X[n] = (cos(2.0 * PI * double(n) / npoints) + I * sin(2.0 * PI * double(n) / npoints));
            X_mat(n) = (cos(2.0 * PI * double(n) / npoints) + I * sin(2.0 * PI * double(n) / npoints));
        }
    } else if (xmode == "QAM") { // qam
        // Square QAM constellation (M-QAM where M = L^2, L = sqrt(M))
        int L = static_cast<int>(sqrt(npoints));
        if (L * L != npoints) {
            cout << "Warning: QAM requires M to be a perfect square (4, 16, 64, 256, etc.). Defaulting to PAM." << endl;
            setX(npoints, "PAM");
            return;
        }

        // Normalization factor for unit average power
        float delta = sqrt(3.0 / (2.0 * (L * L - 1)));

        int idx = 0;
        for (int i = 0; i < L; i++) {
            for (int j = 0; j < L; j++) {
                // Generate constellation points: I and Q components
                double I_comp = (2 * i - L + 1) * delta;
                double Q_comp = (2 * j - L + 1) * delta;
                X[idx] = I_comp + I * Q_comp;
                X_mat(idx) = I_comp + I * Q_comp;
                idx++;
            }
        }
    } else if (xmode == "secret") {
        for (int n = 0; n < npoints; n++) X[n] = (double(rand()) + I * double(rand()));
        //X = {-1/sqrt(2)-I*double(1/sqrt(2)), -1/sqrt(2)+I*double(1/sqrt(2)), +1/sqrt(2)-I*double(1/sqrt(2)), 1/sqrt(2)+I*double(1/sqrt(2))};
    } else {
        setX(npoints, "PAM");
        cout << "It's me, C++. Error. Unknown constellation name recieved: "+xmode;
    }

    //cout << "X: " << X_mat << endl;
    /*
    cout << endl << "XXXXXX";
    for(int n = 0; n < npoints; n++){
        cout << X[n] << " ";
    }
    cout << endl;
     */
    /*
    for(auto x: X){
        qDebug("x,mod is %f+i%f,%d", real(x),imag(x), sizeX);
    }
    */

    /*
    if(DEBUG){
        for(auto x: X){
            qDebug("x,mod is %f+i%f,%d", real(x),imag(x), sizeX);
        }
    }
    */
}

void normalizeX_for_Q() {
    if (current_distribution == "uniform") {
        // Uniform distribution: Simple normalization (old behavior)
        // Compute current average power: E[|X|²] = Σ Q_i * |X_i|²
        double avg_power = 0.0;
        for (int i = 0; i < sizeX; i++) {
            double x_squared = std::abs(X_mat(i)) * std::abs(X_mat(i));  // |X_i|²
            avg_power += Q_mat(i) * x_squared;
        }

        // Scale X to achieve E[|X|²] = 1
        // Use 1e-14 threshold (100x machine epsilon for double precision)
        if (avg_power > 1e-14) {
            double scale_factor = 1.0 / std::sqrt(avg_power);

            // Apply scaling to both X and X_mat
            for (int i = 0; i < sizeX; i++) {
                X[i] *= scale_factor;
                X_mat(i) *= scale_factor;
            }

            std::cout << "INFO: X normalized for uniform Q, avg_power=" << avg_power
                      << ", scale=" << scale_factor << "\n";
        } else {
            std::cerr << "WARNING: Average power too small (avg_power=" << avg_power
                      << "), X normalization skipped\n";
        }
    } else if (current_distribution == "maxwell-boltzmann" || current_distribution == "boltzmann") {
        // Maxwell-Boltzmann: Fixed-point iteration to find s such that:
        //   Q_i ∝ exp(-beta * |s*p_i|²)  AND  E[|X|²] = 1
        // where p is the unnormalized pattern and X = s*p

        // Convergence criteria: use both absolute and relative tolerances
        // to handle all beta values robustly
        double abs_tolerance = 1e-14;  // Absolute tolerance (relaxed from 1e-15)
        double rel_tolerance = 1e-12;  // Relative tolerance
        int max_iterations = 1000;
        double beta = current_beta;

        // Store unnormalized pattern energies |p_i|²
        vector<double> pattern_energy(sizeX);
        for (int i = 0; i < sizeX; i++) {
            complex<double> p_i = X_mat(i);
            pattern_energy[i] = std::abs(p_i) * std::abs(p_i);  // |p_i|²
        }

        // Fixed-point iteration: s_new = 1 / sqrt(E[|p|²])
        double s = 1.0;  // Initial scaling factor
        double s_prev = 0.0;  // Track previous value for stagnation detection
        int converged_iter = -1;

        for (int iter = 0; iter < max_iterations; iter++) {
            // Compute unnormalized Q: Q_i ∝ exp(-beta * s² * |p_i|²)
            vector<double> unnorm_Q(sizeX);
            double Q_sum = 0.0;
            for (int i = 0; i < sizeX; i++) {
                unnorm_Q[i] = std::exp(-beta * s * s * pattern_energy[i]);
                Q_sum += unnorm_Q[i];
            }

            // Normalize Q to make it a probability distribution
            vector<double> Q(sizeX);
            for (int i = 0; i < sizeX; i++) {
                Q[i] = unnorm_Q[i] / Q_sum;
            }

            // Compute expected energy: E[|p|²] = Σ Q_i * |p_i|²
            double expected_energy = 0.0;
            for (int i = 0; i < sizeX; i++) {
                expected_energy += Q[i] * pattern_energy[i];
            }

            // Update scaling factor: s_new = 1 / sqrt(E[|p|²])
            double s_new = 1.0 / std::sqrt(expected_energy);

            // Check convergence with multiple criteria
            double delta_s = std::abs(s_new - s);
            double rel_delta = (s > 1e-10) ? (delta_s / s) : delta_s;

            // Check for stagnation (no progress between iterations)
            bool stagnated = (s_prev > 0) && (s == s_prev);

            if (iter < 10 || iter % 50 == 0) {
                std::cout << "  Iter " << iter << ": s=" << s
                          << ", E[|p|²]=" << expected_energy
                          << ", |Δs|=" << delta_s << "\n";
            }

            // Convergence achieved if:
            // 1. Absolute change is tiny (below absolute tolerance), OR
            // 2. Relative change is tiny (below relative tolerance), OR
            // 3. Algorithm has stagnated (no change between iterations)
            bool converged = (delta_s < abs_tolerance) ||
                           (rel_delta < rel_tolerance) ||
                           stagnated;

            if (converged) {
                s = s_new;
                converged_iter = iter;
                std::cout << "INFO: Fixed-point iteration converged after " << iter
                          << " iterations, final s=" << s
                          << " (|Δs|=" << delta_s << ", rel=" << rel_delta << ")\n";
                break;
            }

            s_prev = s;
            s = s_new;
        }

        if (converged_iter < 0) {
            std::cerr << "WARNING: Fixed-point iteration did not converge after "
                      << max_iterations << " iterations\n";
        }

        // Apply final scaling factor to constellation
        for (int i = 0; i < sizeX; i++) {
            X[i] *= s;
            X_mat(i) *= s;
        }

        // Compute and set final Q_mat based on scaled constellation
        Q_mat = VectorXd::Zero(sizeX);
        double Q_sum = 0.0;
        for (int i = 0; i < sizeX; i++) {
            double energy = std::abs(X_mat(i)) * std::abs(X_mat(i));  // |X_i|²
            Q_mat(i) = std::exp(-beta * energy);
            Q_sum += Q_mat(i);
        }

        // Normalize Q_mat
        if (Q_sum > 1e-14) {
            for (int i = 0; i < sizeX; i++) {
                Q_mat(i) /= Q_sum;
            }
        }

        // Verification: compute final average energy
        double final_avg_energy = 0.0;
        for (int i = 0; i < sizeX; i++) {
            double x_squared = std::abs(X_mat(i)) * std::abs(X_mat(i));
            final_avg_energy += Q_mat(i) * x_squared;
        }

        std::cout << "INFO: Final E[|X|²] = " << final_avg_energy
                  << " (error from 1.0: " << std::abs(final_avg_energy - 1.0) << ")\n";
    }
}

void setA(vector<int> alphas) { // alphas
    A_mat = VectorXd::Zero(sizeX);
}

void setR(double r) {
    R = r;
}

void setSNR(double snr) {
    SNR = snr;
    //cout << "new SNR: " << SNR << endl;
}

void setMod(int mod, string xmode) {
    setX(mod, xmode);
}

void setCustomConstellation(const double* real_parts, const double* imag_parts, const double* probabilities, int num_points) {
    // Set constellation size
    sizeX = num_points;

    // Clear and resize constellation vectors
    X.clear();
    X.reserve(num_points);
    X_mat = VectorXcd(num_points);

    // Set custom constellation points
    for (int i = 0; i < num_points; i++) {
        complex<double> point(real_parts[i], imag_parts[i]);
        X.push_back(point);
        X_mat(i) = point;
    }

    // Set custom probabilities
    Q_mat = VectorXd(num_points);
    for (int i = 0; i < num_points; i++) {
        Q_mat(i) = probabilities[i];
    }

    cout << "INFO: Custom constellation set with " << num_points << " points" << endl;
}

std::chrono::microseconds sum_(vector<std::chrono::microseconds> vector1) {
    std:
    chrono::microseconds s = (std::chrono::microseconds) 0;
    for (auto x: vector1) {
        s += x;
    }
    return s;
}

string complextostr(complex<double> x) {
    return to_string(real(x)) + "+I*" + to_string(imag(x));
}

void initQ() {
    //qDebug() << "sx" << sizeX;
    double r, mysum = 0;
    for (int n = 0; n < sizeX; n++) {
        r = rand();
        Qq.push_back(r);
        mysum += r;
    }

    for (int n = 0; n < sizeX; n++) {
        //qDebug() << "qprev " << Qq[n];
        Qq[n] /= mysum;
        //qDebug() << "qpost " << Qq[n];
    }
    //qDebug() << mysum;
}

double Q(complex<double> x) {
    //return Qq[x];
    return 1.0 / double(sizeX);
}


inline double cost(complex<double> current_x) { // returns the cost function given x
    double out = abs_sq(current_x);
    int a = 0;
    for (auto x: X) {
        out -= Q(a) * abs_sq(x);
        a++;
    }
    //cout << "cost: " << out << endl;
    return out;
}

inline double W(complex<double> y, complex<double> x) {
    return 1 / PI * exp(-abs_sq(y - sqrt(SNR) * x));
}

inline double G(double alpha, complex<double> xhat, complex<double> y // a
        , double rho) {                                  // rho
    return exp(-rho * alpha) * pow(W(y, xhat), 1 / (1 + rho));
}


inline double G_co(double r, complex<double> xhat, complex<double> y // a
        , double rho) {                                  // rho
    return exp(-r * rho * cost(xhat)) * pow(W(y, xhat), 1 / (1 + rho));
}

inline double H_co(double r, complex<double> x, complex<double> y, double rho) {
    return exp(r * cost(x)) * pow(W(y, x), 1 / (1 + rho));
}

inline double H(double alpha, complex<double> x, complex<double> y, double rho) {
    //return exp(alpha(x)) * pow(W(y,x),1/(1+rho));
    return exp(alpha) * pow(W(y, x), 1 / (1 + rho));
}

void test() {
    MatrixXd a;
    a = MatrixXd::Zero(1, 1);
    MatrixXd b;
    b = MatrixXd::Zero(1, 1);

    a(0, 0) = 1000;
    b(0, 0) = -1000;
    cout << a.array().exp() << endl;
    cout << b.array().exp() << endl;
}

double fa(complex<double> x, complex<double> y, vector<double> alphas, double rho, int xind) {

    auto start_XX = std::chrono::high_resolution_clock::now();

    double f = 0;
    double h = H(alphas[xind], x, y, rho);
    int xindex = 0;
    for (auto xhat: X) {
        f += Q(xindex) * G(alphas[xindex], xhat, y, rho) / h;
        xindex++;
    }

    auto stop_XX = std::chrono::high_resolution_clock::now();
    auto duration_XX = std::chrono::duration_cast<std::chrono::microseconds>(stop_XX - start_XX);
    fa_times.push_back(duration_XX);

    return f;
}

double fa_co(complex<double> x, complex<double> y, double r, double rho) {

    auto start_XX = std::chrono::high_resolution_clock::now();

    double f = 0;
    double h = H_co(r, x, y, rho);
    int a = 0;
    for (auto xhat: X) {
        f += Q(a) * G_co(r, xhat, y, rho) / h; // todo check Q()
        a++;
    }
    auto stop_XX = std::chrono::high_resolution_clock::now();
    auto duration_XX = std::chrono::duration_cast<std::chrono::microseconds>(stop_XX - start_XX);
    fa_co_times.push_back(duration_XX);

    return f;
}


double E_0(double rho, vector<double> alphas, int n) {

    auto start_e0 = std::chrono::high_resolution_clock::now();

    /*
    cout << Q_mat.rows() << endl;
    cout << Q_mat.cols() << endl;
    cout << PI_mat.rows() << endl;
    cout << PI_mat.cols() << endl;
    cout << W_mat.rows() << endl;
    cout << W_mat.cols() << endl;
    */
    rho = 0; // todo temp

    MatrixXd W_firstpower = W_mat.array().pow(-(rho) / (1 + rho));
    MatrixXd W_secondpower = W_mat.array().pow(1 / (1 + rho));
    //MatrixXcd QW2 = ;
    //MatrixXcd QW2_transpose = QW2.transpose();

    //cout << endl << PI_mat << endl;

    cout << "Wf" << endl << W_firstpower << endl;
    cout << "Ws" << endl << W_secondpower << endl;
    cout << "test" << endl << (PI_mat.cwiseProduct(W_firstpower)) << endl;
    cout << "last" << endl << (Q_mat.array().transpose().pow(rho).matrix() * W_secondpower).transpose() << endl;

    VectorXd ones(n * n * sizeX);
    for (int i = 0; i < n * n * sizeX; i++) { ones(i) = 1; }

    double E0 = Q_mat.transpose() * // 1 x 32
                (PI_mat.cwiseProduct(W_firstpower)) * // 32 x 544
                ones;  // 1 x 32 x 32 x 544
    //(Q_mat.array().transpose() * W_secondpower).pow(rho).transpose();

    //MatrixXd ED = (D_mat*-0.5).array().exp();
    //MatrixXd Wpow = W_mat.array().pow(0.5);


    auto stop_e0 = std::chrono::high_resolution_clock::now();
    auto duration_e0 = std::chrono::duration_cast<std::chrono::microseconds>(stop_e0 - start_e0);

    //cout << endl << ED << endl;

    //double E0 = 0;

    e0_times.push_back(duration_e0);

    // todo change
    E0 = 0;
    return E0;
}

void printrowscols(MatrixXd m, string s) {
    //cout << s << " " << m.rows() << " " << m.cols() << endl;
}

/*
double E_0_1_co_old(){
    // has snr
    double sum = 0;
    for (complex<double> x1: X){
        for(complex<double> x2: X){
            sum += Q(x1) * Q(x2) * exp(-SNR/4 * abs_sq(x1-x2));
        }
    }
    return -log2(sum);
}
*/

double E_0_1_co_old() {
    // has snr
    double sum = 0;
    for (complex<double> x1: X) {
        for (complex<double> x2: X) {
            sum += Q(x1) * Q(x2) * exp(-1.0 / 4 * abs_sq(x1 - x2));
        }
    }
    return -log2(sum);
}

double E_0_1_co() {
    double sum = 0;
    cout << "SNR: " << SNR << endl;
    for (complex<double> x1: X) {
        for (complex<double> x2: X) {
            complex<double> mean = (x1 + x2) / 2.0;
            sum += Q(x1) * Q(x2) * exp(-SNR / 2.0 * (abs_sq(x1 - mean) + abs_sq(x2 - mean)));
        }
    }
    return -log2(sum);
}

double E_0_2_co() {
    // snr = 1
    double sum = 0;
    for (complex<double> x1: X) {
        for (complex<double> x2: X) {
            for (complex<double> x3: X) {
                complex<double> mean = (x1 + x2 + x3) / 3.0;
                sum += Q(x1) * Q(x2) * Q(x3) *
                       exp(-SNR / 3.0 * (abs_sq(x1 - mean) + abs_sq(x2 - mean) + abs_sq(x3 - mean)));
            }
        }
    }
    return -log2(sum);
}

double E_0_co(double r, double rho, double &grad_rho, double &grad_2_rho, double &E0, int n, vector<double> hweights,
              vector<double> multhweights, vector<double> roots) {
    // computes second der
    Eigen::VectorXd logqg2 = (Q_mat.transpose() * ((-1.0 / (1.0 + rho)) * D_mat.array()).exp().matrix()).array().log();
    Eigen::VectorXd qg2rho = (rho * logqg2.array()).exp();
    Eigen::MatrixXd pig1_mat = PI_mat.array() * ((rho / (1.0 + rho)) * D_mat.array()).exp();

    const int sizeX = Q_mat.size();
    const double s = 1.0 / (1.0 + rho);
    const double s_prime = -1.0 / pow(1.0 + rho, 2);
    const double s_double_prime = 2.0 / pow(1.0 + rho, 3);

    // Common terms -----------------------------------------------------------
    const MatrixXd ln_W = W_mat.array().log();
    const MatrixXd exp_slnW = (s * ln_W).array().exp();
    const MatrixXd exp_neg_srho_lnW = (-s * rho * ln_W).array().exp();

    // Frequently used terms ---------------------------------------------------
    const RowVectorXd QT_exp_slnW = Q_mat.transpose() * exp_slnW;
    const RowVectorXd QT_sprime_lnW_exp_slnW = Q_mat.transpose() *
                                               (s_prime * ln_W.array() * exp_slnW.array()).matrix();
    const RowVectorXd ratio_term = QT_sprime_lnW_exp_slnW.array() / QT_exp_slnW.array();

    // Compute values ----------------------------------------------------------
    // Value1
    MatrixXd term1 = (-s_prime * rho * ln_W - s * ln_W).array().square();
    RowVectorXd val1 = (Q_mat.transpose() * (PI_mat.array() * exp_neg_srho_lnW.array() * term1.array()).matrix())
                       * QT_exp_slnW.array().pow(rho).matrix().transpose();
    double value1 = val1.value();

    // Value2
    MatrixXd term2 = (-s_double_prime * rho * ln_W - 2.0 * s_prime * ln_W);
    RowVectorXd val2 = (Q_mat.transpose() * (PI_mat.array() * exp_neg_srho_lnW.array() * term2.array()).matrix())
                       * QT_exp_slnW.array().pow(rho).matrix().transpose();
    double value2 = val2.value();

    // Value3 - Corrected
    MatrixXd term3 = (-s_prime * rho * ln_W - s * ln_W);
    MatrixXd val3_left_part = (PI_mat.array() * exp_neg_srho_lnW.array() * term3.array());
    RowVectorXd val3_left = Q_mat.transpose() * val3_left_part;
    RowVectorXd val3_right = QT_exp_slnW.array().pow(rho) *
                             (QT_exp_slnW.array().log() + rho * ratio_term.array());
    double value3 = 2.0 * val3_left.cwiseProduct(val3_right).sum();

    // Value4
    RowVectorXd squared_term = (QT_exp_slnW.array().log() + rho * ratio_term.array()).square();
    RowVectorXd val4 = (Q_mat.transpose() * (PI_mat.array() * exp_neg_srho_lnW.array()).matrix())
                       * (QT_exp_slnW.array().pow(rho) * squared_term.array()).matrix().transpose();
    double value4 = val4.value();

    // Value5
    MatrixXd s_prime_sq_lnW_sq = s_prime * s_prime * ln_W.array().square();
    MatrixXd inner_term = s_double_prime * ln_W + s_prime_sq_lnW_sq;
    RowVectorXd term5 = 2.0 * ratio_term.array() +
                        rho * (Q_mat.transpose() * (inner_term.array() * exp_slnW.array()).matrix()).array() /
                        QT_exp_slnW.array() -
                        rho * ratio_term.array().square();

    RowVectorXd val5 = (Q_mat.transpose() * (PI_mat.array() * exp_neg_srho_lnW.array()).matrix())
                       * (QT_exp_slnW.array().pow(rho) * term5.array()).matrix().transpose();
    double value5 = val5.value();

    double m = (Q_mat.transpose() * pig1_mat * qg2rho).sum();
    double mp = (Q_mat.transpose() * pig1_mat * (qg2rho.array() * logqg2.array()).matrix()).sum()
                - (1.0 / (1.0 + rho)) *
                  (Q_mat.transpose() * (pig1_mat.array() * (-D_mat.array())).matrix() * qg2rho).sum();
    double m2p = value1 + value2 + value3 + value4 + value5;


    double F0 = m / PI;
    double Fder0 = mp / PI;
    double F2der0 = m2p / PI;

    grad_rho = -(Fder0) / (std::log(2) * F0);
    grad_2_rho = -(1.0 / std::log(2)) * ((F2der0 / F0) - std::pow(Fder0 / F0, 2));
    E0 = -log2(F0);

    return E0;
}

// Log-sum-exp trick: stable computation of log(sum(exp(x_i)))
inline double log_sum_exp(const Eigen::VectorXd& log_values) {
    double max_val = log_values.maxCoeff();
    if (!std::isfinite(max_val)) {
        return max_val;  // If max is inf or -inf, return it
    }
    // log(sum(exp(x_i))) = max + log(sum(exp(x_i - max)))
    return max_val + std::log((log_values.array() - max_val).exp().sum());
}

// Log-space version of E_0_co for high SNR (overflow-safe)
double E_0_co_log_space(double r, double rho, double &grad_rho, double &E0) {
    std::cout << "INFO: Using log-space computation (high SNR mode)\n";

    const int sizeX = Q_mat.size();  // Q_mat is a VectorXd
    const int cols = D_mat.cols();    // n*n*sizeX
    const double s = 1.0 / (1.0 + rho);

    // Compute in log-space to avoid overflow
    // logqg2 = log(Q^T * exp(-s * D))
    // Result is a vector of size cols (n*n*sizeX)
    // For each column j, compute log(sum_i Q_i * exp(-s * D_ij))
    Eigen::VectorXd logqg2(cols);
    for (int j = 0; j < cols; j++) {
        // log(sum_i Q_i * exp(-s * D_ij)) = log_sum_exp(log(Q_i) - s * D_ij)
        Eigen::VectorXd log_terms = Q_mat.array().log() - s * D_mat.col(j).array();
        logqg2(j) = log_sum_exp(log_terms);
    }

    // Detect degenerate channel (SNR≈0): all symbols indistinguishable
    // Check if logqg2 variance is very small (all columns give same posterior)
    double logqg2_mean = logqg2.mean();
    double logqg2_variance = (logqg2.array() - logqg2_mean).square().mean();

    if (logqg2_variance < 1e-20 || !std::isfinite(logqg2_mean)) {
        // Degenerate channel - capacity is effectively zero
        std::cout << "INFO: Degenerate channel detected (SNR≈0), returning E0=0\n";
        E0 = 0.0;
        grad_rho = 0.0;
        return 0.0;
    }

    // Check if we can proceed without further overflow
    // Since we're already using log-space for the logqg2 computation,
    // we can be more lenient with the threshold (close to 700)
    double max_qg2_arg = std::abs(rho * logqg2.maxCoeff());
    double max_pig_arg = std::abs((rho / (1.0 + rho)) * D_mat.maxCoeff());

    if (max_pig_arg < 690 && max_qg2_arg < 690) {
        // Safe to exponentiate now (with some headroom before 700)
        Eigen::VectorXd qg2rho = (rho * logqg2.array()).exp();
        Eigen::MatrixXd pig1_mat = PI_mat.array() * ((rho / (1.0 + rho)) * D_mat.array()).exp();

        // Use same computation as original E_0_co
        double m = (Q_mat.transpose() * pig1_mat * qg2rho).sum();
        double mp = (Q_mat.transpose() * pig1_mat * (qg2rho.array() * logqg2.array()).matrix()).sum()
                    - (1.0 / (1.0 + rho)) *
                      (Q_mat.transpose() * (pig1_mat.array() * (-D_mat.array())).matrix() * qg2rho).sum();

        double F0 = m / PI;
        double Fder0 = mp / PI;

        std::cout << "DEBUG hybrid log-space: m=" << m << ", PI=" << PI << ", F0=" << F0 << "\n";

        if (!std::isfinite(F0) || F0 <= 0) {
            std::cerr << "ERROR: Invalid F0 in log-space computation: F0=" << F0 << "\n";
            E0 = -1.0;
            grad_rho = 0.0;
            return -1.0;
        }

        grad_rho = -(Fder0) / (std::log(2) * F0);
        E0 = -std::log2(F0);

        if (!std::isfinite(E0) || !std::isfinite(grad_rho)) {
            std::cerr << "ERROR: Non-finite result in log-space: E0=" << E0 << ", grad=" << grad_rho << "\n";
            E0 = -1.0;
            grad_rho = 0.0;
            return -1.0;
        }

        // Clamp negative E0 to 0 (can't have negative error exponent)
        // This can happen at very low SNR where channel capacity approaches 0,
        // OR at very high SNR where numerical issues cause incorrect results
        if (E0 < 0) {
            std::cerr << "WARNING: Negative E0=" << E0 << " (SNR=" << SNR << ", rho=" << rho << ") - clamping to 0.\n";
            E0 = 0.0;
            grad_rho = 0.0;
        }

        return E0;
    } else {
        // Extreme SNR case - compute E0 in pure log-space without exponentiating
        std::cout << "INFO: Extreme overflow detected (max_pig_arg=" << max_pig_arg
                  << ", max_qg2_arg=" << max_qg2_arg << "), using pure log-space E0 computation\n";

        // Compute log_m (already done above in logqg2 computation)
        // log_m = log(sum_j [ (sum_i Q_i * pig1[i,j]) * qg2rho[j] ])
        Eigen::VectorXd log_m_components(cols);
        Eigen::MatrixXd log_pig1_mat = PI_mat.array().log() + (rho / (1.0 + rho)) * D_mat.array();

        for (int j = 0; j < cols; j++) {
            Eigen::VectorXd inner_log_terms = Q_mat.array().log() + log_pig1_mat.col(j).array();
            double log_inner_sum = log_sum_exp(inner_log_terms);
            log_m_components(j) = log_inner_sum + rho * logqg2(j);
        }
        double log_m = log_sum_exp(log_m_components);

        // Compute E0 = -log2(F0) = -log2(m/PI) = -log2(m) + log2(PI)
        double log2_m = log_m / std::log(2);
        double log2_PI = std::log(PI) / std::log(2);
        E0 = -log2_m + log2_PI;

        std::cout << "DEBUG pure log-space: log_m=" << log_m << ", log2_m=" << log2_m
                  << ", log2_PI=" << log2_PI << ", E0=" << E0 << "\n";

        // Compute gradient numerically using finite differences
        // This is more robust than analytical gradient in extreme overflow case
        double delta_rho = 1e-6;
        double rho_plus = rho + delta_rho;

        // Compute E0 at rho + delta
        Eigen::VectorXd log_m_components_plus(cols);
        Eigen::MatrixXd log_pig1_mat_plus = PI_mat.array().log() + (rho_plus / (1.0 + rho_plus)) * D_mat.array();

        for (int j = 0; j < cols; j++) {
            Eigen::VectorXd inner_log_terms_plus = Q_mat.array().log() + log_pig1_mat_plus.col(j).array();
            double log_inner_sum_plus = log_sum_exp(inner_log_terms_plus);
            log_m_components_plus(j) = log_inner_sum_plus + rho_plus * logqg2(j);
        }
        double log_m_plus = log_sum_exp(log_m_components_plus);
        double E0_plus = -(log_m_plus / std::log(2)) + log2_PI;

        // Numerical gradient: dE0/drho ≈ (E0(rho+δ) - E0(rho)) / δ
        grad_rho = (E0_plus - E0) / delta_rho;

        std::cout << "DEBUG pure log-space gradient: E0=" << E0 << ", E0_plus=" << E0_plus
                  << ", grad_rho=" << grad_rho << "\n";

        if (!std::isfinite(E0)) {
            std::cerr << "ERROR: Non-finite E0 in pure log-space: " << E0 << "\n";
            E0 = -1.0;
            return -1.0;
        }

        // NOTE: At very high SNR (SNR >> 100), E0 can become negative due to numerical limitations
        // of the quadrature approximation. This indicates the SNR is too high for accurate computation
        // with the current number of quadrature points (N).
        // For now, we clamp to 0 as a fallback, but this means results may be inaccurate.
        if (E0 < 0) {
            std::cerr << "WARNING: Negative E0=" << E0 << " at high SNR - clamping to 0. Consider increasing N or using asymptotic approximation.\n";
            E0 = 0.0;
        }

        return E0;
    }
}

double E_0_co(double r, double rho, double &grad_rho, double &E0) {
    // does not compute second der

    // *** OVERFLOW DETECTION: Check D_mat BEFORE exponentiating ***
    double check_factor = -1.0 / (1.0 + rho);
    double max_D = D_mat.maxCoeff();
    double min_D = D_mat.minCoeff();
    double max_exp_arg = std::abs(check_factor * max_D);
    double min_exp_arg = std::abs(check_factor * min_D);

    const double OVERFLOW_THRESHOLD = 700.0;  // exp(709) overflows double

    // Check if we should use log-space (either forced or threshold exceeded)
    bool use_log_space = force_log_space_mode ||
                         max_exp_arg > OVERFLOW_THRESHOLD ||
                         min_exp_arg > OVERFLOW_THRESHOLD;

    if (use_log_space) {
        // Only print message if actually switching due to overflow (not forced)
        if (!force_log_space_mode && (max_exp_arg > OVERFLOW_THRESHOLD || min_exp_arg > OVERFLOW_THRESHOLD)) {
            std::cout << "\n=== Switching to log-space computation (SNR=" << SNR << ", rho=" << rho << ") ===\n";
        }

        // Use log-space version
        return E_0_co_log_space(r, rho, grad_rho, E0);
    }

    Eigen::VectorXd logqg2 = (Q_mat.transpose() * ((-1.0 / (1.0 + rho)) * D_mat.array()).exp().matrix()).array().log();
    // Before qg2rho = exp(rho * logqg2):
    double max_log = logqg2.maxCoeff();
    double min_log = logqg2.minCoeff();
    //cout << "should print" << endl;
    if (abs(rho * max_log) > 700) { // exp(709) overflows double
        std::cout << "err1: Exponentiation overflow/underflow risk: " << rho * max_log << "\n";
    } else if (rho * min_log < -700) {

    }
    Eigen::VectorXd qg2rho = (rho * logqg2.array()).exp();
    Eigen::MatrixXd pig1_mat = PI_mat.array() * ((rho / (1.0 + rho)) * D_mat.array()).exp();

    // In E_0_co(), after computing D_mat:
    if (D_mat.hasNaN()) std::cout << "err2: NaN in D_mat!\n";
    if (D_mat.minCoeff() < 0) std::cout << "err3: Negative values in D_mat!\n";

    // After computing logqg2:
    if (logqg2.hasNaN()) std::cout << "err4: NaN in logqg2!\n";
    if (logqg2.minCoeff() == -std::numeric_limits<double>::infinity()) std::cout << "err5: -inf in logqg2!\n";
    //cout << "n: " << n << endl;
    //cout << "PI_mat size: " << PI_mat.rows() << " " << PI_mat.cols() << endl;
    //cout << PI_mat << endl;
    //cout << "D_mat  size: " << D_mat .rows() << " " << D_mat.cols() << endl;
    //cout << D_mat << endl;

    const int sizeX = Q_mat.size();
    const double s = 1.0 / (1.0 + rho);
    const double s_prime = -1.0 / pow(1.0 + rho, 2);

    double m = (Q_mat.transpose() * pig1_mat * qg2rho).sum();
    double mp = (Q_mat.transpose() * pig1_mat * (qg2rho.array() * logqg2.array()).matrix()).sum()
                - (1.0 / (1.0 + rho)) *
                  (Q_mat.transpose() * (pig1_mat.array() * (-D_mat.array())).matrix() * qg2rho).sum();

    // Before F0 = m/PI:
    if (std::abs(m) < 1e-300) std::cout << "err6: Near-zero m: " << m << "\n";
    if (std::abs(PI) < 1e-300) std::cout << "err7: Near-zero PI: " << PI << "\n";
    double F0 = m / PI;
    double Fder0 = mp / PI;

    grad_rho = -(Fder0) / (std::log(2) * F0);
    // After computing grad_rho:
    if (!std::isfinite(grad_rho)) {
        std::cout << "err8: Non-finite gradient: " << grad_rho
                  << " at rho=" << rho << " SNR=" << SNR << "\n";
    }
    E0 = -log2(F0);

    // DEBUG: Print key intermediates
    //std::cout << "\n==== Eigen Version ====\n";
    /*
    std::cout << "logqg2[0]: " << logqg2(0) << std::endl;
    std::cout << "qg2rho[0]: " << qg2rho(0) << std::endl;

    Eigen::VectorXd pig1_first_col = pig1_mat.col(0);
    std::cout << "pig1_mat(0,0): " << pig1_first_col(0) << std::endl;
    */
    /*
    std::cout << "m: " << m << " | mp: " << mp << std::endl;
    std::cout << "F0: " << F0 << " | Fder0: " << Fder0 << std::endl;
     */
    /*
    cout << "PI_mat: " << endl << PI_mat << endl;
    cout << "D_mat: " << endl << D_mat << endl;
    cout << "Q_mat: " << endl << Q_mat << endl;
    cout << "logqg2_mat: " << endl << logqg2 << endl;
    cout << "qg2rho_mat: " << endl << qg2rho << endl;
    cout << "pig1_mat: " << endl << pig1_mat << endl;
    */
    /*
    // In both functions:
    const int test_j = 1;
    const int test_i = 0;
    // Eigen Version:
    std::cout << "Eigen PI_mat(0,1): " << PI_mat(0, test_j) << std::endl;

      // In both versions:
    const int test_block = 1; // Second block (i=1)
    const int test_col = test_block * n*n + 0; // First column of second block
    const int test_row = 3;

    // Eigen
    std::cout << "Eigen PI(" << test_row << "," << test_col << "): "
              << PI_mat(test_row, test_col) << "\n";

    // Check D_mat(0, n*n) - first element of second block
    const int d_test_col = n*n;
    const int d_test_row = 5;

    // Eigen
    std::cout << "Eigen D(" << d_test_row << "," << d_test_col << "): "
              << D_mat(d_test_row, d_test_col) << "\n";

    // Check pig1_mat for column j=1, row i=0
    const int p_test_j = 3;
    const int p_test_i = 4;
    const int p_idx = p_test_j * sizeX + p_test_i;

    // Eigen
    std::cout << "Eigen pig1(" << p_test_i << "," << p_test_j << "): "
              << pig1_mat(p_test_i, p_test_j) << "\n";

    // Check contribution to `m` from column j=1
    const int m_test_j = 1;
    double m_contribution = 0.0;

    // Eigen
    Eigen::VectorXd pig1_col = pig1_mat.col(m_test_j);
    double eigen_sum_pig1 = (Q_mat.transpose() * pig1_col).sum();
    double eigen_temp = eigen_sum_pig1 * qg2rho[m_test_j];
    std::cout << "Eigen m contribution j=1: " << eigen_temp << "\n";

    // Check a high-D_mat value (e.g., j=256)
    const int ttest_j = 18;
    const int ttest_i = 20;
    const int idx = ttest_j * sizeX + ttest_i;

// Eigen
    std::cout << "Eigen pig1(" << ttest_i << "," << ttest_j << "): "
              << pig1_mat(ttest_i, ttest_j) << "\n";
    */
    return E0;
}

double E_0_co_vec(double r, double rho, double &grad_rho, double e0, int nn,
                  std::vector<double> hweights, std::vector<double> multhweights,
                  std::vector<double> roots,
                  const std::vector<double> &Q_mat,
                  const std::vector<double> &PI_mat,
                  const std::vector<double> &D_mat) {

    const int cols = n * n * sizeX;
    const double inv_1prho = 1.0 / (1.0 + rho);
    const double rho_over_1prho = rho * inv_1prho;

    // 1. Precompute logqg2 and qg2rho ------------------------------------------
    std::vector<double> logqg2(cols);
    std::vector<double> qg2rho(cols);

    for (int j = 0; j < cols; ++j) {
        double sum = 0.0;
        for (int i = 0; i < sizeX; ++i) {
            const int idx = j * sizeX + i;
            sum += Q_mat[i] * exp(-D_mat[idx] * inv_1prho);
        }
        logqg2[j] = log(sum);
        qg2rho[j] = exp(rho * logqg2[j]);
    }

    // 2. Precompute pig1_mat --------------------------------------------------
    std::vector<double> pig1_mat(sizeX * cols);
    for (int j = 0; j < cols; ++j) {
        for (int i = 0; i < sizeX; ++i) {
            const int idx = j * sizeX + i;
            // FIXED: Add parentheses around exponent argument
            pig1_mat[idx] = PI_mat[idx] * exp((rho / (1.0 + rho)) * D_mat[idx]);
        }
    }

    // 3. Compute m and mp -----------------------------------------------------
    double m = 0.0, term1_mp = 0.0, term2_mp = 0.0;

    for (int j = 0; j < cols; ++j) {
        double sum_pig1 = 0.0, sum_pig1_D = 0.0;

        for (int i = 0; i < sizeX; ++i) {
            const int idx = j * sizeX + i;
            const double Q_i = Q_mat[i];
            sum_pig1 += Q_i * pig1_mat[idx];
            sum_pig1_D += Q_i * pig1_mat[idx] * (-D_mat[idx]);
        }

        const double temp = sum_pig1 * qg2rho[j];
        m += temp;
        term1_mp += temp * logqg2[j];
        term2_mp += sum_pig1_D * qg2rho[j];
    }

    term2_mp *= inv_1prho;
    const double mp = term1_mp - term2_mp;


    // 4. Final calculations ---------------------------------------------------
    const double F0 = m / PI;
    const double Fder0 = mp / PI;
    grad_rho = -Fder0 / (std::log(2) * F0);
    e0 = -log2(F0);

    // DEBUG: Print same intermediates
    std::cout << "\n==== Vector Version ====\n";
    /*
    std::cout << "logqg2[0]: " << logqg2[0] << std::endl;
    std::cout << "qg2rho[0]: " << qg2rho[0] << std::endl;
    std::cout << "pig1_mat[0]: " << pig1_mat[0] << std::endl;
    */
    std::cout << "m: " << m << " | mp: " << mp << std::endl;
    std::cout << "F0: " << F0 << " | Fder0: " << Fder0 << std::endl;
    /*
    cout << "Q_mat:" << endl;
    for(int i = 0; i < Q_mat.size(); i++){ cout << Q_mat[i] << " "; }
    cout << endl;
    cout << "D_mat:" << endl;
    for(int i = 0; i < D_mat.size(); i++){ cout << D_mat[i] << " "; }
    cout << endl;
    cout << "PI_mat:" << endl;
    for(int i = 0; i < PI_mat.size(); i++){ cout << PI_mat[i] << " "; }
    cout << endl;
    cout << "logqg2_mat:" << endl;
    for(int i = 0; i < logqg2.size(); i++){ cout << logqg2[i] << " "; }
    cout << endl;

    cout << "qg2rho_mat:" << endl;
    for(int i = 0; i < qg2rho.size(); i++){ cout << qg2rho[i] << " "; }
    cout << endl;

    cout << "pig1_mat:" << endl;
    for(int i = 0; i < pig1_mat.size(); i++){ cout << pig1_mat[i] << " "; }
    cout << endl;
    */

/*
    const int test_idx = 1 * sizeX + 0;  // Column-major index for (row=0, col=1)
    std::cout << "Vector PI[1]: " << PI_mat[test_idx] << "\n";
    // In both versions:
    const int test_block = 1; // Second block (i=1)
    const int test_col = test_block * n*n + 0; // First column of second block
    const int test_row = 3;

    // Vector
    const int vec_idx = test_col * sizeX + test_row; // Column-major index
    std::cout << "Vector PI[" << vec_idx << "]: " << PI_mat[vec_idx] << "\n";

    // Check D_mat(0, n*n) - first element of second block
    const int d_test_col = n*n;
    const int d_test_row = 5;

    // Vector
    const int d_vec_idx = d_test_col * sizeX + d_test_row;
    std::cout << "Vector D[" << d_vec_idx << "]: " << D_mat[d_vec_idx] << "\n";

    // Check pig1_mat for column j=1, row i=0
    const int p_test_j = 3;
    const int p_test_i = 4;
    const int p_idx = p_test_j * sizeX + p_test_i;

    // Vector
    std::cout << "Vector pig1[" << p_idx << "]: " << pig1_mat[p_idx] << "\n";

    // Check contribution to `m` from column j=1
    const int m_test_j = 1;
    double m_contribution = 0.0;
    // Vector
    double vec_sum_pig1 = 0.0;
    for(int i = 0; i < sizeX; ++i) {
        const int idx = m_test_j * sizeX + i;
        vec_sum_pig1 += Q_mat[i] * pig1_mat[idx];
    }
    double vec_temp = vec_sum_pig1 * qg2rho[m_test_j];
    std::cout << "Vector m contribution j=1: " << vec_temp << "\n";

    // Check a high-D_mat value (e.g., j=256)
    const int ttest_j = 18;
    const int ttest_i = 20;
    const int idx = ttest_j * sizeX + ttest_i;

// Vector
    std::cout << "Vector pig1[" << idx << "]: " << pig1_mat[idx] << "\n";
    */
    return e0;
}

double E_0_co(double r, double rho, double &grad_rho, int n, vector<double> hweights, vector<double> multhweights,
              vector<double> roots) {
    // does not compute second der nor e0
    Eigen::VectorXd logqg2 = (Q_mat.transpose() * ((-1.0 / (1.0 + rho)) * D_mat.array()).exp().matrix()).array().log();
    Eigen::VectorXd qg2rho = (rho * logqg2.array()).exp();
    Eigen::MatrixXd pig1_mat = PI_mat.array() * ((rho / (1.0 + rho)) * D_mat.array()).exp();

    double m = (Q_mat.transpose() * pig1_mat * qg2rho).sum();
    double mp = (Q_mat.transpose() * pig1_mat * (qg2rho.array() * logqg2.array()).matrix()).sum()
                - (1.0 / (1.0 + rho)) *
                  (Q_mat.transpose() * (pig1_mat.array() * (-D_mat.array())).matrix() * qg2rho).sum();

    double F0 = m / PI;
    double Fder0 = mp / PI;

    grad_rho = -(Fder0) / (std::log(2) * F0);

    return 1; // todo change
}

inline void
gradient_f(complex<double> x, complex<double> y, vector<double> alphas, double rho, vector<double> &grads_alpha,
           double &grad_rho, int xindex) {

    auto start_XX = std::chrono::high_resolution_clock::now();

    for (int i = 0; i < sizeX; i++) { grads_alpha[i] = 0; }
    grad_rho = 0;

    double h = H(alphas[xindex], x, y, rho), GHQ;
    complex<double> x_hat_hat;

    int xcounter = 0;
    for (auto xhat: X) {
        GHQ = Q(xcounter) * (G(alphas[xcounter], xhat, y, rho) / h);

        for (int c = 0; c < sizeX; c++) { // last alpha not updated
            double aux = 0;
            x_hat_hat = X[c];

            if (xhat == x_hat_hat) {
                aux -= rho;
            }

            if (x == x_hat_hat) {
                aux -= 1;
            }

            grads_alpha[c] += GHQ * aux;
        }

        grad_rho += GHQ * (-alphas[xcounter]/* - 1/pow(1+rho,2)*log(W(y,xhat))+1/pow(1+rho,2)*log(W(y,x))*/);
        xcounter++;
    }
    auto stop_XX = std::chrono::high_resolution_clock::now();
    auto duration_XX = std::chrono::duration_cast<std::chrono::microseconds>(stop_XX - start_XX);
    gradient_f_times.push_back(duration_XX);
}

inline void
gradient_f_co(complex<double> x, complex<double> y, double r, double rho, double &grad_r, double &grad_rho) {

    auto start_XX = std::chrono::high_resolution_clock::now();

    grad_rho = 0;
    grad_r = 0;

    double h = H_co(r, x, y, rho), GHQ;
    int a = 0;
    for (auto xhat: X) {
        double g = G_co(r, xhat, y, rho);
        GHQ = Q(a) * (g / h);

        grad_rho += GHQ * (-r * cost(xhat)/*-1/((1+rho)*(1+rho)) * (loG_co(wyx) - loG_co(W(y,xhat)))*/);

        double c1 = cost(xhat);
        double c2 = cost(x);
        grad_r += GHQ * (-rho * c1 - c2);
        a++;
    }

    auto stop_XX = std::chrono::high_resolution_clock::now();
    auto duration_XX = std::chrono::duration_cast<std::chrono::microseconds>(stop_XX - start_XX);
    gradient_f_co_times.push_back(duration_XX);
}


double e02(int n) {

    auto start_XX = std::chrono::high_resolution_clock::now();

    double lhs = 0, rhs = 0, mylog, num_log, qx, wij;
    complex<double> y;
    int m = n;
    vector<double> roots = Hroots(n);
    vector<double> hweights = all_hweights[n];

    int xcounter = 0;
    for (auto x: X) {
        qx = Q(xcounter);
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < m; j++) {

                complex<double> root(roots[i], roots[j]); // wi + imag*wj;
                y = sqrt(SNR) * x + root;
                wij = hweights[j] * hweights[i]; //wi * wj

                num_log = 0;
                int a = 0;
                for (auto xhat: X) {
                    float q = Q(a);
                    double w = W(y, xhat);
                    num_log += q * w;
                    a++;
                }
                mylog = log2(num_log / W(y, x));

                rhs += qx * mylog * wij * 1 / PI;
                lhs += qx * mylog * mylog * wij * 1 / PI;
            }
        }
        xcounter++;
    }

    double out = (rhs * rhs - lhs) * log(2);

    auto stop_XX = std::chrono::high_resolution_clock::now();
    auto duration_XX = std::chrono::duration_cast<std::chrono::microseconds>(stop_XX - start_XX);
    e02_times.push_back(duration_XX);

    return out;
}

inline void gradient_e0(vector<double> alphas, double rho, vector<double> &grads_alpha, double &grad_rho, int my_n,
                        vector<double> hweights, vector<double> mult, vector<double> roots) { // TODO optimize
    // ---------------------------
    // | GRADIENT OF E_0 - rho*R |
    // ---------------------------

    auto start_XX = std::chrono::high_resolution_clock::now();

    double grad_f_rho;
    vector<double> grad_f_alphas(sizeX);
    double denominator = 0, numerator_rho = 0, hwij, hi, aa_f_a_rho;
    vector<double> numerator_alphas(sizeX);

    double Aa, f_a;
    complex<double> y;
    // fa
    for (int i = 0; i < my_n; i++) { //todo change multsize
        hi = hweights[i];
        for (int j = 0; j < my_n; j++) {
            hwij = hi * hweights[j];
            complex<double> root(roots[i], roots[j]);
            int xcounter = 0;
            for (auto x: X) {
                Aa = 1 / PI * Q(xcounter) * hwij;
                y = std::sqrt(SNR) * x + root;
                gradient_f(x, y, alphas, rho, grad_f_alphas, grad_f_rho,
                           xcounter); //para cada f(x,...) tenemos derivadas alpha(x_hat_hat)
                f_a = fa(x, y, alphas, rho, xcounter);
                denominator += Aa * std::pow(f_a, rho);
                numerator_rho += Aa * std::pow(f_a, rho) * (log(f_a) + rho * grad_f_rho / f_a);
                for (int c = 0; c < sizeX; c++) {
                    numerator_alphas[c] += Aa * rho * std::pow(f_a, rho - 1) * grad_f_alphas[c];
                }
                xcounter++;
            }
        }
    }
    grad_rho = -std::log2(eu) * numerator_rho / denominator - R;
    for (int c = 0; c < sizeX - 1; c++) { // last alpha not updated
        grads_alpha[c] = (-std::log2(eu) * numerator_alphas[c] / denominator) +
                         (-std::log2(eu) * numerator_alphas[sizeX - 1] / denominator) * (-Q(c) / Q(sizeX - 1));
    }


    auto stop_XX = std::chrono::high_resolution_clock::now();
    auto duration_XX = std::chrono::duration_cast<std::chrono::microseconds>(stop_XX - start_XX);
    gradient_e0_times.push_back(duration_XX);
}


inline void gradient_e0_co(double r, double rho, double &grad_r, double &grad_rho, int my_n, vector<double> hweights,
                           vector<double> mult, vector<double> roots) { // TODO optimize
    // ---------------------------
    // | GRADIENT OF E_0 - rho*R |
    // ---------------------------

    auto start_XX = std::chrono::high_resolution_clock::now();

    double grad_f_r, grad_f_rho;
    double numerator_r = 0, denominator = 0, numerator_rho = 0, hwij, hi, aa_f_a_rho;

    vector<chrono::microseconds> inner_times;

    double Aa, f_a;
    complex<double> y;
    // fa
    for (int i = 0; i < my_n; i++) { // todo change multsize
        hi = hweights[i];
        for (int j = 0; j < my_n; j++) {
            hwij = hi * hweights[j];
            complex<double> root(roots[i], roots[j]);
            int a = 0;
            for (auto x: X) {
                Aa = 1 / PI * Q(a) * hwij;
                y = std::sqrt(SNR) * x + root;

                auto start_inner = std::chrono::high_resolution_clock::now();

                gradient_f_co(x, y, r, rho, grad_f_r, grad_f_rho); //todo problems in the past
                f_a = fa_co(x, y, r, rho);

                auto stop_inner = std::chrono::high_resolution_clock::now();
                auto duration_inner = std::chrono::duration_cast<std::chrono::microseconds>(stop_inner - start_inner);

                inner_times.push_back(duration_inner);

                aa_f_a_rho = Aa * std::pow(f_a, rho);
                numerator_r += Aa * rho * std::pow(f_a, rho - 1) * grad_f_r;
                denominator += aa_f_a_rho;
                numerator_rho += aa_f_a_rho * (std::log(f_a) + rho * grad_f_rho / f_a);
                a++;
            }
        }
    }

    grad_r = -std::log2(eu) * numerator_r / denominator;
    grad_rho = -std::log2(eu) * numerator_rho / denominator - R;

    auto stop_XX = std::chrono::high_resolution_clock::now();
    auto duration_XX = std::chrono::duration_cast<std::chrono::microseconds>(stop_XX - start_XX);
    gradient_e0_co_times.push_back(duration_XX - sum_(inner_times));
}


inline vector<double> mult_newhweights(vector<double> hweights, int my_n) {
    // we only pick the most significant hweights, those inside the real-imaginary circle, and pairwise multiply and store them.

    auto start_XX = std::chrono::high_resolution_clock::now();

    sort(hweights.begin(), hweights.end());
    double boundary = hweights[my_n - 1] - hweights[0];
    double mult, hi;
    vector<double> newhweights;

    int multsize = 0;
    for (int i = 0; i < my_n; i++) {
        hi = hweights[i];
        for (int j = 0; j < my_n; j++) {
            mult = hi * hweights[j];
            if (mult <= boundary) {
                newhweights.push_back(mult);
                multsize++;
            }
        }
    }

    auto stop_XX = std::chrono::high_resolution_clock::now();
    auto duration_XX = std::chrono::duration_cast<std::chrono::microseconds>(stop_XX - start_XX);
    mult_newhweights_times.push_back(duration_XX);

    return newhweights;
}


void compute_hweights(int n, int num_iterations) {
    /*
     * PRECOMPUTES THE WEIGHTS, ROOTS AND THE MULTIPLICATION OF WEIGHTS
     */
    //initQ();
    auto start_XX = std::chrono::high_resolution_clock::now();

    if (DEBUG) {
        cout << endl;
        cout << setw(4) << left << "it";
        cout << setw(10) << left << "rho";
        cout << setw(10) << left << "r";
        cout << setw(13) << left << "-e0+rho*r";
        cout << setw(13) << left << "-d_rho";
        cout << setw(13) << left << "d_r";
        cout << setw(3) << left << "N";
        cout << endl;
    }

    int my_n;
    low = n; // todo temp

    my_n = n;
    all_hweights[my_n] = Hweights(my_n - 1);
    all_roots[my_n] = Hroots(my_n);
    all_multhweights[my_n] = mult_newhweights(all_hweights[my_n], my_n);

    /*
    double increment = (n-low)/num_iterations;

    int prev_n = -1;
    vector<double> hweights, roots, multhweights;
    double msum;

    for (int i = 0; i < num_iterations; ++i) {
        msum = 0;

        my_n = ceil(low + increment*i);
        if(my_n != prev_n){
            all_hweights[my_n]     = Hweights(my_n-1);
            all_roots[my_n]        = Hroots(my_n);
            all_multhweights[my_n] = mult_newhweights(all_hweights[my_n], my_n);
        }
        prev_n = my_n;
    }
     */
    auto stop_XX = std::chrono::high_resolution_clock::now();
    auto duration_XX = std::chrono::duration_cast<std::chrono::microseconds>(stop_XX - start_XX);
    compute_hweights_times.push_back(duration_XX);
}

// Gradient Descent of E0
double GD_ccomp(vector<double> &alphas, double &rho, double learning_rate, int num_iterations, int n) {
    //initQ();

    auto start_XX = std::chrono::high_resolution_clock::now();

    float error = 0.05;

    if (DEBUG) {
        cout << endl;
        cout << setw(4) << left << "it";
        cout << setw(10) << left << "rho";
        for (int c = 0; c < sizeX; c++) {
            cout << setw(10) << left << "alpha" + to_string(c + 1);
        }
        cout << setw(13) << left << "-e0+rho*r";
        cout << setw(13) << left << "-d_rho";
        for (int c = 0; c < sizeX; c++) {
            cout << setw(13) << left << "d_alpha" + to_string(c + 1);
        }
        cout << setw(3) << left << "N";
        cout << endl;
    }

    int my_n;

    double increment = (n - low) / num_iterations;

    int prev_n = -1;
    vector<double> hweights;
    vector<double> roots;
    vector<double> multhweights;
    double msum;
    /*
    if(DEBUG) {
        cout << "rho: " << rho << endl;
        for(auto x: alphas){
            cout << "alpha: " << x << " ";
        }
        cout << endl;
    }
    */

    double grad_rho = 0, grad_lambda;
    vector<double> grad_alphas(sizeX);

    for (int i = 0; i < num_iterations; ++i) {
        msum = 0;

        my_n = ceil(low + increment * i);

        // todo put out
        if (my_n != prev_n) {
            hweights = all_hweights[my_n];
            roots = all_roots[my_n];
            multhweights = all_multhweights[my_n];
        }

        prev_n = my_n;

        gradient_e0(alphas, rho, grad_alphas, grad_rho, my_n - 1, hweights, multhweights, roots);

        // update alphas
        for (int c = 0; c < sizeX - 1; c++) { // alphas from 0 to |X|-1
            alphas[c] += 0.1 * grad_alphas[c];
            msum += Q(c) * alphas[c];
        }
        alphas[sizeX - 1] = -1 / Q(sizeX - 1) * msum; // alpha(|X|)

        // update rho
        rho += learning_rate * grad_rho;
        if (rho <= 0) rho = 0.00000001; else if (rho >= 1) rho = 0.99999999; // todo revise

        bool alphasder = true;
        //if(i >= 1){
        for (int p = 0; p < sizeX - 2; p++) {
            if (grad_alphas[p] >= error || grad_alphas[p] <= -error) {
                alphasder = false;
                break;
            }
        }

        if (alphasder) {
            if (rho == 0.00000001 || rho == 0.99999999 || grad_rho <= error && grad_rho >= -error) {
                if (DEBUG) {
                    cout << endl;
                    double e0 = E_0(rho, alphas, n) - rho * R;
                    cout << endl;
                    cout << setw(4) << left << i;
                    cout << setw(10) << left << setprecision(6) << rho;
                    for (int c = 0; c < sizeX; c++) {
                        cout << setw(10) << left << setprecision(3) << alphas[c] << " ";
                    }
                    cout << setw(13) << left << setprecision(6) << e0;
                    cout << setw(13) << left << setprecision(6) << grad_rho;
                    for (int c = 0; c < sizeX; c++) {
                        cout << setw(13) << left << setprecision(3) << grad_alphas[c] << " ";
                    }
                    cout << setw(3) << left << my_n;
                    cout << " ";
                    cout << endl;
                }
                //qDebug() << i;
                return E_0(rho, alphas, n) - rho * R;
            }
        }

        //}
        if (DEBUG) {
            cout << endl;
            cout << setw(4) << left << i;
            cout << setw(10) << left << setprecision(6) << rho;
            for (int c = 0; c < sizeX; c++) {
                cout << setw(10) << left << setprecision(3) << alphas[c] << " ";
            }
            cout << setw(13) << left << setprecision(6) << E_0(rho, alphas, n) - rho * R;
            cout << setw(13) << left << setprecision(6) << grad_rho;
            for (int c = 0; c < sizeX; c++) {
                cout << setw(13) << left << setprecision(3) << grad_alphas[c] << " ";
            }
            cout << setw(3) << left << my_n;
            cout << " ";
            cout << endl;
            //qDebug() << num_iterations;
        }
    }
    double out = E_0(rho, alphas, n) - rho * R;

    auto stop_XX = std::chrono::high_resolution_clock::now();
    auto duration_XX = std::chrono::duration_cast<std::chrono::microseconds>(stop_XX - start_XX);
    GD_ccomp_times.push_back(duration_XX);
    //cout << num_iterations << endl;
    return out;
}

double initial_guess(double r, double E0_0, double E0_1, double E0_0_der, double E0_1_der, double &max_g) {
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

    std::vector<double> roots;

    // Solve quadratic equation: a_quad*rho^2 + b_quad*rho + c_quad = 0
    if (std::abs(a_quad) > 1e-10) { // Quadratic case
        const double discriminant = b_quad * b_quad - 4 * a_quad * c_quad;
        if (discriminant >= 0) {
            const double sqrt_disc = std::sqrt(discriminant);
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
        if (std::abs(b_quad) > 1e-10) {
            const double root = -c_quad / b_quad;
            if (root >= 0.0 && root <= 1.0) {
                roots.push_back(root);
            }
        }
    }

    // Collect candidate points: 0, 1, and valid roots
    std::vector<double> candidates = {0.0, 1.0};
    for (const double root: roots) {
        candidates.push_back(root);
    }

    // Evaluate G(rho) at all candidates and find the maximum
    max_g = -std::numeric_limits<double>::infinity();
    double best_rho = 0.0;

    for (const double rho: candidates) {
        const double g = a + b * rho + c * rho * rho + d * rho * rho * rho;
        if (g > max_g) {
            max_g = g;
            best_rho = rho;
        }
    }

    return best_rho;
}

// Convert Eigen matrix to column-major vector
std::vector<double> eigenToColumnMajor(const Eigen::MatrixXd &mat) {
    std::vector<double> vec(mat.size());
    for (int col = 0; col < mat.cols(); ++col) {
        for (int row = 0; row < mat.rows(); ++row) {
            vec[col * mat.rows() + row] = mat(row, col);
        }
    }
    return vec;
}

// Convert Eigen matrices to row-major vectors
std::vector<double> eigenToRowMajor(const Eigen::MatrixXd &mat) {
    std::vector<double> vec(mat.size());
    for (int row = 0; row < mat.rows(); ++row) {
        for (int col = 0; col < mat.cols(); ++col) {
            vec[row * mat.cols() + col] = mat(row, col);
        }
    }
    return vec;
}

double GD_co(double &r, double &rho, double &rho_interpolated, int num_iterations, int n, bool updateR, double error) {

    // Gradient Descent of E0
    auto start_XX = std::chrono::high_resolution_clock::now();
    is_db_connected = false;
    /* Database code commented out
    if(is_db_connected){
        try {
            std::cout << "Connected to MySQL database" << std::endl;

            // Insert data
            putItem(
                conn, tableName,
                "1999-10-10",   // date
                0.256,          // e0
                0.892,          // optimal_rho
                16,             // M
                "QAM",          // const_type
                25.5,           // snr
                0.75,           // r
                1000            // n
            );
            std::cout << "Data inserted successfully" << std::endl;

                // Retrieve data
                try {
                    ItemResult res = getItem(
                        conn, tableName,
                        16,         // M
                        "QAM",      // const_type
                        25.5,       // snr
                        0.75,       // r
                        1000        // n
                    );
                    std::cout << "Retrieved values: e0 = " << res.e0
                              << ", optimal_rho = " << res.optimal_rho << std::endl;
                }
            catch (const std::exception& e) {
                std::cerr << "Retrieval error: " << e.what() << std::endl;
            }
        }
        catch (const std::exception& e) {
            std::cerr << "Database error: " << e.what() << std::endl;
            return 1;
        }
    }
    */

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

    // Decide computation method once for entire optimization to prevent discontinuities
    // Check D_mat to see if we're in high SNR regime
    double max_D_check = D_mat.maxCoeff();
    double threshold_check = std::abs(-1.0 * max_D_check);  // Worst case at rho=0
    force_log_space_mode = (threshold_check > 650.0);  // Use 650 for safety margin (50 below overflow threshold)

    std::cout << "DEBUG GD_co: max_D=" << max_D_check << ", threshold=" << threshold_check
              << ", force_log_space=" << (force_log_space_mode ? "YES" : "NO") << "\n";

    if (force_log_space_mode) {
        std::cout << "INFO: Using log-space mode for entire optimization\n";
    }

    E_0_co(R, 0, grad_rho, e0);
    double E0_0 = e0, E0_prime_0 = grad_rho;

    E_0_co(R, 1, grad_rho, e0);
    double E0_1 = e0, E0_prime_1 = grad_rho;

    // Store mutual information and cutoff rate in global variables for external access
    g_mutual_information = E0_prime_0;  // I(X;Y) = E0'(0)
    g_cutoff_rate = E0_1;               // R0 = E0(1)

    double max_g;
    rho = initial_guess(R, E0_0, E0_1, E0_prime_0, E0_prime_1, max_g);
    //cout << "rho ig: " << rho << endl;

    rho_interpolated = rho;

    if (rho <= 0 || rho >= 1) {
        force_log_space_mode = false;  // Reset flag before early return
        return E_0_co(R, max(0.0, min(rho, 1.0)), grad_rho, e0) - max(0.0, min(rho, 1.0)) * R;
    }
    

    E_0_co(R, rho + 0.0000001, grad_rho, e0);
    double E0_prime_guess_plus = grad_rho;

    E_0_co(R, rho, grad_rho, e0);
    double E0_prime_guess = grad_rho;

    // si e0'(rho)-r és positiva del punt fins a 1, si és neg de 0 al punt
    /*
    double g_rho = grad_rho-r;

    if(g_rho <= 0){
        cout << "cas1" << endl;
        E_0_co(r, rho, grad_rho, e0);
        E0_prime_1 = grad_rho;
        //E0_second_prime_0 is at rho=0
    }
    else if(g_rho >= 0){
        cout << "cas2" << endl;
        E_0_co(r, rho, grad_rho, grad_2_rho,e0, my_n-1, hweights, multhweights, roots);
        E0_prime_0 = grad_rho;
        E0_second_prime_0 = grad_2_rho;
    }
    */

    //cout << "grad_2_guess: " << grad_2_guess << endl;

    double grad_2_guess = ((E0_prime_guess_plus - E0_prime_guess) / (0.0000001));
    double L = (-grad_2_guess);
    double learning_rate = 1 / L;

    // Safeguard: if learning rate is not finite or too large (indicates numerical issues),
    // fall back to a small fixed learning rate
    if (!std::isfinite(learning_rate) || std::abs(learning_rate) > 100.0) {
        std::cout << "WARNING: Learning rate " << learning_rate << " is invalid, using fallback 0.01\n";
        learning_rate = 0.01;
    }

    for (int i = 0; i < num_iterations; ++i) {
        //cout << "lr: " << fixed << setprecision(16) << learning_rate << endl;
        /*
        std::vector<double> Q_v(Q_mat.data(), Q_mat.data() + Q_mat.size());
        std::vector<double> PI_v(PI_mat.data(), PI_mat.data() + PI_mat.size());
        std::vector<double> D_v(D_mat.data(), D_mat.data() + D_mat.size());
        */
        /*
        std::vector<double> Q_v = eigenToColumnMajor(Q_mat);
        std::vector<double> PI_v = eigenToColumnMajor(PI_mat);
        std::vector<double> D_v = eigenToColumnMajor(D_mat);

        auto start_e0 = std::chrono::high_resolution_clock::now();
        E_0_co_vec(0.5, rho, grad_rho, e0, my_n-1, hweights, multhweights, roots, Q_v, PI_v, D_v);
        auto stop_e0 = std::chrono::high_resolution_clock::now();
        auto duration_e0 = std::chrono::duration_cast<std::chrono::microseconds>(stop_e0 - start_e0);
        cout << "duration_e0: " << duration_e0.count() << endl;
        */
        auto start_e0 = std::chrono::high_resolution_clock::now();
        E_0_co(R, rho, grad_rho, e0); // todo: 0.5
        auto stop_e0 = std::chrono::high_resolution_clock::now();
        auto duration_e0 = std::chrono::duration_cast<std::chrono::microseconds>(stop_e0 - start_e0);
        /* cout << "duration_e0: " << duration_e0.count() << endl; */

        grad_rho -= R;
        grad_rho = -grad_rho;
        grad_r = -grad_r;

        rho -= learning_rate * grad_rho;

        if (grad_rho <= error && grad_rho >= -error) {
            auto stop_XX = std::chrono::high_resolution_clock::now();
            auto duration_XX = std::chrono::duration_cast<std::chrono::microseconds>(stop_XX - start_XX);
            //NAG_co_times.push_back(duration_XX - sum_(inner_times));
            /* cout << "NAG duration: " << duration_XX.count() << endl; */
            rho = max(0.0, min(rho, 1.0)); // todo change
            force_log_space_mode = false;  // Reset flag before convergence return
            return e0 - rho * R;
        }
        cout << fixed << setprecision(17) << i << " " << rho << " " << e0 << " " << e0 - rho * R << " " << grad_rho
             << endl;
    }

    auto stop_XX = std::chrono::high_resolution_clock::now();
    auto duration_XX = std::chrono::duration_cast<std::chrono::microseconds>(stop_XX - start_XX);
    //GD_co_times.push_back(duration_XX - sum_(inner_times));
    cout << "GD duration: " << duration_XX.count() << endl;
    rho = max(0.0, min(rho, 1.0)); // todo change
    force_log_space_mode = false;  // Reset flag before max iterations return
    return e0 - rho * R;
}


// Newton's Method of E0

double NM_co(double &r, double &rho, int num_iterations, int n, bool updateR) {
    auto start_XX = std::chrono::high_resolution_clock::now();

    if (DEBUG) {
        for (int i = 0; i < 60; i++) cout << "/";
        cout << endl;
        cout << setw(4) << left << "it";
        cout << setw(10) << left << "rho";
        cout << setw(10) << left << "r";
        cout << setw(13) << left << "-e0+rho*r";
        cout << setw(13) << left << "-d_rho";
        cout << setw(13) << left << "-d_2_rho";
        cout << endl;
    }

    float error = 10E-10;

    int my_n;

    double increment = (n - low) / num_iterations;

    int prev_n = -1;
    vector<double> hweights;
    vector<double> roots;
    vector<double> multhweights;
    double e0;
    double grad_rho, grad_2_rho;
    double nextrho, auxrho = rho, nextauxrho;
    double nextr, auxr = rho, nextauxr;
    vms inner_times;

    // vector<double> rhos = {0,.1,.2,.3,.4,.5,.6,.7,.8,.9,1};

    double E0_0, E0_1;
    double E0_prime_0;
    double E0_prime_1;
    double E0_double_prime_0;
    double E0_double_prime_1;
    double E0_minus1;
    E_0_co(r, 0, grad_rho, grad_2_rho, e0, my_n - 1, hweights, multhweights, roots);
    E0_0 = e0;
    E0_prime_0 = grad_rho;
    E0_double_prime_0 = grad_2_rho;
    E_0_co(r, 1, grad_rho, grad_2_rho, e0, my_n - 1, hweights, multhweights, roots);
    E0_1 = e0;
    E0_prime_1 = grad_rho;
    E0_double_prime_1 = grad_2_rho;
    E_0_co(r, -0.999, grad_rho, grad_2_rho, e0, my_n - 1, hweights, multhweights, roots);
    E0_minus1 = e0;

    //cout << E0_minus1 << " " << E0_0 << " " << E0_1 << " " << E0_prime_0 << " " << E0_prime_1 << " " << E0_double_prime_0 << " " << E0_double_prime_1 << endl;
    cout << E0_double_prime_0 << " " << E0_double_prime_1 << endl;

    double max_g;
    rho = initial_guess(r, E0_0, E0_1, E0_prime_0, E0_prime_1, max_g);
    //cout << "rho ig: " << rho << endl;

    for (int i = 0; i < num_iterations; ++i) {

        my_n = ceil(low + increment * i);

        if (my_n != prev_n) {
            //free(&hweights); free(&roots); free(&multhweights);
            hweights = all_hweights[my_n];
            roots = all_roots[my_n];
            multhweights = all_multhweights[my_n];
        }

        prev_n = my_n;
        auto start_inner2 = std::chrono::high_resolution_clock::now();
        double auxrho = rho;

        if (true && i == -1) {
            /*
            E_0_co(r, 0, grad_rho, grad_2_rho, e0, my_n-1, hweights, multhweights, roots);
            double grad_rho_at_0 = grad_rho;
            cout << "e0: " << e0 << endl;
            cout << "e0-rho*R: " << e0-rho*r << endl;
            cout << "gr0: " << grad_rho_at_0 << endl;
            cout << "gr_2_0: " << grad_2_rho << endl;

            E_0_co(r, 1, grad_rho, grad_2_rho, e0, my_n-1, hweights, multhweights, roots);
            double grad_rho_at_1 = grad_rho;
            cout << "e0: " << e0 << endl;
            cout << "e0-rho*R: " << e0-rho*r << endl;
            cout << "gr1: " << grad_rho_at_1 << endl;
            cout << "gr_2_1: " << grad_2_rho << endl;
            */
            for (double auxrho = 0; auxrho <= 1; auxrho += 0.01) {
                E_0_co(r, auxrho, grad_rho, grad_2_rho, e0, my_n - 1, hweights, multhweights, roots);
                cout << auxrho << " " << e0 - auxrho * r << endl;
                //cout << "gr_2: " << grad_2_rho << endl;
            }
        }


        E_0_co(r, rho, grad_rho, grad_2_rho, e0, my_n - 1, hweights, multhweights, roots);
        grad_rho -= r; //todo: R


        auto stop_inner2 = std::chrono::high_resolution_clock::now();
        auto duration_inner2 = std::chrono::duration_cast<std::chrono::microseconds>(stop_inner2 - start_inner2);
        inner_times.push_back(duration_inner2);


        grad_rho = -grad_rho;
        grad_2_rho = -grad_2_rho;

        if (fabs(grad_2_rho) < 1e-9) {
            cout << "Second derivative near zero; exiting." << endl;
            break;
        }

        if (DEBUG && i == 0) {
            cout << setw(4) << left << 0;
            cout << setw(10) << left << rho;
            cout << setw(10) << left << r;
            cout << setw(13) << left << e0 - rho * r;
            cout << setw(13) << left << grad_rho;
            cout << setw(13) << left << grad_2_rho;
            cout << endl;
        }

        nextrho = rho - grad_rho / grad_2_rho;

        // todo change for debug/some tests
        /*
        if (nextrho <= 0) nextrho = 0;
        if (nextrho >= 1) nextrho = 1;
*/
        rho = nextrho;

        if (grad_rho <= error && grad_rho >= -error) {
            //if(fabs(grad_rho / grad_2_rho) <= error){
            auto stop_XX = std::chrono::high_resolution_clock::now();
            auto duration_XX = std::chrono::duration_cast<std::chrono::microseconds>(stop_XX - start_XX);
            //NAG_co_times.push_back(duration_XX - sum_(inner_times));
            if (DEBUG) {
                cout << setw(4) << left << i + 1;
                cout << setw(10) << left << rho;
                cout << setw(10) << left << r;
                cout << setw(13) << left << e0 - rho * r;
                cout << setw(13) << left << grad_rho;
                cout << setw(13) << left << grad_2_rho;
                cout << endl;
                for (int i = 0; i < 60; i++) cout << "/";
                cout << endl;
            }
            for (int i = 0; i < 60; i++) cout << "/";
            cout << endl;
            cout << "NM duration: " << duration_XX.count() << endl;
            for (int i = 0; i < 60; i++) cout << "/";
            cout << endl;
            return e0 - rho * r;
        }
        if (DEBUG) {
            cout << setw(4) << left << i + 1;
            cout << setw(10) << left << rho;
            cout << setw(10) << left << r;
            cout << setw(13) << left << e0 - rho * r;
            cout << setw(13) << left << grad_rho;
            cout << setw(13) << left << grad_2_rho;
            cout << endl;
        }
    }

    auto stop_XX = std::chrono::high_resolution_clock::now();
    auto duration_XX = std::chrono::duration_cast<std::chrono::microseconds>(stop_XX - start_XX);
    //GD_co_times.push_back(duration_XX - sum_(inner_times));
    cout << "NM duration: " << duration_XX.count() << endl;
    return e0 - rho * R;

}


double GD_iid(double &r, double &rho, double &rho_interploated, int num_iterations, int n, double error) {
    auto start_NAG_iid = std::chrono::high_resolution_clock::now();
    //cout << endl << "cooking" << endl;
    double out = GD_co(r, rho, rho_interploated, num_iterations, n, false, error);

    auto stop_NAG_iid = std::chrono::high_resolution_clock::now();
    auto duration_NAG_iid = std::chrono::duration_cast<std::chrono::microseconds>(stop_NAG_iid - start_NAG_iid);
    NAG_iid_times.push_back(chrono::microseconds(0));

    return out;
}


/*
double GD_cc(double& r, double& rho, double learning_rate, int num_iterations, int n){
    auto start_XX = std::chrono::high_resolution_clock::now();

    double out = GD_co(r, rho, learning_rate, num_iterations, n, true);

    auto stop_XX = std::chrono::high_resolution_clock::now();
    auto duration_XX = std::chrono::duration_cast<std::chrono::microseconds>(stop_XX - start_XX);
    GD_cc_times.push_back(duration_XX);

    return out;
}
*/
void NAG_update(double &x_t, double &y_t, double &x_tp1, double &y_tp1, double beta, double grad, double kaux) {
    // updates the approximation using Nesterov Accelerated Gradient

    y_tp1 = x_t - beta * grad;
    x_tp1 = (1 + kaux) * y_tp1 - kaux * y_t;

    x_t = x_tp1;
    y_t = y_tp1;
}

double NAG(vector<double> &alphas, double &rho, int num_iterations, double beta, double k, int n) {

    auto start_NAG = std::chrono::high_resolution_clock::now();

    double kaux = ((sqrt(k) - 1) / (sqrt(k) + 1));
    vector<double> x_t_r = alphas, y_t_r = alphas, y_tp1_r(sizeX), x_tp1_r(sizeX);
    double x_t_rho = rho, y_t_rho = rho, y_tp1_rho, x_tp1_rho;
    double grad_rho;
    vector<double> grads_alpha(sizeX);
    if (DEBUG) cout << "it |  rho   |  r  |-e0+rho*r| -grad_rho| -grad_r" << endl;

    int my_n = n;
    double increment = (n - low) / num_iterations;

    int prev_n = -1;
    vector<double> hweights;
    vector<double> roots;
    vector<double> multhweights;

    for (int i = 0; i < num_iterations; ++i) {

        my_n = ceil(low + increment * i);

        if (my_n != prev_n) {
            hweights = all_hweights[my_n];
            roots = all_roots[my_n];
            multhweights = all_multhweights[my_n];
        }

        prev_n = my_n;

        //grad_rho was nan in gradient_e0()
        gradient_e0(x_t_r, x_t_rho, grads_alpha, grad_rho, my_n - 1, hweights, multhweights, roots);
        for (int c = 0; c < sizeX; c++) grads_alpha[c] = -grads_alpha[c];
        grad_rho = -grad_rho;

        for (int c = 0; c < sizeX; c++)
            NAG_update(x_t_r[c], y_t_r[c], x_tp1_r[c], y_tp1_r[c], beta, grads_alpha[c], kaux);
        NAG_update(x_t_rho, y_t_rho, x_tp1_rho, y_tp1_rho, beta, grad_rho, kaux);

        if (DEBUG) {
            cout << fixed << setprecision(6) << i << " " << x_t_rho;
            for (int c = 0; c < sizeX; c++) cout << " " << x_t_r[c] << " ";
            cout << E_0(x_t_rho, x_t_r, n) - x_t_rho * R << " " << -grad_rho << " ";
            for (int c = 0; c < sizeX; c++) cout << " " << -grads_alpha[c] << " ";
            cout << endl;
        }
    }
    double out = E_0(x_t_rho, x_t_r, n) - x_t_rho * R;

    auto stop_NAG = std::chrono::high_resolution_clock::now();
    auto duration_NAG = std::chrono::duration_cast<std::chrono::microseconds>(stop_NAG - start_NAG);
    NAG_times.push_back(duration_NAG);

    return out;
}

double NAG_co(double &r, double &rho, double learning_rate, int num_iterations, int n, double k, bool updateR) {

    auto start_XX = std::chrono::high_resolution_clock::now();

    if (DEBUG) cout << "it |  rho   |  r  |-e0+rho*r| -grad_rho| -grad_r" << endl;

    //float error = 0.00000000001;
    float error = 0.0000001;

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


    E_0_co(r, 0, grad_rho, e0);
    double E0_0 = e0;
    double E0_prime_0 = grad_rho;

    //cout << "der2_0: " << E0_prime_0 << endl;

    E_0_co(r, 1, grad_rho, e0);
    double E0_1 = e0;
    double E0_prime_1 = grad_rho;

    // Store mutual information and cutoff rate in global variables for external access
    g_mutual_information = E0_prime_0;  // I(X;Y) = E0'(0)
    g_cutoff_rate = E0_1;               // R0 = E0(1)

    //if(E0_prime_1 )
    double max_g;
    rho = initial_guess(r, E0_0, E0_1, E0_prime_0, E0_prime_1, max_g);
    //cout << "rho ig: " << rho << endl;

    E_0_co(r, rho + 0.0000001, grad_rho, e0);
    double E0_prime_guess_plus = grad_rho;

    E_0_co(r, rho, grad_rho, e0);
    double E0_prime_guess = grad_rho;

    // si e0'(rho)-r és positiva del punt fins a 1, si és neg de 0 al punt
    /*
    double g_rho = grad_rho-r;

    if(g_rho <= 0){
        cout << "cas1" << endl;
        E_0_co(r, rho, grad_rho, e0);
        E0_prime_1 = grad_rho;
        //E0_second_prime_0 is at rho=0
    }
    else if(g_rho >= 0){
        cout << "cas2" << endl;
        E_0_co(r, rho, grad_rho, grad_2_rho,e0, my_n-1, hweights, multhweights, roots);
        E0_prime_0 = grad_rho;
        E0_second_prime_0 = grad_2_rho;
    }
    */

    //cout << "grad_2_guess: " << grad_2_guess << endl;

    //double L = ();

    double grad_2_guess = ((E0_prime_guess_plus - E0_prime_guess) / (0.0000001));
    double L = (-grad_2_guess);
    learning_rate = 1 / L;
    k = 1; // L/(-grad_2_guess);

    cout << "k: " << k << endl;
    double kaux = ((sqrt(k) - 1) / (sqrt(k) + 1));
    cout << "lr: " << learning_rate << endl;


    for (int i = 0; i < num_iterations; ++i) {
        cout << "lr: " << fixed << setprecision(16) << learning_rate << endl;
        /*
        my_n = ceil(low + increment*i);

        if(my_n != prev_n){
            //free(&hweights); free(&roots); free(&multhweights);
            hweights = all_hweights[my_n];
            roots = all_roots[my_n];
            multhweights = all_multhweights[my_n];
        }

        prev_n = my_n;
         */

        auto start_inner2 = std::chrono::high_resolution_clock::now();
        // gradient_e0_co(r, rho, grad_r, grad_rho, my_n-1, hweights, multhweights, roots);

        // cout << "gr: " << grad_rho << endl;
        //cout << "rho: " << rho << endl;

        //rho = rhos[i];
        E_0_co(0.5, rho, grad_rho, e0);
        grad_rho -= R;
        //cout << "gr_new: " << grad_rho << endl;

        //cout << "rho: " << rho << endl;

        //rho = rhos[i];
        //gradient_e0_co(0, rho, grad_r, grad_rho, my_n-1, hweights, multhweights, roots);

        //cout << "gr_old: " << grad_rho << endl;
        //cout << "rho: " << rho << endl;

        auto stop_inner2 = std::chrono::high_resolution_clock::now();
        auto duration_inner2 = std::chrono::duration_cast<std::chrono::microseconds>(stop_inner2 - start_inner2);
        inner_times.push_back(duration_inner2);


        grad_rho = -grad_rho;
        grad_r = -grad_r;


        if (updateR) { NAG_update(r, auxr, nextr, nextauxr, learning_rate, grad_r, kaux); }
        else { r = 0; }
        //else r = 0.000001;
        //cout << "lr:" << learning_rate << endl;

        NAG_update(rho, auxrho, nextrho, nextauxrho, learning_rate, grad_rho, kaux);
        //if (rho <= 0) rho = 0.00000001; else if (rho >= 1) rho = 0.99999999;
        //rho += grad_rho;
        if (rho <= -1) rho = -1;
        if (rho >= 2) rho = 2;

        /*
        //if(!updateR || grad_r <= error && grad_r >= -error){
            if(rho == 0.00000001 || rho == 0.99999999 || grad_rho <= error && grad_rho >= -error){
                //cout << rho << " " << grad_rho << " " << grad_r << " " << endl;
                //cout << i << endl;
                return e0 - rho*R;
            }
        //}
        */
        /*if(DEBUG) */

        if (grad_rho <= error && grad_rho >= -error) {
            auto stop_XX = std::chrono::high_resolution_clock::now();
            auto duration_XX = std::chrono::duration_cast<std::chrono::microseconds>(stop_XX - start_XX);
            //NAG_co_times.push_back(duration_XX - sum_(inner_times));
            /* cout << "NAG duration: " << duration_XX.count() << endl; */
            return e0 - rho * R;
        }
        cout << fixed << setprecision(17) << i << " " << rho << " " << e0 << " " << e0 - rho * R << " " << grad_rho
             << endl;
    }
    //cout << rho << " " << grad_rho << " " << grad_r << " " << endl;
    //cout << num_iterations << endl;

    auto stop_XX = std::chrono::high_resolution_clock::now();
    auto duration_XX = std::chrono::duration_cast<std::chrono::microseconds>(stop_XX - start_XX);
    //NAG_co_times.push_back(duration_XX - sum_(inner_times));
    /* cout << "NAG duration: " << duration_XX.count() << endl; */
    return e0 - rho * R;
}

double NAG_iid(double &r, double &rho, double learning_rate, int num_iterations, int n, double k) {
    auto start_NAG_iid = std::chrono::high_resolution_clock::now();
    //cout << endl << "cooking" << endl;
    double out = NAG_co(r, rho, learning_rate, num_iterations, n, k, false);

    auto stop_NAG_iid = std::chrono::high_resolution_clock::now();
    auto duration_NAG_iid = std::chrono::duration_cast<std::chrono::microseconds>(stop_NAG_iid - start_NAG_iid);
    NAG_iid_times.push_back(chrono::microseconds(0));

    return out;
}

double NAG_cc(double &r, double &rho, double learning_rate, int num_iterations, int n, double k) {
    auto start_NAG_cc = std::chrono::high_resolution_clock::now();

    double out = NAG_co(r, rho, learning_rate, num_iterations, n, k, true);

    auto stop_NAG_cc = std::chrono::high_resolution_clock::now();
    auto duration_NAG_cc = std::chrono::duration_cast<std::chrono::microseconds>(stop_NAG_cc - start_NAG_cc);
    NAG_cc_times.push_back(duration_NAG_cc);

    return out;
}

// Getter functions for mutual information and cutoff rate
// These values are computed during GD_co/GD_iid and stored in global variables
double getMutualInformation() {
    return g_mutual_information;
}

double getCutoffRate() {
    return g_cutoff_rate;
}

#endif //TFG_FUNCTIONS_H