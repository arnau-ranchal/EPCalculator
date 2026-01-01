#include <iostream>
#include <iomanip>
#include <cmath>

using namespace std;

/**
 * Recommends minimum N (number of quadrature nodes) for given parameters
 *
 * Based on empirical convergence study showing:
 * - SNR ≤ 30 dB: N=15 sufficient
 * - SNR = 40 dB: N=20 needed
 * - SNR ≥ 50 dB: N=35+ needed
 *
 * @param SNR_dB Signal-to-noise ratio in dB
 * @param precision Desired relative precision (e.g., 1e-6)
 * @return Recommended minimum N
 */
int recommend_N(double SNR_dB, double precision = 1e-6) {
    // Conservative recommendations based on empirical study

    if (SNR_dB < 35.0) {
        // Low to medium SNR: N=15 provides excellent accuracy
        if (precision <= 1e-6) {
            return 15;
        } else if (precision <= 1e-8) {
            // For very high precision at low SNR, N=20 may be needed
            return (SNR_dB < 15.0) ? 20 : 15;
        }
        return 15;
    }
    else if (SNR_dB < 45.0) {
        // Medium-high SNR: N=20 recommended
        return 20;
    }
    else if (SNR_dB < 70.0) {
        // High SNR: N=35 required for numerical stability
        return 35;
    }
    else {
        // Very high SNR: N=40 for safety
        return 40;
    }
}

/**
 * Provides detailed recommendation with reasoning
 */
struct NRecommendation {
    int recommended_N;
    double expected_error;
    string reasoning;
    int min_safe_N;
    int optimal_N;
};

NRecommendation get_N_recommendation(double SNR_dB, double precision = 1e-6) {
    NRecommendation rec;

    if (SNR_dB < 35.0) {
        rec.recommended_N = 15;
        rec.min_safe_N = 15;
        rec.optimal_N = 15;
        rec.expected_error = 1e-9;
        rec.reasoning = "Low SNR: minimal N provides excellent accuracy";
    }
    else if (SNR_dB < 45.0) {
        rec.recommended_N = 20;
        rec.min_safe_N = 20;
        rec.optimal_N = 20;
        rec.expected_error = 1e-10;
        rec.reasoning = "Medium-high SNR: N=20 required for stability";
    }
    else if (SNR_dB < 70.0) {
        rec.recommended_N = 35;
        rec.min_safe_N = 35;
        rec.optimal_N = 35;
        rec.expected_error = 1e-13;
        rec.reasoning = "High SNR: N=35+ essential (N<35 causes failure)";
    }
    else {
        rec.recommended_N = 40;
        rec.min_safe_N = 35;
        rec.optimal_N = 40;
        rec.expected_error = 1e-13;
        rec.reasoning = "Very high SNR: N=40 for maximum safety";
    }

    // Adjust for extremely high precision requirements
    if (precision < 1e-10 && rec.recommended_N < 40) {
        rec.recommended_N = min(40, rec.recommended_N + 5);
        rec.reasoning += " (increased for ultra-high precision)";
    }

    return rec;
}

int main(int argc, char* argv[]) {
    // Default values
    double SNR = 20.0;
    double precision = 1e-6;

    // Parse command line
    if (argc > 1) SNR = atof(argv[1]);
    if (argc > 2) precision = atof(argv[2]);

    cout << "=========================================================" << endl;
    cout << "        N (Quadrature Nodes) Recommendation" << endl;
    cout << "=========================================================" << endl;
    cout << endl;

    cout << "Input Parameters:" << endl;
    cout << "  SNR: " << SNR << " dB" << endl;
    cout << "  Desired Precision: " << scientific << setprecision(0) << precision << endl;
    cout << endl;

    NRecommendation rec = get_N_recommendation(SNR, precision);

    cout << "Recommendation:" << endl;
    cout << "  Recommended N: " << rec.recommended_N << endl;
    cout << "  Minimum Safe N: " << rec.min_safe_N << endl;
    cout << "  Optimal N: " << rec.optimal_N << endl;
    cout << "  Expected Error: " << scientific << setprecision(2) << rec.expected_error << endl;
    cout << endl;

    cout << "Reasoning:" << endl;
    cout << "  " << rec.reasoning << endl;
    cout << endl;

    // Show alternatives
    cout << "Valid N values: 15, 20, 25, 30, 35, 40, 100, 200" << endl;
    cout << "Note: N=99, 101, 300, 500 cause numerical issues" << endl;
    cout << endl;

    // Performance estimate
    double estimated_time_ms;
    if (rec.recommended_N <= 15) estimated_time_ms = 10;
    else if (rec.recommended_N <= 20) estimated_time_ms = 25;
    else if (rec.recommended_N <= 30) estimated_time_ms = 35;
    else if (rec.recommended_N <= 35) estimated_time_ms = 50;
    else if (rec.recommended_N <= 40) estimated_time_ms = 65;
    else if (rec.recommended_N <= 100) estimated_time_ms = 380;
    else estimated_time_ms = 1550;

    cout << "Estimated Computation Time: ~" << fixed << setprecision(0)
         << estimated_time_ms << " ms" << endl;
    cout << endl;

    cout << "=========================================================" << endl;
    cout << "For full convergence analysis, use:" << endl;
    cout << "  ./convergence_analysis 2 PAM " << SNR << " 0.5" << endl;
    cout << "=========================================================" << endl;

    return 0;
}
