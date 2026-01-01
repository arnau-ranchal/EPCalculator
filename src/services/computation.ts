import { Worker } from 'worker_threads'
import { createHash } from 'crypto'
import { config } from '../config/index.js'
import { DatabaseService } from './database.js'
import type { FastifyBaseLogger } from 'fastify'

export interface ComputationParameters {
  M: number
  typeModulation: 'PAM' | 'PSK' | 'QAM'
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
}

export class ComputationService {
  private static instance: ComputationService
  private workers: Worker[] = []
  private activeComputations = new Map<string, Promise<any>>()
  private isInitialized = false
  private logger?: FastifyBaseLogger

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
      // Initialize worker pool for CPU-intensive computations
      // Note: In production, we'll use WebAssembly instead of workers
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

  private validateParameters(params: ComputationParameters): void {
    const errors: string[] = []

    if (params.M < 2 || params.M > 64) {
      errors.push('M must be between 2 and 64')
    }

    if (!['PAM', 'PSK', 'QAM'].includes(params.typeModulation)) {
      errors.push('typeModulation must be PAM, PSK, or QAM')
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

  private async callWasmComputation(params: ComputationParameters): Promise<Omit<ComputationResult, 'cached'>> {
    const startTime = Date.now()

    try {
      // This is a placeholder for the actual WebAssembly computation
      // In the real implementation, this would load and call the WASM module

      // Simulate computation time
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50))

      // Simple approximation for demonstration
      // The actual computation will be done by the WebAssembly module
      const capacity_approx = Math.log2(1 + params.SNR)
      let error_exponent = 0.01

      if (params.R < capacity_approx) {
        error_exponent = Math.abs(capacity_approx - params.R) * 0.5
      }

      const error_probability = Math.pow(2, -params.n * error_exponent)
      const optimal_rho = 0.5 + Math.random() * 0.3 // Simplified

      const computation_time_ms = Date.now() - startTime

      return {
        error_probability,
        error_exponent,
        optimal_rho,
        computation_time_ms
      }

    } catch (error) {
      this.logger?.error('WebAssembly computation failed:', error)
      throw new Error(`Computation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async computeSingle(
    params: ComputationParameters,
    sessionId?: string,
    ipAddress?: string
  ): Promise<ComputationResult> {
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
    const computationPromise = this.performComputation(params, parametersHash, timestamp, sessionId, ipAddress)
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
    ipAddress?: string
  ): Promise<ComputationResult> {
    const startTime = Date.now()

    try {
      // Perform WebAssembly computation
      const wasmResult = await this.callWasmComputation(params)

      const result: ComputationResult = {
        ...wasmResult,
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
      this.logger?.error(`Computation failed after ${computation_time_ms}ms:`, error)
      throw error
    }
  }

  async computeBatch(
    paramsList: ComputationParameters[],
    sessionId?: string,
    ipAddress?: string
  ): Promise<ComputationResult[]> {
    const results: ComputationResult[] = []

    // Process computations concurrently with limit
    const concurrencyLimit = Math.min(config.MAX_CONCURRENT_COMPUTATIONS, paramsList.length)
    const chunks: ComputationParameters[][] = []

    for (let i = 0; i < paramsList.length; i += concurrencyLimit) {
      chunks.push(paramsList.slice(i, i + concurrencyLimit))
    }

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(params =>
        this.computeSingle(params, sessionId, ipAddress)
      )

      const chunkResults = await Promise.all(chunkPromises)
      results.push(...chunkResults)
    }

    return results
  }

  async generatePlot(
    params: PlotParameters,
    sessionId?: string,
    ipAddress?: string
  ): Promise<PlotResult> {
    const startTime = Date.now()

    // Generate x values
    const x_values: number[] = []
    const x_range = params.x_range

    if (params.x === 'M' || params.x === 'N' || params.x === 'n') {
      // Integer values
      const raw = this.linspace(x_range[0], x_range[1], params.points)
      const unique = [...new Set(raw.map(v => Math.round(v)))]
      x_values.push(...unique.sort((a, b) => a - b))
    } else if (params.x === 'SNR' && params.snrUnit === 'dB') {
      // For SNR in dB: generate linearly spaced dB values, then convert to linear
      // This ensures log-spaced points in linear SNR
      const dBValues = this.linspace(x_range[0], x_range[1], params.points)
      for (const dB of dBValues) {
        const linear = Math.pow(10, dB / 10)
        x_values.push(linear)
      }
    } else {
      // Continuous values (linear spacing)
      x_values.push(...this.linspace(x_range[0], x_range[1], params.points))
    }

    // Generate computation parameters for each x value
    const computationParams: ComputationParameters[] = x_values.map(x_val => {
      const baseParams = { ...params }
      delete (baseParams as any).y
      delete (baseParams as any).x
      delete (baseParams as any).x_range
      delete (baseParams as any).points

      return {
        ...baseParams,
        [params.x]: x_val
      }
    })

    // Compute results
    const results = await this.computeBatch(computationParams, sessionId, ipAddress)

    // Extract y values
    const y_values = results.map(result => result[params.y])

    const computation_time_ms = Date.now() - startTime

    return {
      x_values,
      y_values,
      computation_time_ms
    }
  }

  async generateContour(
    params: ContourParameters,
    sessionId?: string,
    ipAddress?: string
  ): Promise<ContourResult> {
    const startTime = Date.now()

    // Generate x1 and x2 values
    const generateValues = (param: string, range: [number, number], points: number, snrUnit?: string): number[] => {
      if (param === 'M' || param === 'N' || param === 'n') {
        const raw = this.linspace(range[0], range[1], points)
        return [...new Set(raw.map(v => Math.round(v)))].sort((a, b) => a - b)
      } else if (param === 'SNR' && snrUnit === 'dB') {
        // For SNR in dB: generate linearly spaced dB values, then convert to linear
        // This ensures log-spaced points in linear SNR
        const dBValues = this.linspace(range[0], range[1], points)
        return dBValues.map(dB => Math.pow(10, dB / 10))
      } else {
        return this.linspace(range[0], range[1], points)
      }
    }

    const x1_values = generateValues(params.x1, params.x1_range, params.points1, params.snrUnit)
    const x2_values = generateValues(params.x2, params.x2_range, params.points2, params.snrUnit)

    // Generate computation parameters for each combination
    const computationParams: ComputationParameters[] = []
    for (const x1_val of x1_values) {
      for (const x2_val of x2_values) {
        const baseParams = { ...params }
        delete (baseParams as any).y
        delete (baseParams as any).x1
        delete (baseParams as any).x2
        delete (baseParams as any).x1_range
        delete (baseParams as any).x2_range
        delete (baseParams as any).points1
        delete (baseParams as any).points2

        computationParams.push({
          ...baseParams,
          [params.x1]: x1_val,
          [params.x2]: x2_val
        })
      }
    }

    // Compute results
    const results = await this.computeBatch(computationParams, sessionId, ipAddress)

    // Reshape results into matrix
    const z_matrix: number[][] = []
    let resultIndex = 0

    for (let i = 0; i < x1_values.length; i++) {
      const row: number[] = []
      for (let j = 0; j < x2_values.length; j++) {
        row.push(results[resultIndex][params.y])
        resultIndex++
      }
      z_matrix.push(row)
    }

    const computation_time_ms = Date.now() - startTime

    return {
      x1_values,
      x2_values,
      z_matrix,
      computation_time_ms
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

    this.isInitialized = false
    this.logger?.info('✅ Computation service cleaned up')
  }
}