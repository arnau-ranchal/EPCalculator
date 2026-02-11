/**
 * Circuit Breaker Middleware for Fastify
 *
 * Integrates the circuit breaker with HTTP request handling:
 * - Calculates request cost before processing
 * - Rejects expensive requests when server is overloaded
 * - Returns 503 with Retry-After header when requests are rejected
 * - Tracks usage costs (for future billing)
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { getCircuitBreaker, CircuitState } from '../services/rate-limit/circuit-breaker.js'
import {
  calculateRequestCost,
  extractCostParams,
  getRequestTypeFromPath
} from '../services/rate-limit/cost-calculator.js'
import { ApiKeyService } from '../services/api-key-service.js'

// Extend FastifyRequest to include circuit breaker info
declare module 'fastify' {
  interface FastifyRequest {
    requestCost?: number
    circuitState?: CircuitState
    costMultiplier?: number
  }
}

// Paths that bypass circuit breaker (always allowed)
const BYPASS_PATHS = [
  '/health',
  '/api/v1/health',
  '/docs',
  '/api-docs',
  '/'
]

/**
 * Check if a path should bypass circuit breaker checks.
 */
function shouldBypass(path: string): boolean {
  return BYPASS_PATHS.some(bypassPath =>
    path === bypassPath ||
    path.startsWith(bypassPath + '/') ||
    path.startsWith('/static/')
  )
}

/**
 * Register circuit breaker middleware.
 */
export async function registerCircuitBreaker(fastify: FastifyInstance): Promise<void> {
  const circuitBreaker = getCircuitBreaker()

  // Decorate request with cost properties
  fastify.decorateRequest('requestCost', null)
  fastify.decorateRequest('circuitState', null)
  fastify.decorateRequest('costMultiplier', null)

  // Pre-handler hook: check circuit breaker before processing
  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    // Skip for non-API paths
    if (shouldBypass(request.url)) {
      return
    }

    // Only apply to computation endpoints
    if (!request.url.includes('/api/v1/compute')) {
      return
    }

    // Calculate request cost
    const requestType = getRequestTypeFromPath(request.url)
    const costParams = extractCostParams(request.body)
    const baseCost = calculateRequestCost(costParams, requestType)

    // Check with circuit breaker
    const decision = circuitBreaker.shouldAcceptRequest(baseCost)

    // Store info on request for later use
    request.requestCost = baseCost
    request.circuitState = decision.state
    request.costMultiplier = decision.costMultiplier

    // If not allowed, reject with 503
    if (!decision.allowed) {
      return reply
        .status(503)
        .header('Retry-After', decision.retryAfter?.toString() || '5')
        .send({
          error: 'Service Unavailable',
          message: decision.reason || 'Server is currently overloaded. Please try again later.',
          statusCode: 503,
          retryAfter: decision.retryAfter,
          circuitState: decision.state
        })
    }
  })

  // On-response hook: track usage after successful completion
  fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    // Skip if no cost was calculated (non-computation request)
    if (request.requestCost === undefined) {
      return
    }

    // Only track successful requests (2xx status codes)
    if (reply.statusCode < 200 || reply.statusCode >= 300) {
      return
    }

    // Track usage if API key is present
    if (request.apiKey) {
      try {
        const finalCost = Math.ceil(request.requestCost * (request.costMultiplier || 1))
        const apiKeyService = ApiKeyService.getInstance()
        await apiKeyService.recordUsage(
          request.apiKey.id,
          request.url,
          finalCost,
          extractCostParams(request.body)
        )
      } catch (error) {
        // Don't fail the request if usage tracking fails
        console.error('[CircuitBreaker] Failed to record usage:', error)
      }
    }
  })

  console.log('[CircuitBreaker] Middleware registered')
}

/**
 * Get circuit breaker status for health checks / admin endpoints.
 */
export function getCircuitBreakerStatus() {
  const circuitBreaker = getCircuitBreaker()
  const metrics = circuitBreaker.getMetrics()

  return {
    state: metrics.state,
    metrics: {
      workerUtilization: Math.round(metrics.workerUtilization * 100),
      queueDepth: metrics.queueDepth,
      memoryUsageMB: metrics.memoryUsageMB,
      memoryUtilization: Math.round(metrics.memoryUtilization * 100),
      combinedLoad: Math.round(metrics.combinedLoad * 100)
    },
    lastUpdated: metrics.lastUpdated.toISOString()
  }
}
