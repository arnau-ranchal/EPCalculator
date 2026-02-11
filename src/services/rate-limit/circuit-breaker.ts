/**
 * Circuit Breaker for Server Overload Protection
 *
 * Monitors system health and transitions between states:
 * - HEALTHY: Normal operation, all requests accepted
 * - DEGRADED: Under stress (>70% utilization), apply cost multiplier
 * - OVERLOADED: Critical (>90% utilization), reject expensive requests
 *
 * Health metrics monitored:
 * - Worker pool utilization (busy/total workers)
 * - Queue depth (waiting tasks)
 * - Memory usage (heap used / heap total)
 */

import { getWorkerPool, isWorkerPoolInitialized } from '../cpp-worker-pool.js'

export enum CircuitState {
  HEALTHY = 'HEALTHY',
  DEGRADED = 'DEGRADED',
  OVERLOADED = 'OVERLOADED'
}

export interface HealthMetrics {
  workerUtilization: number    // 0-1 ratio of busy workers
  queueDepth: number           // Number of waiting tasks
  queueUtilization: number     // queue / maxQueue ratio
  memoryUsageMB: number        // Current heap used in MB
  memoryUtilization: number    // heapUsed / heapTotal ratio
  combinedLoad: number         // Weighted average of all metrics
  state: CircuitState
  lastUpdated: Date
}

export interface CircuitBreakerConfig {
  // Utilization thresholds (0-1)
  degradedThreshold: number      // Default: 0.70
  overloadedThreshold: number    // Default: 0.90

  // Queue limits
  maxQueueDepth: number          // Default: 100

  // Memory thresholds
  memoryWarningRatio: number     // Default: 0.85

  // Cost threshold for rejection (only reject expensive requests when overloaded)
  expensiveRequestThreshold: number  // Default: 50 credits

  // Retry timing
  retryAfterSeconds: number      // Default: 5

  // Update interval
  updateIntervalMs: number       // Default: 1000
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  degradedThreshold: 0.70,
  overloadedThreshold: 0.90,
  maxQueueDepth: 100,
  memoryWarningRatio: 0.85,
  expensiveRequestThreshold: 50,
  retryAfterSeconds: 5,
  updateIntervalMs: 1000
}

export class CircuitBreaker {
  private static instance: CircuitBreaker | null = null

  private state: CircuitState = CircuitState.HEALTHY
  private metrics: HealthMetrics
  private config: CircuitBreakerConfig
  private updateInterval: ReturnType<typeof setInterval> | null = null
  private stateHistory: Array<{ state: CircuitState; timestamp: Date }> = []

  // Track how long we've been in each state for hysteresis
  private stateEnteredAt: Date = new Date()
  private readonly HYSTERESIS_MS = 3000  // Must stay in better state for 3s before transitioning

  private constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.metrics = this.createInitialMetrics()
    this.startMonitoring()
  }

  static getInstance(config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!CircuitBreaker.instance) {
      CircuitBreaker.instance = new CircuitBreaker(config)
    }
    return CircuitBreaker.instance
  }

  static resetInstance(): void {
    if (CircuitBreaker.instance) {
      CircuitBreaker.instance.stop()
      CircuitBreaker.instance = null
    }
  }

  private createInitialMetrics(): HealthMetrics {
    return {
      workerUtilization: 0,
      queueDepth: 0,
      queueUtilization: 0,
      memoryUsageMB: 0,
      memoryUtilization: 0,
      combinedLoad: 0,
      state: CircuitState.HEALTHY,
      lastUpdated: new Date()
    }
  }

  private startMonitoring(): void {
    // Initial update
    this.updateMetrics()

    // Periodic updates
    this.updateInterval = setInterval(() => {
      this.updateMetrics()
    }, this.config.updateIntervalMs)

    console.log('[CircuitBreaker] Health monitoring started')
  }

  private updateMetrics(): void {
    // Get worker pool stats if available
    let workerStats = { total: 1, busy: 0, queued: 0, available: 1 }
    if (isWorkerPoolInitialized()) {
      try {
        workerStats = getWorkerPool().getStats()
      } catch {
        // Pool might be shutting down
      }
    }

    // Calculate worker utilization
    const workerUtilization = workerStats.total > 0
      ? workerStats.busy / workerStats.total
      : 0

    // Calculate queue utilization
    const queueUtilization = workerStats.queued / this.config.maxQueueDepth

    // Get memory usage
    const memUsage = process.memoryUsage()
    const memoryUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024)
    const memoryUtilization = memUsage.heapUsed / memUsage.heapTotal

    // Combined load: weighted average
    // Worker utilization is most important (50%), queue (30%), memory (20%)
    const combinedLoad =
      workerUtilization * 0.5 +
      Math.min(queueUtilization, 1) * 0.3 +
      memoryUtilization * 0.2

    // Update metrics
    this.metrics = {
      workerUtilization,
      queueDepth: workerStats.queued,
      queueUtilization,
      memoryUsageMB,
      memoryUtilization,
      combinedLoad,
      state: this.state,
      lastUpdated: new Date()
    }

    // Determine new state based on combined load
    const newState = this.calculateState(combinedLoad)

    // Apply hysteresis: only transition to better state after sustained improvement
    if (newState !== this.state) {
      this.transitionState(newState)
    }

    this.metrics.state = this.state
  }

  private calculateState(load: number): CircuitState {
    if (load >= this.config.overloadedThreshold) {
      return CircuitState.OVERLOADED
    }
    if (load >= this.config.degradedThreshold) {
      return CircuitState.DEGRADED
    }
    return CircuitState.HEALTHY
  }

  private transitionState(newState: CircuitState): void {
    const now = new Date()
    const stateOrder = { HEALTHY: 0, DEGRADED: 1, OVERLOADED: 2 }

    // Transitioning to worse state: immediate
    if (stateOrder[newState] > stateOrder[this.state]) {
      this.state = newState
      this.stateEnteredAt = now
      this.stateHistory.push({ state: newState, timestamp: now })
      console.log(`[CircuitBreaker] State: ${this.state} (load: ${(this.metrics.combinedLoad * 100).toFixed(1)}%)`)
      return
    }

    // Transitioning to better state: apply hysteresis
    const timeInCurrentState = now.getTime() - this.stateEnteredAt.getTime()
    if (timeInCurrentState >= this.HYSTERESIS_MS) {
      this.state = newState
      this.stateEnteredAt = now
      this.stateHistory.push({ state: newState, timestamp: now })
      console.log(`[CircuitBreaker] State: ${this.state} (load: ${(this.metrics.combinedLoad * 100).toFixed(1)}%)`)
    }
  }

  /**
   * Check if a request should be accepted based on current state and cost.
   *
   * @param estimatedCost - The computational cost of the request
   * @returns Object with allowed status and optional rejection reason
   */
  shouldAcceptRequest(estimatedCost: number): {
    allowed: boolean
    state: CircuitState
    reason?: string
    retryAfter?: number
    costMultiplier: number
  } {
    const state = this.state

    switch (state) {
      case CircuitState.HEALTHY:
        return {
          allowed: true,
          state,
          costMultiplier: 1.0
        }

      case CircuitState.DEGRADED:
        // Accept all requests, but apply 2x cost multiplier for tracking
        return {
          allowed: true,
          state,
          costMultiplier: 2.0
        }

      case CircuitState.OVERLOADED:
        // Reject expensive requests, allow cheap ones
        if (estimatedCost >= this.config.expensiveRequestThreshold) {
          return {
            allowed: false,
            state,
            reason: 'Server is currently overloaded. Please retry with a simpler request or wait.',
            retryAfter: this.config.retryAfterSeconds,
            costMultiplier: 3.0
          }
        }
        // Allow cheap requests even when overloaded
        return {
          allowed: true,
          state,
          costMultiplier: 3.0
        }
    }
  }

  /**
   * Get current health metrics.
   */
  getMetrics(): HealthMetrics {
    return { ...this.metrics }
  }

  /**
   * Get current circuit state.
   */
  getState(): CircuitState {
    return this.state
  }

  /**
   * Get state history for debugging/monitoring.
   */
  getStateHistory(limit: number = 20): Array<{ state: CircuitState; timestamp: Date }> {
    return this.stateHistory.slice(-limit)
  }

  /**
   * Stop the monitoring interval.
   */
  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
    console.log('[CircuitBreaker] Monitoring stopped')
  }

  /**
   * Force a state for testing purposes.
   */
  forceState(state: CircuitState): void {
    this.state = state
    this.stateEnteredAt = new Date()
    this.metrics.state = state
    console.log(`[CircuitBreaker] State forced to: ${state}`)
  }
}

/**
 * Get the singleton circuit breaker instance.
 */
export function getCircuitBreaker(): CircuitBreaker {
  return CircuitBreaker.getInstance()
}
