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

// Single computation
export async function computeSingle(
  parameters: ComputationParameters
): Promise<ComputationResult> {
  const result = await apiRequest<ComputationResult>('/compute/single/standard', {
    method: 'POST',
    body: JSON.stringify(parameters)
  })

  // Update computation count
  sessionStore.incrementComputations()

  return result
}

// Batch computation
export async function computeBatch(
  parameters: ComputationParameters[]
): Promise<{ results: ComputationResult[]; total_computation_time_ms: number }> {
  const result = await apiRequest<{
    results: ComputationResult[]
    total_computation_time_ms: number
  }>('/compute/batch/standard', {
    method: 'POST',
    body: JSON.stringify({ parameters })
  })

  // Update computation count
  for (let i = 0; i < parameters.length; i++) {
    sessionStore.incrementComputations()
  }

  return result
}

// Plot generation (range computation)
export async function generatePlot(
  parameters: PlotParameters
): Promise<PlotResult> {
  return await apiRequest<PlotResult>('/compute/range/standard', {
    method: 'POST',
    body: JSON.stringify(parameters)
  })
}

// Contour plot generation
export async function generateContour(
  parameters: ContourParameters
): Promise<ContourResult> {
  return await apiRequest<ContourResult>('/compute/contour/standard', {
    method: 'POST',
    body: JSON.stringify(parameters)
  })
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
