#!/usr/bin/env python3
"""
Comprehensive comparison harness for Old vs New EPCalculator implementations

This script systematically tests both implementations with identical parameters
and provides detailed analysis of the differences in accuracy and performance.
"""

import ctypes
import json
import subprocess
import time
import os
from typing import Dict, List, Tuple, Optional
import sys
from dataclasses import dataclass
from pathlib import Path

@dataclass
class TestResult:
    """Results from a single test case"""
    error_probability: float
    error_exponent: float
    optimal_rho: float
    computation_time: float
    success: bool
    error_message: Optional[str] = None

@dataclass
class TestCase:
    """A single test case with parameters"""
    M: int
    modType: str
    SNR: float
    R: float
    N: int = 15
    n: int = 128
    threshold: float = 1e-6

    def __str__(self):
        return f"M={self.M}, {self.modType}, SNR={self.SNR}dB, R={self.R}"

class OldImplementationTester:
    """Interface to test the old C++ implementation"""

    def __init__(self, lib_path: str = "EPCalculatorOld/EPCalculatorOld/build/libfunctions.so"):
        self.lib_path = lib_path
        self.lib = None
        self._setup_library()

    def _setup_library(self):
        """Load and configure the old C++ library"""
        if not os.path.exists(self.lib_path):
            raise FileNotFoundError(f"Old implementation library not found: {self.lib_path}")

        self.lib = ctypes.CDLL(self.lib_path)

        # Set up function signature
        self.lib.exponents.argtypes = [
            ctypes.c_float,     # M
            ctypes.c_char_p,    # typeM
            ctypes.c_float,     # SNR
            ctypes.c_float,     # R
            ctypes.c_float,     # N
            ctypes.c_float,     # n
            ctypes.c_float,     # threshold
            ctypes.POINTER(ctypes.c_float)  # results buffer
        ]
        self.lib.exponents.restype = ctypes.POINTER(ctypes.c_float)

    def test(self, test_case: TestCase) -> TestResult:
        """Run a single test case with the old implementation"""
        try:
            start_time = time.time()

            # Prepare result buffer
            result_buffer = (ctypes.c_float * 3)()

            # Call the function
            self.lib.exponents(
                ctypes.c_float(test_case.M),
                test_case.modType.encode('utf-8'),
                ctypes.c_float(test_case.SNR),
                ctypes.c_float(test_case.R),
                ctypes.c_float(test_case.N),
                ctypes.c_float(test_case.n),
                ctypes.c_float(test_case.threshold),
                result_buffer
            )

            computation_time = time.time() - start_time

            return TestResult(
                error_probability=float(result_buffer[0]),
                error_exponent=float(result_buffer[1]),
                optimal_rho=float(result_buffer[2]),
                computation_time=computation_time,
                success=True
            )

        except Exception as e:
            return TestResult(
                error_probability=0.0,
                error_exponent=0.0,
                optimal_rho=0.0,
                computation_time=0.0,
                success=False,
                error_message=str(e)
            )

class NewImplementationTester:
    """Interface to test the new JavaScript implementation"""

    def __init__(self):
        # Create a temporary Node.js script for testing
        self.temp_script = self._create_test_script()

    def _create_test_script(self) -> str:
        """Create a temporary Node.js script for testing individual cases"""
        script_content = '''
import { epCalculator } from './src/services/wasm-fallback.js';

// Get parameters from command line arguments
const args = process.argv.slice(2);
if (args.length !== 7) {
    console.error('Usage: node script.js M modType SNR R N n threshold');
    process.exit(1);
}

const [M, modType, SNR, R, N, n, threshold] = args;

try {
    const startTime = Date.now();

    const result = epCalculator.compute(
        parseInt(M),
        modType,
        parseFloat(SNR),
        parseFloat(R),
        parseInt(N),
        parseInt(n),
        parseFloat(threshold)
    );

    const endTime = Date.now();
    const computationTime = (endTime - startTime) / 1000.0;

    // Output results as JSON
    const output = {
        error_probability: result.error_probability,
        error_exponent: result.error_exponent,
        optimal_rho: result.optimal_rho,
        computation_time: computationTime,
        success: true
    };

    console.log(JSON.stringify(output));

} catch (error) {
    const output = {
        error_probability: 0.0,
        error_exponent: 0.0,
        optimal_rho: 0.0,
        computation_time: 0.0,
        success: false,
        error_message: error.message
    };

    console.log(JSON.stringify(output));
}
'''

        script_path = 'temp_new_test.js'
        with open(script_path, 'w') as f:
            f.write(script_content)

        return script_path

    def test(self, test_case: TestCase) -> TestResult:
        """Run a single test case with the new implementation"""
        try:
            cmd = [
                'node', self.temp_script,
                str(test_case.M), test_case.modType, str(test_case.SNR), str(test_case.R),
                str(test_case.N), str(test_case.n), str(test_case.threshold)
            ]

            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)

            if result.returncode != 0:
                return TestResult(
                    error_probability=0.0,
                    error_exponent=0.0,
                    optimal_rho=0.0,
                    computation_time=0.0,
                    success=False,
                    error_message=f"Process failed: {result.stderr}"
                )

            # Parse JSON output
            output_data = json.loads(result.stdout.strip())

            return TestResult(
                error_probability=output_data['error_probability'],
                error_exponent=output_data['error_exponent'],
                optimal_rho=output_data['optimal_rho'],
                computation_time=output_data['computation_time'],
                success=output_data['success'],
                error_message=output_data.get('error_message')
            )

        except Exception as e:
            return TestResult(
                error_probability=0.0,
                error_exponent=0.0,
                optimal_rho=0.0,
                computation_time=0.0,
                success=False,
                error_message=str(e)
            )

    def cleanup(self):
        """Clean up temporary files"""
        if os.path.exists(self.temp_script):
            os.remove(self.temp_script)

class ComparisonHarness:
    """Main comparison harness"""

    def __init__(self):
        self.old_tester = OldImplementationTester()
        self.new_tester = NewImplementationTester()
        self.results = []

    def define_test_cases(self) -> List[TestCase]:
        """Define comprehensive test cases covering various scenarios"""
        test_cases = []

        # Basic test cases with different modulations and SNRs
        modulations = [
            (2, 'PAM'),   # BPSK-equivalent
            (4, 'PAM'),   # 4-PAM
            (8, 'PAM'),   # 8-PAM
            (4, 'PSK'),   # QPSK
            (8, 'PSK'),   # 8-PSK
            (16, 'QAM'),  # 16-QAM
        ]

        snr_values = [0, 5, 10, 15, 20]  # dB
        rate_values = [0.1, 0.3, 0.5, 0.7, 0.9]

        # Create comprehensive test matrix (subset for initial testing)
        for M, modType in modulations:
            for snr in [5, 10, 15]:  # Reduced set for initial testing
                for rate in [0.3, 0.5, 0.7]:  # Reduced set
                    test_cases.append(TestCase(
                        M=M, modType=modType, SNR=snr, R=rate
                    ))

        return test_cases[:10]  # Limit to first 10 cases for initial testing

    def run_comparison(self, test_cases: List[TestCase]) -> List[Dict]:
        """Run comparison tests for all test cases"""
        results = []

        print(f"🚀 Running comparison tests for {len(test_cases)} test cases...")
        print("=" * 80)

        for i, test_case in enumerate(test_cases, 1):
            print(f"\\n🧪 Test Case {i}/{len(test_cases)}: {test_case}")

            # Test old implementation
            print("   📊 Testing old implementation...", end="")
            old_result = self.old_tester.test(test_case)
            if old_result.success:
                print(f" ✅ E0={old_result.error_exponent:.4f}, ρ={old_result.optimal_rho:.4f}")
            else:
                print(f" ❌ Failed: {old_result.error_message}")

            # Test new implementation
            print("   📊 Testing new implementation...", end="")
            new_result = self.new_tester.test(test_case)
            if new_result.success:
                print(f" ✅ E0={new_result.error_exponent:.4f}, ρ={new_result.optimal_rho:.4f}")
            else:
                print(f" ❌ Failed: {new_result.error_message}")

            # Calculate differences
            if old_result.success and new_result.success:
                e0_diff = abs(old_result.error_exponent - new_result.error_exponent)
                rho_diff = abs(old_result.optimal_rho - new_result.optimal_rho)
                e0_rel_diff = e0_diff / max(old_result.error_exponent, 1e-10) * 100

                print(f"   📈 Differences: ΔE0={e0_diff:.4f} ({e0_rel_diff:.1f}%), Δρ={rho_diff:.4f}")

            # Store results
            result_entry = {
                'test_case': test_case.__dict__,
                'old_result': old_result.__dict__,
                'new_result': new_result.__dict__,
                'timestamp': time.time()
            }

            results.append(result_entry)

        return results

    def analyze_results(self, results: List[Dict]):
        """Analyze and summarize the comparison results"""
        print("\\n" + "=" * 80)
        print("📊 COMPARISON ANALYSIS")
        print("=" * 80)

        successful_comparisons = []
        for result in results:
            if result['old_result']['success'] and result['new_result']['success']:
                successful_comparisons.append(result)

        if not successful_comparisons:
            print("❌ No successful comparisons to analyze!")
            return

        print(f"✅ Successful comparisons: {len(successful_comparisons)}/{len(results)}")

        # Calculate statistics
        e0_diffs = []
        rho_diffs = []
        e0_rel_diffs = []

        for result in successful_comparisons:
            old = result['old_result']
            new = result['new_result']

            e0_diff = abs(old['error_exponent'] - new['error_exponent'])
            rho_diff = abs(old['optimal_rho'] - new['optimal_rho'])
            e0_rel_diff = e0_diff / max(old['error_exponent'], 1e-10) * 100

            e0_diffs.append(e0_diff)
            rho_diffs.append(rho_diff)
            e0_rel_diffs.append(e0_rel_diff)

        print(f"\\n📈 Error Exponent (E0) Differences:")
        print(f"   Mean absolute difference: {sum(e0_diffs)/len(e0_diffs):.4f}")
        print(f"   Maximum difference: {max(e0_diffs):.4f}")
        print(f"   Mean relative difference: {sum(e0_rel_diffs)/len(e0_rel_diffs):.1f}%")

        print(f"\\n📈 Optimal Rho (ρ) Differences:")
        print(f"   Mean absolute difference: {sum(rho_diffs)/len(rho_diffs):.4f}")
        print(f"   Maximum difference: {max(rho_diffs):.4f}")

        # Find cases with largest differences
        max_e0_idx = e0_rel_diffs.index(max(e0_rel_diffs))
        worst_case = successful_comparisons[max_e0_idx]

        print(f"\\n🔍 Case with largest E0 difference ({max(e0_rel_diffs):.1f}%):")
        tc = worst_case['test_case']
        print(f"   Parameters: M={tc['M']}, {tc['modType']}, SNR={tc['SNR']}dB, R={tc['R']}")
        print(f"   Old: E0={worst_case['old_result']['error_exponent']:.4f}, ρ={worst_case['old_result']['optimal_rho']:.4f}")
        print(f"   New: E0={worst_case['new_result']['error_exponent']:.4f}, ρ={worst_case['new_result']['optimal_rho']:.4f}")

    def save_results(self, results: List[Dict], filename: str = "comparison_results.json"):
        """Save detailed results to JSON file"""
        with open(filename, 'w') as f:
            json.dump(results, f, indent=2)
        print(f"\\n💾 Detailed results saved to: {filename}")

    def cleanup(self):
        """Clean up resources"""
        self.new_tester.cleanup()

def main():
    """Main execution function"""
    print("🔬 EPCalculator Implementation Comparison")
    print("=" * 80)

    try:
        harness = ComparisonHarness()

        # Define test cases
        test_cases = harness.define_test_cases()

        # Run comparisons
        results = harness.run_comparison(test_cases)

        # Analyze results
        harness.analyze_results(results)

        # Save results
        harness.save_results(results)

        print("\\n🎉 Comparison completed successfully!")

    except Exception as e:
        print(f"\\n💥 Error during comparison: {e}")
        import traceback
        traceback.print_exc()

    finally:
        if 'harness' in locals():
            harness.cleanup()

if __name__ == "__main__":
    main()