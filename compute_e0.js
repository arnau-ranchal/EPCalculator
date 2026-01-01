// Direct computation of E_0_co for SNR=2 and 4-PAM
import { cppCalculator as epCalculator } from './src/services/cpp-exact.js'

async function computeE0() {
  try {
    console.log('Computing E_0 for ρ=0.423, SNR=4 and 4-PAM...')
    console.log('Parameters:')
    console.log('  M = 4 (4-PAM)')
    console.log('  SNR = 4 (linear)')
    console.log('  R = 0 (for E_0)')
    console.log('  ρ = 0.423 (fixed rho value)')
    console.log('  n = 100 (code length)')
    console.log('  N = 20 (quadrature points)')
    console.log('  threshold = 1e-6')
    console.log('  distribution = uniform')
    console.log('')

    // Parameters: M, typeModulation, SNR, R, N, n, threshold, distribution, shaping_param
    const M = 4
    const typeModulation = 'PAM'
    const SNR = 4  // Linear SNR
    const R = 0    // R=0 for E_0
    const N = 20
    const n = 100
    const threshold = 1e-6
    const distribution = 'uniform'
    const shaping_param = 0

    const startTime = Date.now()
    const result = epCalculator.compute(M, typeModulation, SNR, R, N, n, threshold, distribution, shaping_param)
    const endTime = Date.now()

    console.log('Results:')
    console.log('========')
    console.log(`E_0 (Error Exponent at R=0): ${result.error_exponent}`)
    console.log(`Optimal ρ (from optimization): ${result.optimal_rho}`)
    console.log(`Error Probability: ${result.error_probability}`)
    console.log('')
    console.log(`Computation time: ${(endTime - startTime).toFixed(2)} ms`)
    console.log('')
    console.log('Note: The above result uses the optimal ρ found by the optimizer.')
    console.log('To compute E_0 at a specific ρ=0.423, we need direct access to the E_0 function.')

    process.exit(0)
  } catch (error) {
    console.error('Computation error:', error)
    process.exit(1)
  }
}

computeE0()
