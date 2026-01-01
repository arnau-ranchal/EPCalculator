#include <emscripten.h>
#include <emscripten/bind.h>
#include <vector>
#include <string>
#include <memory>

// Forward declarations
extern "C" {
    float* exponents_wasm(float M, const char* typeM, float SNR, float R, float N, float n, float threshold, float* results);
}

class EPCalculator {
public:
    struct ComputationResult {
        double error_probability;
        double error_exponent;
        double optimal_rho;
        bool success;
        std::string error_message;
    };

    static ComputationResult compute(
        double M,
        const std::string& typeModulation,
        double SNR,
        double R,
        double N,
        double n,
        double threshold
    ) {
        ComputationResult result;
        result.success = false;

        try {
            // Validate inputs
            if (M < 2 || M > 64) {
                result.error_message = "M must be between 2 and 64";
                return result;
            }

            if (typeModulation != "PAM" && typeModulation != "PSK" && typeModulation != "QAM") {
                result.error_message = "typeModulation must be PAM, PSK, or QAM";
                return result;
            }

            if (SNR < 0) {
                result.error_message = "SNR must be non-negative";
                return result;
            }

            if (R < 0 || R > 1) {
                result.error_message = "Rate R must be between 0 and 1";
                return result;
            }

            if (N < 2 || N > 40) {
                result.error_message = "N must be between 2 and 40";
                return result;
            }

            if (n < 1 || n > 1000000) {
                result.error_message = "n must be between 1 and 1000000";
                return result;
            }

            if (threshold < 1e-15 || threshold > 0.1) {
                result.error_message = "threshold must be between 1e-15 and 0.1";
                return result;
            }

            // Allocate result array
            float results[3];

            // Call the computation function
            float* computed = exponents_wasm(
                static_cast<float>(M),
                typeModulation.c_str(),
                static_cast<float>(SNR),
                static_cast<float>(R),
                static_cast<float>(N),
                static_cast<float>(n),
                static_cast<float>(threshold),
                results
            );

            if (computed != nullptr) {
                result.error_probability = static_cast<double>(computed[0]);
                result.error_exponent = static_cast<double>(computed[1]);
                result.optimal_rho = static_cast<double>(computed[2]);
                result.success = true;
            } else {
                result.error_message = "Computation failed";
            }

        } catch (const std::exception& e) {
            result.error_message = std::string("Exception: ") + e.what();
        } catch (...) {
            result.error_message = "Unknown error occurred";
        }

        return result;
    }

    // Batch computation for plotting
    static std::vector<ComputationResult> computeBatch(
        const std::vector<double>& M_values,
        const std::vector<std::string>& typeModulation_values,
        const std::vector<double>& SNR_values,
        const std::vector<double>& R_values,
        const std::vector<double>& N_values,
        const std::vector<double>& n_values,
        const std::vector<double>& threshold_values
    ) {
        std::vector<ComputationResult> results;

        // Find the maximum size among all arrays
        size_t max_size = std::max({
            M_values.size(),
            typeModulation_values.size(),
            SNR_values.size(),
            R_values.size(),
            N_values.size(),
            n_values.size(),
            threshold_values.size()
        });

        results.reserve(max_size);

        for (size_t i = 0; i < max_size; ++i) {
            // Use the value at index i, or the last available value if the array is shorter
            double M = M_values.empty() ? 2.0 : M_values[std::min(i, M_values.size() - 1)];
            std::string typeModulation = typeModulation_values.empty() ? "PAM" :
                typeModulation_values[std::min(i, typeModulation_values.size() - 1)];
            double SNR = SNR_values.empty() ? 5.0 : SNR_values[std::min(i, SNR_values.size() - 1)];
            double R = R_values.empty() ? 0.5 : R_values[std::min(i, R_values.size() - 1)];
            double N = N_values.empty() ? 20.0 : N_values[std::min(i, N_values.size() - 1)];
            double n = n_values.empty() ? 128.0 : n_values[std::min(i, n_values.size() - 1)];
            double threshold = threshold_values.empty() ? 1e-6 : threshold_values[std::min(i, threshold_values.size() - 1)];

            results.push_back(compute(M, typeModulation, SNR, R, N, n, threshold));
        }

        return results;
    }
};

// Emscripten bindings
EMSCRIPTEN_BINDINGS(epcalculator_module) {
    emscripten::value_object<EPCalculator::ComputationResult>("ComputationResult")
        .field("error_probability", &EPCalculator::ComputationResult::error_probability)
        .field("error_exponent", &EPCalculator::ComputationResult::error_exponent)
        .field("optimal_rho", &EPCalculator::ComputationResult::optimal_rho)
        .field("success", &EPCalculator::ComputationResult::success)
        .field("error_message", &EPCalculator::ComputationResult::error_message);

    emscripten::class_<EPCalculator>("EPCalculator")
        .class_function("compute", &EPCalculator::compute)
        .class_function("computeBatch", &EPCalculator::computeBatch);

    emscripten::register_vector<double>("VectorDouble");
    emscripten::register_vector<std::string>("VectorString");
    emscripten::register_vector<EPCalculator::ComputationResult>("VectorComputationResult");
}