#include <iostream>
#include <iomanip>
#include <cmath>
#include "exponents/functions.h"

int main() {
    int M = 2;
    std::string typeModulation = "PAM";
    double SNR = 0.9;
    double R = 0.0;
    int N = 20;
    int n = 100;
    double threshold = 1e-6;
    std::string distribution = "uniform";
    double shaping_param = 0.0;
    
    std::cout << std::fixed << std::setprecision(10);
    std::cout << "Computing E(R) for 2-PAM with SNR=" << SNR << ", R=" << R << std::endl;
    std::cout << std::endl;
    
    double error_exponent = error_exponent_GD(M, typeModulation, SNR, R, N, n, threshold, distribution, shaping_param);
    double optimal_rho = optimal_rho_GD(M, typeModulation, SNR, R, N, threshold, distribution, shaping_param);
    double error_probability = std::exp(-n * error_exponent);
    
    std::cout << "Results:" << std::endl;
    std::cout << "  Error Exponent E(R): " << error_exponent << std::endl;
    std::cout << "  Optimal rho:         " << optimal_rho << std::endl;
    std::cout << "  Error Probability:   " << error_probability << std::endl;
    
    return 0;
}
