import { Worker } from 'worker_threads'
import { createHash, randomUUID } from 'crypto'
import { config } from '../config/index.js'
import { DatabaseService } from './database.js'
import { cppCalculator } from './cpp-exact.js'
import { getWorkerPool, shutdownWorkerPool, type CPPWorkerPool } from './cpp-worker-pool.js'
import type { CancellationToken } from '../utils/cancellation.js'
import type { FastifyBaseLogger } from 'fastify'
import ref from 'ref-napi'

export interface ComputationParameters {
  M: number
  typeModulation: 'PAM' | 'PSK' | 'QAM'
  SNR: number
  R: number
  N: number
  n: number
  threshold: number
}

export interface ConstellationPoint {
  real: number
  imag: number
  prob: number
}

export interface CustomComputationParameters {
  customConstellation: {
    points: ConstellationPoint[]
  }
  SNR: number
  R: number
  N: number
  n: number
  threshold: number
}

export interface ComputationResult {
  error_probability: number
  error_exponent: number
  optimal_rho: number
  computation_time_ms: number
  cached: boolean
}

export interface PlotParameters extends ComputationParameters {
  y: 'error_probability' | 'error_exponent' | 'optimal_rho'
  x: 'M' | 'SNR' | 'R' | 'N' | 'n' | 'threshold'
  x_range: [number, number]
  points: number
  snrUnit?: 'dB' | 'linear'
}

export interface PlotResult {
  x_values: number[]
  y_values: number[]
  computation_time_ms: number
  cached: boolean            // true only if ALL points came from cache
  incomplete?: boolean       // true if cancelled before completion
  computed_points?: number   // how many points were computed
  requested_points?: number  // how many were requested
}

export interface ContourParameters extends ComputationParameters {
  y: 'error_probability' | 'error_exponent' | 'optimal_rho'
  x1: 'M' | 'SNR' | 'R' | 'N' | 'n' | 'threshold'
  x2: 'M' | 'SNR' | 'R' | 'N' | 'n' | 'threshold'
  x1_range: [number, number]
  x2_range: [number, number]
  points1: number
  points2: number
  snrUnit?: 'dB' | 'linear'
}

export interface ContourResult {
  x1_values: number[]
  x2_values: number[]
  z_matrix: number[][]
  computation_time_ms: number
  cached: boolean            // true only if ALL points came from cache
  incomplete?: boolean       // true if cancelled before completion
  computed_points?: number   // how many points were computed
  requested_points?: number  // how many were requested
}

/**
 * Result from batch computation with caching and cancellation info
 */
export interface BatchResult {
  results: ComputationResult[]
  cancelled: boolean
  totalRequested: number
  allCached: boolean
}

export class ComputationService {
  private static instance: ComputationService
  private workers: Worker[] = []
  private activeComputations = new Map<string, Promise<any>>()
  private isInitialized = false
  private logger?: FastifyBaseLogger
  private workerPool?: CPPWorkerPool
  private useWorkerPool = true  // Toggle between worker pool and direct FFI

  private constructor() {}

  /**
   * Generate linearly spaced values, handling the special case of points=1
   */
  private linspace(start: number, end: number, points: number): number[] {
    if (points === 1) return [start]
    return Array.from({ length: points }, (_, i) =>
      start + (end - start) * i / (points - 1)
    )
  }

  static getInstance(): ComputationService {
    if (!ComputationService.instance) {
      ComputationService.instance = new ComputationService()
    }
    return ComputationService.instance
  }

  async initialize(logger?: FastifyBaseLogger): Promise<void> {
    if (this.isInitialized) {
      return
    }

    this.logger = logger

    try {
      // Initialize worker pool for CPU-intensive computations with cancellation support
      if (this.useWorkerPool) {
        this.workerPool = getWorkerPool(this.logger)
        this.logger?.info(`✅ Worker pool initialized with ${this.workerPool.getStats().total} workers`)
      }

      this.isInitialized = true
      this.logger?.info('✅ Computation service initialized')

    } catch (error) {
      this.logger?.error('❌ Computation service initialization failed:', error)
      throw error
    }
  }

  private generateParametersHash(params: ComputationParameters): string {
    const paramString = JSON.stringify(params, Object.keys(params).sort())
    return createHash('md5').update(paramString).digest('hex')
  }

  private validateParameters(params: ComputationParameters | CustomComputationParameters): void {
    const errors: string[] = []

    // Check if this is a custom constellation (no M or typeModulation required)
    const isCustom = 'customConstellation' in params && params.customConstellation?.points?.length > 0

    // Only validate M and typeModulation for standard modulations
    if (!isCustom) {
      const stdParams = params as ComputationParameters
      if (stdParams.M < 2 || stdParams.M > 64) {
        errors.push('M must be between 2 and 64')
      }

      if (!['PAM', 'PSK', 'QAM'].includes(stdParams.typeModulation)) {
        errors.push('typeModulation must be PAM, PSK, or QAM')
      }
    }

    if (params.SNR < 0 || params.SNR > 1e20) {
      errors.push('SNR must be between 0 and 1e20')
    }

    if (params.R < 0 || params.R > 1e20) {
      errors.push('R must be between 0 and 1e20')
    }

    if (params.N < 2 || params.N > 40) {
      errors.push('N must be between 2 and 40')
    }

    if (params.n < 1 || params.n > 1000000) {
      errors.push('n must be between 1 and 1000000')
    }

    if (params.threshold < 1e-15 || params.threshold > 0.1) {
      errors.push('threshold must be between 1e-15 and 0.1')
    }

    if (errors.length > 0) {
      throw new Error(`Parameter validation failed: ${errors.join(', ')}`)
    }
  }

  /**
   * Execute computation via worker pool - supports hard termination on cancellation
   */
  private async callWorkerComputation(
    params: ComputationParameters | CustomComputationParameters,
    cancellationToken?: CancellationToken
  ): Promise<Omit<ComputationResult, 'cached'>> {
    const startTime = Date.now()

    if (!this.workerPool) {
      throw new Error('Worker pool not initialized')
    }

    // Check cancellation before starting
    if (cancellationToken?.isCancelled) {
      throw new Error('Computation cancelled before execution')
    }

    try {
      let taskType: 'compute' | 'compute_custom'
      let taskParams: any[]

      if ('customConstellation' in params && params.customConstellation) {
        // Custom constellation - serialize point arrays for worker
        const points = params.customConstellation.points
        const numPoints = points.length

        // Create typed arrays for FFI
        const realParts = Buffer.alloc(numPoints * 8) // 8 bytes per double
        const imagParts = Buffer.alloc(numPoints * 8)
        const probabilities = Buffer.alloc(numPoints * 8)

        for (let i = 0; i < numPoints; i++) {
          realParts.writeDoubleLE(points[i].real, i * 8)
          imagParts.writeDoubleLE(points[i].imag, i * 8)
          probabilities.writeDoubleLE(points[i].prob, i * 8)
        }

        taskType = 'compute_custom'
        taskParams = [
          realParts,
          imagParts,
          probabilities,
          numPoints,
          params.SNR,
          params.R,
          params.N,
          params.n,
          params.threshold
        ]

        this.logger?.info(`Worker Custom computation: ${numPoints} points, SNR=${params.SNR}, R=${params.R}`)
      } else {
        // Standard modulation
        const stdParams = params as ComputationParameters
        taskType = 'compute'
        taskParams = [
          stdParams.M,
          stdParams.typeModulation,
          stdParams.SNR,
          stdParams.R,
          stdParams.N,
          stdParams.n,
          stdParams.threshold,
          'uniform',
          0.0
        ]

        this.logger?.info(`Worker Standard computation: M=${stdParams.M}, type=${stdParams.typeModulation}, SNR=${stdParams.SNR}`)
      }

      const taskId = randomUUID()
      const result = await this.workerPool.execute(
        { id: taskId, type: taskType, params: taskParams },
        cancellationToken
      )

      const computation_time_ms = Date.now() - startTime

      return {
        error_probability: result.error_probability,
        error_exponent: result.error_exponent,
        optimal_rho: result.optimal_rho,
        computation_time_ms
      }

    } catch (error) {
      if (error instanceof Error && error.message.includes('cancelled')) {
        throw error // Re-throw cancellation errors as-is
      }
      this.logger?.error('Worker computation failed:', error)
      throw new Error(`Computation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Execute computation via direct FFI (synchronous, no cancellation support)
   */
  private async callWasmComputation(params: ComputationParameters | CustomComputationParameters): Promise<Omit<ComputationResult, 'cached'>> {
    const startTime = Date.now()

    try {
      // Check if C++ library is available
      if (!cppCalculator.isReady()) {
        throw new Error('C++ computation library not available')
      }

      let result: any

      // Check if this is a custom constellation computation
      if ('customConstellation' in params && params.customConstellation) {
        // Custom constellation computation
        const points = params.customConstellation.points
        this.logger?.info(`C++ Custom computation: ${points.length} points, SNR=${params.SNR}, R=${params.R}`)
        result = cppCalculator.computeCustom(
          points,
          params.SNR,
          params.R,
          params.N,
          params.n,
          params.threshold
        )
      } else {
        // Standard modulation computation
        const stdParams = params as ComputationParameters
        this.logger?.info(`C++ Standard computation: M=${stdParams.M}, type=${stdParams.typeModulation}, SNR=${stdParams.SNR}, R=${stdParams.R}`)
        result = cppCalculator.compute(
          stdParams.M,
          stdParams.typeModulation,
          stdParams.SNR,
          stdParams.R,
          stdParams.N,
          stdParams.n,
          stdParams.threshold,
          'uniform',  // distribution
          0.0         // shaping_param
        )
      }

      const computation_time_ms = Date.now() - startTime

      return {
        error_probability: result.error_probability,
        error_exponent: result.error_exponent,
        optimal_rho: result.optimal_rho,
        computation_time_ms
      }

    } catch (error) {
      this.logger?.error('C++ computation failed:', error)
      throw new Error(`Computation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Route computation to either worker pool (cancellable) or direct FFI
   */
  private async executeComputation(
    params: ComputationParameters | CustomComputationParameters,
    cancellationToken?: CancellationToken
  ): Promise<Omit<ComputationResult, 'cached'>> {
    // Use worker pool if available and cancellation is needed
    if (this.useWorkerPool && this.workerPool && cancellationToken) {
      return this.callWorkerComputation(params, cancellationToken)
    }
    // Fall back to direct FFI for single computations without cancellation
    return this.callWasmComputation(params)
  }

  async computeSingle(
    params: ComputationParameters,
    sessionId?: string,
    ipAddress?: string,
    cancellationToken?: CancellationToken
  ): Promise<ComputationResult> {
    // Check cancellation early
    if (cancellationToken?.isCancelled) {
      throw new Error('Computation cancelled')
    }

    this.validateParameters(params)

    const parametersHash = this.generateParametersHash(params)
    const timestamp = new Date().toISOString()

    // Check cache first
    const db = DatabaseService.getInstance()
    const cachedResult = await db.getCachedResult(parametersHash)

    if (cachedResult) {
      this.logger?.info('Cache hit for computation')
      const parsed = JSON.parse(cachedResult)
      return {
        ...parsed,
        cached: true
      }
    }

    // Check if computation is already in progress
    const existingComputation = this.activeComputations.get(parametersHash)
    if (existingComputation) {
      this.logger?.info('Computation already in progress, waiting...')
      return await existingComputation
    }

    // Start new computation
    const computationPromise = this.performComputation(params, parametersHash, timestamp, sessionId, ipAddress, cancellationToken)
    this.activeComputations.set(parametersHash, computationPromise)

    try {
      const result = await computationPromise
      return result
    } finally {
      this.activeComputations.delete(parametersHash)
    }
  }

  private async performComputation(
    params: ComputationParameters,
    parametersHash: string,
    timestamp: string,
    sessionId?: string,
    ipAddress?: string,
    cancellationToken?: CancellationToken
  ): Promise<ComputationResult> {
    const startTime = Date.now()

    try {
      // Perform computation via worker pool (cancellable) or direct FFI
      const computeResult = await this.executeComputation(params, cancellationToken)

      const result: ComputationResult = {
        ...computeResult,
        cached: false
      }

      // Save to database
      const db = DatabaseService.getInstance()
      await db.saveComputation({
        timestamp,
        parameters: parametersHash,
        results: JSON.stringify(result),
        computation_time_ms: result.computation_time_ms,
        user_session: sessionId,
        ip_address: ipAddress
      })

      // Update user session
      if (sessionId && ipAddress) {
        await db.updateUserSession(sessionId, ipAddress, 'WebApp')
      }

      this.logger?.info(`Computation completed in ${result.computation_time_ms}ms`)
      return result

    } catch (error) {
      const computation_time_ms = Date.now() - startTime
      // Don't log cancellation as an error
      if (error instanceof Error && error.message.includes('cancelled')) {
        this.logger?.info(`Computation cancelled after ${computation_time_ms}ms`)
      } else {
        this.logger?.error(`Computation failed after ${computation_time_ms}ms:`, error)
      }
      throw error
    }
  }

  /**
   * Optimized batch computation with pre-filtering of cached results.
   *
   * Flow:
   * 1. Generate hashes for all parameters upfront
   * 2. Batch lookup cached results (single DB query)
   * 3. Separate into cached vs uncached
   * 4. Only compute uncached points
   * 5. Merge results maintaining original order
   * 6. Handle cancellation with partial results
   */
  async computeBatch(
    paramsList: (ComputationParameters | CustomComputationParameters)[],
    sessionId?: string,
    ipAddress?: string,
    cancellationToken?: CancellationToken
  ): Promise<BatchResult> {
    const totalRequested = paramsList.length
    let cancelled = false

    // Early cancellation check
    if (cancellationToken?.isCancelled) {
      return { results: [], cancelled: true, totalRequested, allCached: false }
    }

    // Step 1: Generate hashes for all parameters and validate
    type AnyParams = ComputationParameters | CustomComputationParameters
    const paramData: Array<{ params: AnyParams; hash: string; index: number }> = []
    for (let i = 0; i < paramsList.length; i++) {
      this.validateParameters(paramsList[i])
      const hash = this.generateParametersHash(paramsList[i])
      paramData.push({ params: paramsList[i], hash, index: i })
    }

    // Step 2: Batch lookup cached results (single DB query)
    const db = DatabaseService.getInstance()
    const allHashes = paramData.map(p => p.hash)
    const cachedResults = await db.getBatchCachedResults(allHashes)

    this.logger?.info(`Batch cache lookup: ${cachedResults.size}/${totalRequested} hits`)

    // Step 3: Separate into cached vs uncached
    const finalResults: Array<ComputationResult | null> = new Array(totalRequested).fill(null)
    const uncachedItems: Array<{ params: AnyParams; hash: string; index: number }> = []

    for (const item of paramData) {
      const cached = cachedResults.get(item.hash)
      if (cached) {
        // Use cached result
        const parsed = JSON.parse(cached)
        finalResults[item.index] = { ...parsed, cached: true }
      } else {
        // Need to compute
        uncachedItems.push(item)
      }
    }

    // Check if all cached
    if (uncachedItems.length === 0) {
      this.logger?.info('All points from cache, no computation needed')
      return {
        results: finalResults as ComputationResult[],
        cancelled: false,
        totalRequested,
        allCached: true
      }
    }

    // Step 4: Compute uncached points with chunking and cancellation support
    const concurrencyLimit = Math.min(config.MAX_CONCURRENT_COMPUTATIONS, uncachedItems.length)
    const chunks: Array<typeof uncachedItems> = []
    for (let i = 0; i < uncachedItems.length; i += concurrencyLimit) {
      chunks.push(uncachedItems.slice(i, i + concurrencyLimit))
    }

    let computedCount = 0
    for (const chunk of chunks) {
      // Check cancellation before each chunk
      if (cancellationToken?.isCancelled) {
        this.logger?.info(`Batch cancelled: ${computedCount}/${uncachedItems.length} computed, ${cachedResults.size} from cache`)
        cancelled = true
        break
      }

      const chunkPromises = chunk.map(async (item) => {
        try {
          // Skip items if cancelled mid-chunk
          if (cancellationToken?.isCancelled) {
            return { item, result: null, error: null }
          }

          const result = await this.computeSingleWithoutCacheCheck(
            item.params,
            item.hash,
            sessionId,
            ipAddress,
            cancellationToken
          )
          return { item, result, error: null }
        } catch (error) {
          // If cancelled, don't treat as error
          if (error instanceof Error &&
              (error.message.includes('cancelled') || error.message.includes('cancellation'))) {
            cancelled = true
            return { item, result: null, error: null }
          }
          return { item, result: null, error }
        }
      })

      const chunkResults = await Promise.all(chunkPromises)

      for (const { item, result, error } of chunkResults) {
        if (result) {
          finalResults[item.index] = result
          computedCount++
        } else if (error) {
          // Re-throw non-cancellation errors
          throw error
        }
        // If result is null due to cancellation, leave finalResults[index] as null
      }

      // Check cancellation after chunk completes
      if (cancellationToken?.isCancelled) {
        cancelled = true
        break
      }
    }

    // Step 5: Filter out null results (incomplete due to cancellation)
    // Return only the results that were actually computed
    const validResults = finalResults.filter((r): r is ComputationResult => r !== null)

    return {
      results: validResults,
      cancelled,
      totalRequested,
      allCached: false
    }
  }

  /**
   * Compute a single point WITHOUT checking cache (cache was already checked in batch)
   * This is an internal helper for the optimized batch computation.
   */
  private async computeSingleWithoutCacheCheck(
    params: ComputationParameters,
    parametersHash: string,
    sessionId?: string,
    ipAddress?: string,
    cancellationToken?: CancellationToken
  ): Promise<ComputationResult> {
    const timestamp = new Date().toISOString()
    const startTime = Date.now()

    try {
      // Perform computation via worker pool (cancellable) or direct FFI
      const computeResult = await this.executeComputation(params, cancellationToken)

      const result: ComputationResult = {
        ...computeResult,
        cached: false
      }

      // Save to database
      const db = DatabaseService.getInstance()
      await db.saveComputation({
        timestamp,
        parameters: parametersHash,
        results: JSON.stringify(result),
        computation_time_ms: result.computation_time_ms,
        user_session: sessionId,
        ip_address: ipAddress
      })

      // Update user session
      if (sessionId && ipAddress) {
        await db.updateUserSession(sessionId, ipAddress, 'WebApp')
      }

      return result

    } catch (error) {
      const computation_time_ms = Date.now() - startTime
      if (error instanceof Error && error.message.includes('cancelled')) {
        this.logger?.info(`Computation cancelled after ${computation_time_ms}ms`)
      } else {
        this.logger?.error(`Computation failed after ${computation_time_ms}ms:`, error)
      }
      throw error
    }
  }

  async generatePlot(
    params: PlotParameters,
    sessionId?: string,
    ipAddress?: string,
    cancellationToken?: CancellationToken
  ): Promise<PlotResult> {
    const startTime = Date.now()

    // Check cancellation early
    if (cancellationToken?.isCancelled) {
      return {
        x_values: [],
        y_values: [],
        computation_time_ms: Date.now() - startTime,
        cached: false,
        incomplete: true,
        computed_points: 0,
        requested_points: params.points
      }
    }

    // Generate x values for display (in the requested unit)
    // And compute values (which may need conversion for computation)
    const x_values_display: number[] = []  // Values to return for plotting (in requested unit)
    const x_values_compute: number[] = []  // Values to use in computation (always linear for SNR)
    const x_range = params.x_range

    if (params.x === 'M' || params.x === 'N' || params.x === 'n') {
      // Integer values - display and compute are the same
      const raw = this.linspace(x_range[0], x_range[1], params.points)
      const unique = [...new Set(raw.map(v => Math.round(v)))].sort((a, b) => a - b)
      x_values_display.push(...unique)
      x_values_compute.push(...unique)
    } else if (params.x === 'SNR' && params.snrUnit === 'dB') {
      // For SNR in dB:
      // - Display values are in dB (what the user requested)
      // - Compute values are converted to linear (what the computation needs)
      const dBValues = this.linspace(x_range[0], x_range[1], params.points)
      for (const dB of dBValues) {
        x_values_display.push(dB)  // Return dB values for plotting
        x_values_compute.push(Math.pow(10, dB / 10))  // Use linear for computation
      }
    } else {
      // Continuous values (linear spacing) - display and compute are the same
      const values = this.linspace(x_range[0], x_range[1], params.points)
      x_values_display.push(...values)
      x_values_compute.push(...values)
    }

    // Generate computation parameters for each x value (using compute values)
    const computationParams: (ComputationParameters | CustomComputationParameters)[] = x_values_compute.map(x_val => {
      const baseParams = { ...params }
      delete (baseParams as any).y
      delete (baseParams as any).x
      delete (baseParams as any).x_range
      delete (baseParams as any).points
      delete (baseParams as any).snrUnit  // Remove snrUnit from computation params

      return {
        ...baseParams,
        [params.x]: x_val
      }
    })

    // Compute results with cancellation and caching support
    const batchResult = await this.computeBatch(computationParams, sessionId, ipAddress, cancellationToken)

    // Extract y values from the results we have (may be partial)
    const y_values = batchResult.results.map(result => result[params.y])

    // Slice x_values to match the number of computed results
    const computed_x_values = x_values_display.slice(0, batchResult.results.length)

    const computation_time_ms = Date.now() - startTime

    return {
      x_values: computed_x_values,
      y_values,
      computation_time_ms,
      cached: batchResult.allCached,
      incomplete: batchResult.cancelled,
      computed_points: batchResult.results.length,
      requested_points: batchResult.totalRequested
    }
  }

  async generateContour(
    params: ContourParameters,
    sessionId?: string,
    ipAddress?: string,
    cancellationToken?: CancellationToken
  ): Promise<ContourResult> {
    const startTime = Date.now()
    const totalPoints = params.points1 * params.points2

    // Check cancellation early
    if (cancellationToken?.isCancelled) {
      return {
        x1_values: [],
        x2_values: [],
        z_matrix: [],
        computation_time_ms: Date.now() - startTime,
        cached: false,
        incomplete: true,
        computed_points: 0,
        requested_points: totalPoints
      }
    }

    // Generate display and compute values for an axis
    // display = values in the requested unit (for plotting)
    // compute = values for actual computation (linear for SNR)
    const generateValuesWithCompute = (
      param: string,
      range: [number, number],
      points: number,
      snrUnit?: string
    ): { display: number[], compute: number[] } => {
      if (param === 'M' || param === 'N' || param === 'n') {
        const raw = this.linspace(range[0], range[1], points)
        const values = [...new Set(raw.map(v => Math.round(v)))].sort((a, b) => a - b)
        return { display: values, compute: values }
      } else if (param === 'SNR' && snrUnit === 'dB') {
        // For SNR in dB:
        // - Display values are in dB (what the user requested)
        // - Compute values are converted to linear (what the computation needs)
        const dBValues = this.linspace(range[0], range[1], points)
        const linearValues = dBValues.map(dB => Math.pow(10, dB / 10))
        return { display: dBValues, compute: linearValues }
      } else {
        const values = this.linspace(range[0], range[1], points)
        return { display: values, compute: values }
      }
    }

    const x1_data = generateValuesWithCompute(params.x1, params.x1_range, params.points1, params.snrUnit)
    const x2_data = generateValuesWithCompute(params.x2, params.x2_range, params.points2, params.snrUnit)

    // Generate computation parameters for each combination (using compute values)
    const computationParams: (ComputationParameters | CustomComputationParameters)[] = []
    for (const x1_val of x1_data.compute) {
      for (const x2_val of x2_data.compute) {
        const baseParams = { ...params }
        delete (baseParams as any).y
        delete (baseParams as any).x1
        delete (baseParams as any).x2
        delete (baseParams as any).x1_range
        delete (baseParams as any).x2_range
        delete (baseParams as any).points1
        delete (baseParams as any).points2
        delete (baseParams as any).snrUnit  // Remove snrUnit from computation params

        computationParams.push({
          ...baseParams,
          [params.x1]: x1_val,
          [params.x2]: x2_val
        })
      }
    }

    // Compute results with cancellation and caching support
    const batchResult = await this.computeBatch(computationParams, sessionId, ipAddress, cancellationToken)

    // Reshape available results into partial matrix
    // Results are ordered: for each x1, iterate through all x2
    const z_matrix: number[][] = []
    let resultIndex = 0
    const cols = x2_data.compute.length

    for (let i = 0; i < x1_data.compute.length && resultIndex < batchResult.results.length; i++) {
      const row: number[] = []
      for (let j = 0; j < cols && resultIndex < batchResult.results.length; j++) {
        row.push(batchResult.results[resultIndex][params.y])
        resultIndex++
      }
      // Only include complete rows (all columns filled)
      if (row.length === cols) {
        z_matrix.push(row)
      } else if (row.length > 0) {
        // Partial row - include it but this signals incomplete data
        z_matrix.push(row)
      }
    }

    // Slice axis values to match partial matrix dimensions
    const numCompleteRows = z_matrix.length
    const numCompleteCols = z_matrix.length > 0 ? Math.min(...z_matrix.map(r => r.length)) : 0

    const computation_time_ms = Date.now() - startTime

    return {
      x1_values: x1_data.display.slice(0, numCompleteRows),
      x2_values: x2_data.display.slice(0, numCompleteCols),
      z_matrix,
      computation_time_ms,
      cached: batchResult.allCached,
      incomplete: batchResult.cancelled,
      computed_points: batchResult.results.length,
      requested_points: totalPoints
    }
  }

  async getComputationStats(): Promise<{
    activeComputations: number
    totalComputationsToday: number
    averageComputationTime: number
  }> {
    const db = DatabaseService.getInstance()
    const dbStats = await db.getStatistics()

    return {
      activeComputations: this.activeComputations.size,
      totalComputationsToday: dbStats.totalComputations,
      averageComputationTime: dbStats.averageComputationTime
    }
  }

  async cleanup(): Promise<void> {
    // Cancel all active computations
    this.activeComputations.clear()

    // Terminate workers
    await Promise.all(this.workers.map(worker => worker.terminate()))
    this.workers = []

    // Shutdown worker pool
    if (this.workerPool) {
      await shutdownWorkerPool()
      this.workerPool = undefined
    }

    this.isInitialized = false
    this.logger?.info('✅ Computation service cleaned up')
  }
}