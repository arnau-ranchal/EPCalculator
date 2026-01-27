/**
 * Child Process Worker for C++ FFI computations
 *
 * This runs as a separate PROCESS (not thread) via child_process.fork()
 * Each process has its own address space, so the C++ library's global state
 * is completely isolated from other workers.
 *
 * Uses process.on('message') / process.send() for IPC communication.
 */
import ffi from 'ffi-napi'
import ref from 'ref-napi'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Define types for FFI
const DoubleArray = ref.refType(ref.types.double)

// Load the C++ library (each process gets its own isolated copy)
const libPath = path.join(__dirname, '../../build/libfunctions.so')

let cppLib = null

try {
  cppLib = ffi.Library(libPath, {
    'exponents': [DoubleArray, [
      'double',       // M
      'string',       // typeM
      'double',       // SNR
      'double',       // R
      'double',       // N
      'double',       // n
      'double',       // threshold
      'string',       // distribution type
      'double',       // shaping_param (beta)
      DoubleArray     // results (output array)
    ]],
    'exponents_custom': [DoubleArray, [
      DoubleArray,    // real_parts
      DoubleArray,    // imag_parts
      DoubleArray,    // probabilities
      'int',          // num_points
      'double',       // SNR
      'double',       // R
      'double',       // N
      'double',       // n
      'double',       // threshold
      DoubleArray     // results (output array)
    ]]
  })
  console.log(`[Process ${process.pid}] C++ library loaded successfully`)
} catch (error) {
  console.error(`[Process ${process.pid}] Failed to load C++ library: ${error.message}`)
  process.exit(1)
}

/**
 * Extract results from the output buffer
 */
function extractResults(results) {
  const Pe = results.readDoubleLE(0)
  let errorExponent = results.readDoubleLE(8)
  const optimalRho = results.readDoubleLE(16)
  const mutualInformation = results.readDoubleLE(24)
  const cutoffRate = results.readDoubleLE(32)
  const criticalRate = results.readDoubleLE(40)

  // Check for error marker (-1.0 indicates overflow/numerical error)
  if (errorExponent < -0.5) {
    throw new Error('Numerical overflow detected in C++ computation')
  }

  // Clamp very small negative values to 0 (floating point precision issues)
  if (errorExponent < 0 && errorExponent > -0.5) {
    errorExponent = 0.0
  }

  // Validate results
  if (isNaN(Pe) || isNaN(errorExponent) || isNaN(optimalRho)) {
    throw new Error('C++ computation returned invalid values (NaN)')
  }

  if (!isFinite(Pe) || !isFinite(errorExponent) || !isFinite(optimalRho)) {
    throw new Error('C++ computation returned infinite values')
  }

  return {
    error_probability: Pe,
    error_exponent: errorExponent,
    optimal_rho: optimalRho,
    mutual_information: mutualInformation,
    cutoff_rate: cutoffRate,
    critical_rate: criticalRate
  }
}

/**
 * Handle standard modulation computation
 */
function computeStandard(params) {
  const [M, typeM, SNR, R, N, n, threshold, distribution, shaping_param] = params

  // Allocate output buffer (6 doubles = 48 bytes)
  const results = Buffer.alloc(6 * ref.types.double.size)

  const resultPtr = cppLib.exponents(
    M,
    typeM,
    SNR,
    R,
    N,
    n,
    threshold,
    distribution,
    shaping_param,
    results
  )

  if (resultPtr.isNull()) {
    throw new Error('C++ computation returned null pointer')
  }

  return extractResults(results)
}

/**
 * Handle custom constellation computation
 */
function computeCustom(params) {
  const [realPartsData, imagPartsData, probabilitiesData, numPoints, SNR, R, N, n, threshold] = params

  // Convert arrays back to Buffers if they were serialized
  const realParts = Buffer.isBuffer(realPartsData) ? realPartsData : Buffer.from(realPartsData)
  const imagParts = Buffer.isBuffer(imagPartsData) ? imagPartsData : Buffer.from(imagPartsData)
  const probabilities = Buffer.isBuffer(probabilitiesData) ? probabilitiesData : Buffer.from(probabilitiesData)

  // Allocate output buffer
  const results = Buffer.alloc(6 * ref.types.double.size)

  const resultPtr = cppLib.exponents_custom(
    realParts,
    imagParts,
    probabilities,
    numPoints,
    SNR,
    R,
    N,
    n,
    threshold,
    results
  )

  if (resultPtr.isNull()) {
    throw new Error('C++ custom computation returned null pointer')
  }

  return extractResults(results)
}

// Listen for computation tasks from the parent process via IPC
process.on('message', (task) => {
  const { id, type, params } = task

  try {
    let data

    if (type === 'compute') {
      data = computeStandard(params)
    } else if (type === 'compute_custom') {
      data = computeCustom(params)
    } else {
      throw new Error(`Unknown task type: ${type}`)
    }

    // Send result back to parent via IPC
    process.send({ id, success: true, data })
  } catch (error) {
    process.send({ id, success: false, error: error.message })
  }
})

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log(`[Process ${process.pid}] Received SIGTERM, exiting gracefully`)
  process.exit(0)
})

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error(`[Process ${process.pid}] Uncaught exception:`, error)
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  console.error(`[Process ${process.pid}] Unhandled rejection:`, reason)
  process.exit(1)
})

// Signal ready
console.log(`[Process ${process.pid}] Worker ready`)
