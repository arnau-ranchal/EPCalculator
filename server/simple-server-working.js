// Simplified server for testing purposes (JavaScript version)
import Fastify from 'fastify'
import cors from '@fastify/cors'
import staticFiles from '@fastify/static'
import path from 'path'
import { fileURLToPath } from 'url'
import { cppCalculator as epCalculator } from '../src/services/cpp-exact.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ============================================================
// Validation Helper Functions
// ============================================================

/**
 * Validate custom constellation points
 * Returns { valid: boolean, error?: string }
 */
function validateCustomConstellation(points) {
  if (!points || !Array.isArray(points)) {
    return { valid: false, error: 'Custom constellation points must be an array' }
  }
  if (points.length === 0) {
    return { valid: false, error: 'Custom constellation must have at least one point' }
  }
  for (let i = 0; i < points.length; i++) {
    const p = points[i]
    if (typeof p.real !== 'number' || typeof p.imag !== 'number' || typeof p.prob !== 'number') {
      return { valid: false, error: `Point ${i} is missing required fields (real, imag, prob)` }
    }
    if (isNaN(p.real) || isNaN(p.imag) || isNaN(p.prob)) {
      return { valid: false, error: `Point ${i} has NaN values` }
    }
    if (p.prob < 0) {
      return { valid: false, error: `Point ${i} has negative probability` }
    }
  }
  // Check total probability sums to approximately 1
  const totalProb = points.reduce((sum, p) => sum + p.prob, 0)
  if (Math.abs(totalProb - 1.0) > 0.01) {
    return { valid: false, error: `Probabilities sum to ${totalProb.toFixed(4)}, should be 1.0` }
  }
  return { valid: true }
}

// ============================================================
// Mutual Information and Cutoff Rate Computation Functions
// ============================================================

/**
 * Generate constellation points for standard modulations
 */
function generateConstellation(M, typeModulation) {
  const points = []

  if (typeModulation === 'PAM') {
    // M-PAM: points at -(M-1), -(M-3), ..., (M-3), (M-1), normalized
    for (let i = 0; i < M; i++) {
      points.push({ real: 2 * i - (M - 1), imag: 0 })
    }
  } else if (typeModulation === 'PSK') {
    // M-PSK: points on unit circle
    for (let i = 0; i < M; i++) {
      const angle = (2 * Math.PI * i) / M
      points.push({ real: Math.cos(angle), imag: Math.sin(angle) })
    }
  } else if (typeModulation === 'QAM') {
    // Square M-QAM
    const sqrtM = Math.sqrt(M)
    for (let i = 0; i < sqrtM; i++) {
      for (let j = 0; j < sqrtM; j++) {
        points.push({
          real: 2 * i - (sqrtM - 1),
          imag: 2 * j - (sqrtM - 1)
        })
      }
    }
  }

  // Normalize to unit average energy
  const avgEnergy = points.reduce((sum, p) => sum + p.real * p.real + p.imag * p.imag, 0) / points.length
  const scale = Math.sqrt(avgEnergy)
  if (scale > 0) {
    points.forEach(p => {
      p.real /= scale
      p.imag /= scale
    })
  }

  return points
}

/**
 * Gauss-Hermite quadrature nodes and weights (N=20)
 */
const gaussHermite = {
  nodes: [
    -5.3874809, -4.6036824, -3.9447640, -3.3478546, -2.7888061,
    -2.2549740, -1.7385377, -1.2340762, -0.7374737, -0.2453407,
     0.2453407,  0.7374737,  1.2340762,  1.7385377,  2.2549740,
     2.7888061,  3.3478546,  3.9447640,  4.6036824,  5.3874809
  ],
  weights: [
    2.229393646e-13, 4.399340992e-10, 1.086069371e-07, 7.802556479e-06, 2.283386360e-04,
    3.243773342e-03, 2.481052089e-02, 1.090172061e-01, 2.866755053e-01, 4.622436697e-01,
    4.622436697e-01, 2.866755053e-01, 1.090172061e-01, 2.481052089e-02, 3.243773342e-03,
    2.283386360e-04, 7.802556479e-06, 1.086069371e-07, 4.399340992e-10, 2.229393646e-13
  ]
}

/**
 * Compute mutual information I(X;Y) for discrete constellation over AWGN channel
 * I(X;Y) = log₂(M) - (1/M) Σᵢ E_n[ log₂(Σⱼ exp(-|xᵢ-xⱼ+n|²/N₀ + |n|²/N₀)) ]
 * where n ~ N(0, N₀/2) per dimension
 */
function computeMutualInformation(M, typeModulation, SNR) {
  const constellation = generateConstellation(M, typeModulation)
  const numPoints = constellation.length

  // Noise variance: N₀/2 per dimension, where SNR = E_s/N₀
  // For unit energy constellation, E_s = 1, so N₀ = 1/SNR
  const N0 = 1.0 / SNR
  const sigma = Math.sqrt(N0 / 2)  // Standard deviation per dimension

  // Uniform input distribution
  const Q = 1.0 / numPoints

  let mutualInfo = 0

  // For each transmitted symbol xᵢ
  for (let i = 0; i < numPoints; i++) {
    const xi = constellation[i]

    // Use Gauss-Hermite quadrature for 2D integration (real and imag noise)
    let innerSum = 0

    for (let nr = 0; nr < gaussHermite.nodes.length; nr++) {
      for (let ni = 0; ni < gaussHermite.nodes.length; ni++) {
        // Noise samples (scaled from standard Hermite)
        const noiseReal = sigma * Math.sqrt(2) * gaussHermite.nodes[nr]
        const noiseImag = sigma * Math.sqrt(2) * gaussHermite.nodes[ni]

        // Received signal y = xᵢ + n
        const yReal = xi.real + noiseReal
        const yImag = xi.imag + noiseImag

        // Compute log(Σⱼ exp(-|y-xⱼ|²/N₀)) using log-sum-exp for stability
        let maxExp = -Infinity
        const expArgs = []

        for (let j = 0; j < numPoints; j++) {
          const xj = constellation[j]
          const diffReal = yReal - xj.real
          const diffImag = yImag - xj.imag
          const distSq = diffReal * diffReal + diffImag * diffImag
          const expArg = -distSq / N0
          expArgs.push(expArg)
          if (expArg > maxExp) maxExp = expArg
        }

        // Log-sum-exp: log(Σ exp(aⱼ)) = max(aⱼ) + log(Σ exp(aⱼ - max))
        let sumExp = 0
        for (let j = 0; j < numPoints; j++) {
          sumExp += Math.exp(expArgs[j] - maxExp)
        }
        const logSumExp = maxExp + Math.log(sumExp)

        // The term for this noise sample: -|y-xᵢ|²/N₀ - log(Σⱼ exp(-|y-xⱼ|²/N₀))
        // = expArgs[i] - logSumExp (but we already computed |y-xᵢ|² as noiseReal² + noiseImag²)
        const distSqI = noiseReal * noiseReal + noiseImag * noiseImag
        const term = -distSqI / N0 - logSumExp

        // Weight from Gauss-Hermite (already includes 1/π factor for 2D)
        const weight = gaussHermite.weights[nr] * gaussHermite.weights[ni] / Math.PI
        innerSum += weight * term
      }
    }

    mutualInfo += Q * innerSum
  }

  // Convert from nats to bits
  mutualInfo = mutualInfo / Math.log(2)

  // I(X;Y) = H(X) - H(X|Y) = log₂(M) + E[log₂(P(X|Y))]
  // The above computed E[log(P(Y|X)/P(Y))] which equals I(X;Y)
  // Add log₂(M) and take care of signs
  mutualInfo = Math.log2(numPoints) + mutualInfo

  // Clamp to valid range [0, log₂(M)]
  return Math.max(0, Math.min(Math.log2(numPoints), mutualInfo))
}

/**
 * Compute cutoff rate R₀ (Bhattacharyya parameter) for discrete constellation over AWGN
 * R₀ = -log₂(Σᵢⱼ Qᵢ Qⱼ exp(-|xᵢ-xⱼ|²/(4N₀)))
 * This is the rate above which random coding error exponent becomes 0
 */
function computeCutoffRate(M, typeModulation, SNR) {
  const constellation = generateConstellation(M, typeModulation)
  const numPoints = constellation.length

  // N₀ = 1/SNR for unit energy constellation
  const N0 = 1.0 / SNR

  // Uniform distribution
  const Q = 1.0 / numPoints

  // Compute Bhattacharyya sum: Σᵢⱼ Qᵢ Qⱼ exp(-|xᵢ-xⱼ|²/(4N₀))
  let bhattSum = 0

  for (let i = 0; i < numPoints; i++) {
    for (let j = 0; j < numPoints; j++) {
      const diffReal = constellation[i].real - constellation[j].real
      const diffImag = constellation[i].imag - constellation[j].imag
      const distSq = diffReal * diffReal + diffImag * diffImag
      bhattSum += Q * Q * Math.exp(-distSq / (4 * N0))
    }
  }

  // R₀ = -log₂(bhattSum)
  const R0 = -Math.log2(bhattSum)

  // Clamp to valid range [0, log₂(M)]
  return Math.max(0, Math.min(Math.log2(numPoints), R0))
}

// Create Fastify instance
const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    }
  }
})

// Enable CORS
fastify.register(cors, {
  origin: true
})

// Register static file serving for the frontend (built by Vite to public/)
const frontendPath = path.join(__dirname, '..', 'public')

fastify.register(staticFiles, {
  root: frontendPath,
  prefix: '/',
  setHeaders: (res, path) => {
    // Disable caching for development
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
  }
})

fastify.log.info(`Serving frontend from: ${frontendPath}`)

// Health check endpoint
fastify.get('/api/health', async (request, reply) => {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    uptime: process.uptime()
  }
})

// Enhanced computation endpoint with real EPCalculator algorithms
fastify.post('/api/compute', async (request, reply) => {
  try {
    const body = request.body

    const startTime = Date.now()
    let result

    // Check if custom constellation is provided
    if (body.customConstellation && Array.isArray(body.customConstellation.points)) {
      // Custom constellation computation
      const points = body.customConstellation.points

      // Validate custom constellation
      const validation = validateCustomConstellation(points)
      if (!validation.valid) {
        reply.status(400)
        return {
          error: 'Invalid Custom Constellation',
          message: validation.error,
          statusCode: 400
        }
      }

      const SNR = parseFloat(body.SNR ?? '5.0')
      const R = parseFloat(body.R ?? '0.5')
      const N = parseFloat(body.N ?? '15')
      const n = parseFloat(body.n ?? '128')
      const threshold = parseFloat(body.threshold ?? '1e-6')

      result = epCalculator.computeCustom(points, SNR, R, N, n, threshold)

      const computationTime = Date.now() - startTime

      return {
        error_probability: result.error_probability,
        error_exponent: result.error_exponent,
        optimal_rho: result.optimal_rho,
        mutual_information: result.mutual_information,
        cutoff_rate: result.cutoff_rate,
        critical_rate: result.critical_rate,
        computation_time_ms: computationTime,
        cached: false,
        parameters: {
          customConstellation: true,
          numPoints: points.length,
          SNR, R, N, n, threshold
        }
      }
    } else {
      // Standard modulation computation
      const M = parseFloat(body.M ?? '2')
      const typeModulation = body.typeModulation ?? 'PAM'
      const SNR = parseFloat(body.SNR ?? '5.0')
      const R = parseFloat(body.R ?? '0.5')
      const N = parseFloat(body.N ?? '15')
      const n = parseFloat(body.n ?? '128')
      const threshold = parseFloat(body.threshold ?? '1e-6')
      const distribution = body.distribution ?? 'uniform'
      const shaping_param = parseFloat(body.shaping_param ?? '0.0')

      result = epCalculator.compute(M, typeModulation, SNR, R, N, n, threshold, distribution, shaping_param)

      const computationTime = Date.now() - startTime

      return {
        error_probability: result.error_probability,
        error_exponent: result.error_exponent,
        optimal_rho: result.optimal_rho,
        mutual_information: result.mutual_information,
        cutoff_rate: result.cutoff_rate,
        critical_rate: result.critical_rate,
        computation_time_ms: computationTime,
        cached: false,
        parameters: {
          M, typeModulation, SNR, R, N, n, threshold, distribution, shaping_param
        }
      }
    }
  } catch (error) {
    fastify.log.error('Computation error:', error)
    reply.status(500)
    return {
      error: 'Computation Failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      statusCode: 500
    }
  }
})

// Legacy endpoint for compatibility with original EPCalculator interface
fastify.get('/api/exponents', async (request, reply) => {
  try {
    const query = request.query

    const M = parseFloat(query.M || '2')
    const typeM = query.typeM || 'PAM'
    const SNR = parseFloat(query.SNR || '1.0')
    const R = parseFloat(query.R || '0.5')
    const N = parseFloat(query.N || '15')
    const n = parseFloat(query.n || '128')
    const threshold = parseFloat(query.threshold || '1e-6')

    // Use real EPCalculator computation
    const result = epCalculator.compute(M, typeM, SNR, R, N, n, threshold)

    // Return in original format for compatibility
    return {
      'Probabilidad de error': result.error_probability,
      'error_exponent': result.error_exponent,
      'rho óptima': result.optimal_rho
    }
  } catch (error) {
    fastify.log.error('Legacy computation error:', error)
    return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
})

// Plot endpoints for generating data arrays
fastify.post('/api/plot', async (request, reply) => {
  try {
    const body = request.body

    // Extract parameters
    const yVar = body.y || 'error_probability'
    const xVar = body.x || 'n'
    const xRange = body.rang_x || [1, 100]
    const points = parseInt(body.points || '50')

    // Fixed parameters from simulation
    const M = parseFloat(body.M || '16')
    const typeM = body.typeM || 'PAM'
    const SNR = parseFloat(body.SNR || '7')
    const R = parseFloat(body.R || '0.5')
    const N = parseFloat(body.N || '20')
    const n = parseFloat(body.n || '100')
    const threshold = parseFloat(body.th || '1e-6')

    // Check if using custom constellation
    const isCustomConstellation = typeM === 'Custom' && body.customConstellation && Array.isArray(body.customConstellation.points)
    const customPoints = isCustomConstellation ? body.customConstellation.points : null

    // Validate custom constellation if being used
    if (isCustomConstellation) {
      const validation = validateCustomConstellation(customPoints)
      if (!validation.valid) {
        reply.status(400)
        return {
          error: 'Invalid Custom Constellation',
          message: validation.error,
          statusCode: 400
        }
      }
    }

    // Generate data points
    const xValues = []
    const yValues = []

    const xMin = parseFloat(xRange[0])
    const xMax = parseFloat(xRange[1])

    for (let i = 0; i < points; i++) {
      let xVal, snrLinear

      if (xVar === 'SNR') {
        // SNR handling based on unit
        const snrUnit = body.snrUnit || 'dB'

        if (snrUnit === 'dB') {
          // dB unit: user entered range in dB, generate LINEARLY-spaced dB values
          // then convert to linear SNR for computation (which creates log-spaced linear values)
          const dbMin = xMin
          const dbMax = xMax
          const dbStep = points === 1 ? 0 : (dbMax - dbMin) / (points - 1)
          const dbValue = dbMin + (i * dbStep)  // Linear spacing in dB
          // Convert dB to linear: SNR_linear = 10^(SNR_dB / 10)
          snrLinear = Math.pow(10, dbValue / 10)
        } else {
          // linear unit: user entered range in linear, generate linearly-spaced LINEAR SNR values
          const step = points === 1 ? 0 : (xMax - xMin) / (points - 1)
          snrLinear = xMin + (i * step)
        }
        xVal = snrLinear  // Always return linear SNR value
      } else {
        // For all other variables: linear spacing
        const step = points === 1 ? 0 : (xMax - xMin) / (points - 1)
        xVal = xMin + (i * step)
      }

      xValues.push(xVal)

      // Create parameters object with variable x parameter
      const distribution = body.distribution || 'uniform'
      const shaping_param = parseFloat(body.shaping_param || '0.0')
      let params = { M, typeModulation: typeM, SNR, R, N, n, threshold, distribution, shaping_param }

      // Map the frontend variable names to backend parameter names
      if (xVar === 'SNR') {
        params['SNR'] = snrLinear  // Always use linear SNR for computation
      } else {
        params[xVar] = xVal
      }

      // Compute for this parameter set
      let result
      if (isCustomConstellation && customPoints) {
        // Use custom constellation computation
        result = epCalculator.computeCustom(
          customPoints,
          params.SNR,
          params.R,
          params.N,
          params.n,
          params.threshold
        )
      } else {
        // Use standard modulation computation
        result = epCalculator.compute(
          params.M,
          params.typeModulation,
          params.SNR,
          params.R,
          params.N,
          params.n,
          params.threshold,
          params.distribution,
          params.shaping_param
        )
      }

      // Extract the requested y variable
      // Note: mutual_information and cutoff_rate are now computed directly by C++
      // as E0'(0) and E0(1) during the optimization - more accurate and efficient
      let yVal = result.error_probability
      if (yVar === 'error_exponent') yVal = result.error_exponent
      else if (yVar === 'rho') yVal = result.optimal_rho
      else if (yVar === 'mutual_information') yVal = result.mutual_information
      else if (yVar === 'cutoff_rate') yVal = result.cutoff_rate
      else if (yVar === 'critical_rate') yVal = result.critical_rate

      yValues.push(yVal)
    }

    return {
      x_values: xValues,
      y_values: yValues,
      metadata: {
        x_var: xVar,
        y_var: yVar,
        points: points,
        x_range: xRange,
        snr_unit: body.snrUnit || 'dB'  // Pass SNR unit to frontend
      }
    }

  } catch (error) {
    fastify.log.error('Plot generation error:', error)
    reply.status(500)
    return {
      error: 'Plot Generation Failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      statusCode: 500
    }
  }
})

// Contour plot endpoint
fastify.post('/api/plot_contour', async (request, reply) => {
  try {
    const body = request.body

    // Extract parameters
    const x1Var = body.x1 || 'n'
    const x2Var = body.x2 || 'SNR'
    const yVar = body.y || 'error_probability'
    const x1Range = body.rang_x1 || [1, 100]
    const x2Range = body.rang_x2 || [1, 10]
    const points1 = parseInt(body.points1 || '20')
    const points2 = parseInt(body.points2 || '20')
    const snrUnit = body.snrUnit || 'dB'  // Get SNR unit from request

    // Fixed parameters
    const M = parseFloat(body.M || '16')
    const typeM = body.typeM || 'PAM'
    // SNR from body is ALWAYS in linear scale (frontend converts dB to linear in api.js)
    const SNR = parseFloat(body.SNR || '5.0')  // Default 5.0 linear (~7dB)
    const R = parseFloat(body.R || '0.5')
    const N = parseFloat(body.N || '20')
    const n = parseFloat(body.n || '100')
    const threshold = parseFloat(body.th || '1e-6')

    // Check if using custom constellation
    const isCustomConstellation = typeM === 'Custom' && body.customConstellation && Array.isArray(body.customConstellation.points)
    const customPoints = isCustomConstellation ? body.customConstellation.points : null

    // Validate custom constellation if being used
    if (isCustomConstellation) {
      const validation = validateCustomConstellation(customPoints)
      if (!validation.valid) {
        reply.status(400)
        return {
          error: 'Invalid Custom Constellation',
          message: validation.error,
          statusCode: 400
        }
      }
    }

    // Generate meshgrid
    const x1Values = []
    const x2Values = []
    const zValues = []

    const x1Min = parseFloat(x1Range[0])
    const x1Max = parseFloat(x1Range[1])

    const x2Min = parseFloat(x2Range[0])
    const x2Max = parseFloat(x2Range[1])

    // Generate x1 array (log-spaced if SNR in dB, linear otherwise)
    if (x1Var === 'SNR' && snrUnit === 'dB') {
      // Generate linearly spaced dB values, then convert to linear
      for (let i = 0; i < points1; i++) {
        const dB = points1 === 1 ? x1Min : x1Min + (x1Max - x1Min) * i / (points1 - 1)
        const linear = Math.pow(10, dB / 10)
        x1Values.push(linear)
      }
    } else {
      // Linear spacing
      const x1Step = points1 === 1 ? 0 : (x1Max - x1Min) / (points1 - 1)
      for (let i = 0; i < points1; i++) {
        x1Values.push(x1Min + (i * x1Step))
      }
    }

    // Generate x2 array (log-spaced if SNR in dB, linear otherwise)
    if (x2Var === 'SNR' && snrUnit === 'dB') {
      // Generate linearly spaced dB values, then convert to linear
      for (let j = 0; j < points2; j++) {
        const dB = points2 === 1 ? x2Min : x2Min + (x2Max - x2Min) * j / (points2 - 1)
        const linear = Math.pow(10, dB / 10)
        x2Values.push(linear)
      }
    } else {
      // Linear spacing
      const x2Step = points2 === 1 ? 0 : (x2Max - x2Min) / (points2 - 1)
      for (let j = 0; j < points2; j++) {
        x2Values.push(x2Min + (j * x2Step))
      }
    }

    // Generate z matrix
    for (let i = 0; i < points1; i++) {
      const zRow = []
      for (let j = 0; j < points2; j++) {
        const x1Val = x1Values[i]
        const x2Val = x2Values[j]

        // Create parameters object
        const distribution = body.distribution || 'uniform'
        const shaping_param = parseFloat(body.shaping_param || '0.0')
        let params = { M, typeModulation: typeM, SNR, R, N, n, threshold, distribution, shaping_param }
        params[x1Var] = x1Val
        params[x2Var] = x2Val

        // Compute for this parameter set
        let result
        if (isCustomConstellation && customPoints) {
          // Use custom constellation computation
          result = epCalculator.computeCustom(
            customPoints,
            params.SNR,
            params.R,
            params.N,
            params.n,
            params.threshold
          )
        } else {
          // Use standard modulation computation
          result = epCalculator.compute(
            params.M,
            params.typeModulation,
            params.SNR,
            params.R,
            params.N,
            params.n,
            params.threshold,
            params.distribution,
            params.shaping_param
          )
        }

        // Extract the requested z variable
        // Note: mutual_information and cutoff_rate are now computed directly by C++
        let zVal = result.error_probability
        if (yVar === 'error_exponent') zVal = result.error_exponent
        else if (yVar === 'rho') zVal = result.optimal_rho
        else if (yVar === 'mutual_information') zVal = result.mutual_information
        else if (yVar === 'cutoff_rate') zVal = result.cutoff_rate
        else if (yVar === 'critical_rate') zVal = result.critical_rate

        zRow.push(zVal)
      }
      zValues.push(zRow)
    }

    return {
      x1: x1Values,
      x2: x2Values,
      z: zValues,
      metadata: {
        x1_var: x1Var,
        x2_var: x2Var,
        y_var: yVar,
        points1: points1,
        points2: points2,
        x1_range: x1Range,
        x2_range: x2Range
      }
    }

  } catch (error) {
    fastify.log.error('Contour plot generation error:', error)
    reply.status(500)
    return {
      error: 'Contour Plot Generation Failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      statusCode: 500
    }
  }
})

// Documentation route - serve docs/index.html
fastify.get('/docs', async (request, reply) => {
  return reply.sendFile('docs/index.html')
})

fastify.get('/docs/', async (request, reply) => {
  return reply.sendFile('docs/index.html')
})

// Start server
async function start() {
  try {
    const port = parseInt(process.env.PORT || '8000')
    const host = process.env.HOST || '0.0.0.0'

    await fastify.listen({ port, host })

    console.log(`🚀 EPCalculator v2 server listening on http://${host}:${port}`)
    console.log(`📖 Health check available at http://${host}:${port}/api/health`)

  } catch (error) {
    fastify.log.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  await fastify.close()
  process.exit(0)
})

process.on('SIGINT', async () => {
  await fastify.close()
  process.exit(0)
})

start()