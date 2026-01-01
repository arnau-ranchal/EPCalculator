// Test simple case: 4-PAM, SNR=1, rho=0.5, N=5
#include <iostream>
#include <iomanip>

extern void setX(int npoints, std::string xmode);
extern void setQ(std::string distribution, double shaping_param);
extern void normalizeX_for_Q();
extern void compute_hweights(int n, int num_iterations);
extern void setPI();
extern void setW();
extern double E_0_co(double r, double rho, double &grad_rho, double &E0);
extern void setN(int n_val);

extern double SNR;
extern double R;

int main() {
    std::cout << std::fixed << std::setprecision(10);

    const int M = 4;
    const std::string constellation = "PAM";
    const double SNR_linear = 1.0;
    const double rho = 0.5;
    const double R_val = 0.5;
    const int N = 5;

    SNR = SNR_linear;
    R = R_val;

    std::cout << "Testing: " << M << "-" << constellation
              << ", SNR=" << SNR_linear
              << ", ρ=" << rho
              << ", N=" << N << "\n\n";

    setX(M, constellation);
    setQ("uniform", 0.0);
    normalizeX_for_Q();

    setN(N);
    compute_hweights(N, 1);
    setPI();
    setW();

    double E0, grad_rho;
    E0 = E_0_co(R_val, rho, grad_rho, E0);

    std::cout << "\nE₀ = " << E0 << "\n";

    return 0;
}
