import type {
  ComputationParameters,
  ComputationResult,
  PlotParameters,
  PlotResult,
  ContourParameters,
  ContourResult,
  ApiError
} from '../types'
import { sessionStore } from '../stores/session'
import { get } from 'svelte/store'

// API configuration
const API_BASE = '/api/v1'
const REQUEST_TIMEOUT = 30000 // 30 seconds

// Request headers
function getHeaders(): HeadersInit {
  const session = get(sessionStore)
  return {
    'Content-Type': 'application/json',
    'X-Session-ID': session.sessionId,
    'Accept': 'application/json'
  }
}

// Generic API request wrapper with error handling
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...getHeaders(),
        ...options.headers
      },
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    // Update session activity
    sessionStore.updateActivity()

    if (!response.ok) {
      const errorData: ApiError = await response.json().catch(() => ({
        error: 'Network Error',
        message: `HTTP ${response.status}: ${response.statusText}`,
        statusCode: response.status
      }))
      throw new Error(errorData.message || `API request failed with status ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout - computation may be too complex')
    }

    throw error
  }
}

// =============================================================================
// UNIFIED API TYPES
// =============================================================================

/** Polymorphic parameter value (single, list, or range) */
type ParameterValue = number | number[] | { min: number; max: number; step: number } | { min: number; max: number; points: number }

/** Output metrics available from the API */
type OutputMetric = 'error_probability' | 'error_exponent' | 'optimal_rho' | 'mutual_information' | 'cutoff_rate' | 'critical_rate'

/** Unified API request for standard modulation */
interface UnifiedStandardRequest {
  M: ParameterValue
  typeModulation: 'PAM' | 'PSK' | 'QAM'
  SNR: ParameterValue
  R: ParameterValue
  N: ParameterValue
  n: ParameterValue
  threshold: ParameterValue
  snrUnit?: 'dB' | 'linear'
  metrics?: OutputMetric[]
  format?: 'flat' | 'matrix'
}

/** Unified API request for custom constellation */
interface UnifiedCustomRequest {
  customConstellation: {
    points: Array<{ real: number; imag: number; prob: number }>
  }
  SNR: ParameterValue
  R: ParameterValue
  N: ParameterValue
  n: ParameterValue
  threshold: ParameterValue
  snrUnit?: 'dB' | 'linear'
  metrics?: OutputMetric[]
  format?: 'flat' | 'matrix'
}

/** Axis info in unified response */
interface AxisInfo {
  name: string
  values: number[]
  unit?: string
}

/** Result point in flat format */
interface ResultPoint {
  params: Record<string, number>
  metrics: Partial<Record<OutputMetric, number>>
  cached: boolean
  computation_time_ms: number
}

/** Unified API response */
interface UnifiedResponse {
  format: 'flat' | 'matrix'
  axes: AxisInfo[]
  results: ResultPoint[] | any[][] // flat or matrix
  meta: {
    total_points: number
    cached_points: number
    total_computation_time_ms: number
    incomplete?: boolean
    requested_points?: number
  }
}

// =============================================================================
// UNIFIED API FUNCTIONS
// =============================================================================

/**
 * Execute unified computation
 * Works for both single-point and multi-point (range/sweep) computations
 */
export async function computeUnified(
  parameters: UnifiedStandardRequest | UnifiedCustomRequest
): Promise<UnifiedResponse> {
  const isCustom = 'customConstellation' in parameters
  const endpoint = isCustom ? '/compute/custom' : '/compute/standard'

  const result = await apiRequest<UnifiedResponse>(endpoint, {
    method: 'POST',
    body: JSON.stringify(parameters)
  })

  sessionStore.incrementComputations()
  return result
}

/**
 * Single computation (wraps unified API)
 */
export async function computeSingle(
  parameters: ComputationParameters
): Promise<ComputationResult> {
  // Build unified request with single values
  const unifiedParams: UnifiedStandardRequest = {
    M: parameters.M,
    typeModulation: parameters.typeModulation as 'PAM' | 'PSK' | 'QAM',
    SNR: parameters.SNR,
    R: parameters.R,
    N: parameters.N,
    n: parameters.n,
    threshold: parameters.threshold,
    metrics: ['error_probability', 'error_exponent', 'optimal_rho'],
    format: 'flat'
  }

  const response = await apiRequest<UnifiedResponse>('/compute/standard', {
    method: 'POST',
    body: JSON.stringify(unifiedParams)
  })

  sessionStore.incrementComputations()

  // Extract single result
  if (response.results && (response.results as ResultPoint[]).length > 0) {
    const r = (response.results as ResultPoint[])[0]
    return {
      error_probability: r.metrics.error_probability!,
      error_exponent: r.metrics.error_exponent!,
      optimal_rho: r.metrics.optimal_rho!,
      computation_time_ms: r.computation_time_ms,
      cached: r.cached
    }
  }

  throw new Error('No results returned from computation')
}

/**
 * Batch computation (wraps unified API with list parameters)
 * Note: The unified API handles batching through parameter expansion
 */
export async function computeBatch(
  parameters: ComputationParameters[]
): Promise<{ results: ComputationResult[]; total_computation_time_ms: number }> {
  // For true batch of different configurations, we need multiple calls
  // or we can use the unified API if parameters follow a pattern
  const results: ComputationResult[] = []
  let totalTime = 0

  for (const params of parameters) {
    const result = await computeSingle(params)
    results.push(result)
    totalTime += result.computation_time_ms
  }

  return { results, total_computation_time_ms: totalTime }
}

/**
 * Plot generation using unified API
 */
export async function generatePlot(
  parameters: PlotParameters
): Promise<PlotResult> {
  // Convert to unified format with polymorphic x-axis
  const xVar = parameters.x as keyof UnifiedStandardRequest
  const unifiedParams: UnifiedStandardRequest = {
    M: parameters.M,
    typeModulation: parameters.typeModulation as 'PAM' | 'PSK' | 'QAM',
    SNR: parameters.SNR,
    R: parameters.R,
    N: parameters.N,
    n: parameters.n,
    threshold: parameters.threshold,
    snrUnit: parameters.snrUnit as 'dB' | 'linear' || 'dB',
    metrics: [parameters.y as OutputMetric],
    format: 'flat'
  }

  // Override x-axis parameter with range
  ;(unifiedParams as any)[xVar] = {
    min: parameters.x_range[0],
    max: parameters.x_range[1],
    points: parameters.points
  }

  const response = await apiRequest<UnifiedResponse>('/compute/standard', {
    method: 'POST',
    body: JSON.stringify(unifiedParams)
  })

  // Convert to old format
  const xAxis = response.axes.find(a => a.name === xVar)
  const results = response.results as ResultPoint[]

  return {
    x_values: xAxis?.values || [],
    y_values: results.map(r => r.metrics[parameters.y as OutputMetric]!),
    computation_time_ms: response.meta.total_computation_time_ms,
    cached: response.meta.cached_points === response.meta.total_points
  }
}

/**
 * Contour plot generation using unified API
 */
export async function generateContour(
  parameters: ContourParameters
): Promise<ContourResult> {
  const x1Var = parameters.x1 as keyof UnifiedStandardRequest
  const x2Var = parameters.x2 as keyof UnifiedStandardRequest

  const unifiedParams: UnifiedStandardRequest = {
    M: parameters.M,
    typeModulation: parameters.typeModulation as 'PAM' | 'PSK' | 'QAM',
    SNR: parameters.SNR,
    R: parameters.R,
    N: parameters.N,
    n: parameters.n,
    threshold: parameters.threshold,
    snrUnit: parameters.snrUnit as 'dB' | 'linear' || 'dB',
    metrics: [parameters.y as OutputMetric],
    format: 'matrix'
  }

  // Override both axes with ranges
  ;(unifiedParams as any)[x1Var] = {
    min: parameters.x1_range[0],
    max: parameters.x1_range[1],
    points: parameters.points1
  }
  ;(unifiedParams as any)[x2Var] = {
    min: parameters.x2_range[0],
    max: parameters.x2_range[1],
    points: parameters.points2
  }

  const response = await apiRequest<UnifiedResponse>('/compute/standard', {
    method: 'POST',
    body: JSON.stringify(unifiedParams)
  })

  // Convert to old format
  const x1Axis = response.axes.find(a => a.name === x1Var)
  const x2Axis = response.axes.find(a => a.name === x2Var)
  const metric = parameters.y as OutputMetric

  // Extract z matrix
  let zMatrix: number[][]
  if (response.format === 'matrix') {
    zMatrix = (response.results as any[][]).map(row =>
      row.map(cell => cell[metric])
    )
  } else {
    // Reconstruct from flat
    const rows = x1Axis?.values.length || 0
    const cols = x2Axis?.values.length || 0
    zMatrix = []
    const flat = response.results as ResultPoint[]
    for (let i = 0; i < rows; i++) {
      const row: number[] = []
      for (let j = 0; j < cols; j++) {
        row.push(flat[i * cols + j]?.metrics[metric] ?? 0)
      }
      zMatrix.push(row)
    }
  }

  return {
    x1_values: x1Axis?.values || [],
    x2_values: x2Axis?.values || [],
    z_matrix: zMatrix,
    computation_time_ms: response.meta.total_computation_time_ms
  }
}

// Legacy endpoint compatibility
export async function computeLegacy(
  M: number,
  typeM: string,
  SNR: number,
  R: number,
  N: number,
  n: number,
  th: number
): Promise<{
  'Probabilidad de error': number
  'error_exponent': number
  'rho óptima': number
}> {
  const params = new URLSearchParams({
    M: M.toString(),
    typeM,
    SNR: SNR.toString(),
    R: R.toString(),
    N: N.toString(),
    n: n.toString(),
    th: th.toString()
  })

  return await apiRequest(`/exponents?${params.toString()}`, {
    method: 'GET'
  })
}

// Health check
export async function healthCheck(): Promise<{
  status: string
  timestamp: string
  version: string
  uptime: number
  services: {
    database: boolean
    computation: boolean
  }
  university: {
    name: string
    activeUsers: number
    maxUsers: number
  }
  resources: {
    memory: {
      used: number
      total: number
      percentage: number
    }
    activeComputations: number
  }
}> {
  return await apiRequest('/health')
}

// Analytics
export async function getAnalytics(): Promise<{
  computations: {
    total: number
    today: number
    averageTime: number
    active: number
  }
  users: {
    total: number
    active: number
    activeLastHour: number
  }
  performance: {
    databaseSize: number
    memoryUsage: number
    uptime: number
  }
}> {
  return await apiRequest('/analytics')
}

// Get computation history
export async function getComputationHistory(
  sessionId?: string,
  limit = 50
): Promise<Array<{
  id: number
  timestamp: string
  parameters: string
  results: string
  computation_time_ms: number
}>> {
  const endpoint = sessionId
    ? `/analytics/history/${sessionId}?limit=${limit}`
    : `/analytics/history?limit=${limit}`

  return await apiRequest(endpoint)
}

// Retry mechanism for failed requests
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')

      if (attempt === maxRetries) {
        throw lastError
      }

      // Exponential backoff
      const waitTime = delay * Math.pow(2, attempt - 1)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }

  throw lastError!
}

// Connection status monitoring
let isOnline = navigator.onLine
let connectionListeners: ((online: boolean) => void)[] = []

window.addEventListener('online', () => {
  isOnline = true
  connectionListeners.forEach(listener => listener(true))
})

window.addEventListener('offline', () => {
  isOnline = false
  connectionListeners.forEach(listener => listener(false))
})

export function onConnectionChange(listener: (online: boolean) => void): () => void {
  connectionListeners.push(listener)

  // Return unsubscribe function
  return () => {
    connectionListeners = connectionListeners.filter(l => l !== listener)
  }
}

export function isNetworkOnline(): boolean {
  return isOnline
}

// Request queue for offline support
interface QueuedRequest {
  id: string
  endpoint: string
  options: RequestInit
  timestamp: number
  resolve: (value: any) => void
  reject: (error: Error) => void
}

let requestQueue: QueuedRequest[] = []

export function queueRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  return new Promise((resolve, reject) => {
    const request: QueuedRequest = {
      id: Math.random().toString(36).substring(2),
      endpoint,
      options,
      timestamp: Date.now(),
      resolve,
      reject
    }

    requestQueue.push(request)

    // Try to process queue if online
    if (isOnline) {
      processRequestQueue()
    }
  })
}

async function processRequestQueue(): Promise<void> {
  if (!isOnline || requestQueue.length === 0) {
    return
  }

  const request = requestQueue.shift()!

  try {
    const result = await apiRequest(request.endpoint, request.options)
    request.resolve(result)
  } catch (error) {
    request.reject(error instanceof Error ? error : new Error('Unknown error'))
  }

  // Process next request
  if (requestQueue.length > 0) {
    setTimeout(processRequestQueue, 100)
  }
}

// Auto-process queue when coming back online
onConnectionChange((online) => {
  if (online) {
    processRequestQueue()
  }
})

// Clear old queued requests (older than 5 minutes)
setInterval(() => {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
  const originalLength = requestQueue.length

  requestQueue = requestQueue.filter(request => {
    if (request.timestamp < fiveMinutesAgo) {
      request.reject(new Error('Request expired'))
      return false
    }
    return true
  })

  if (requestQueue.length !== originalLength) {
    console.log(`Cleared ${originalLength - requestQueue.length} expired requests from queue`)
  }
}, 60000) // Check every minute
