/**
 * Admin API Routes
 *
 * Endpoints for managing API keys and monitoring system health.
 * These routes require special admin authorization (future implementation).
 *
 * Endpoints:
 *   POST   /admin/keys           - Create a new API key
 *   GET    /admin/keys           - List all API keys
 *   DELETE /admin/keys/:id       - Revoke an API key
 *   GET    /admin/keys/:id/stats - Get usage statistics for a key
 *   GET    /admin/health         - Get system health and circuit breaker status
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { ApiKeyService } from '../services/api-key-service.js'
import { getCircuitBreakerStatus } from '../middleware/circuit-breaker.js'
import { getWorkerPool, isWorkerPoolInitialized } from '../services/cpp-worker-pool.js'

// Request/Response types
interface CreateKeyBody {
  ownerName: string
  ownerEmail?: string
  tier?: 'free' | 'standard' | 'premium'
  environment?: 'live' | 'test'
  expiresInDays?: number
}

interface KeyIdParams {
  id: string
}

interface StatsQuery {
  days?: string
}

export async function adminRoutes(fastify: FastifyInstance): Promise<void> {
  const apiKeyService = ApiKeyService.getInstance()

  /**
   * POST /admin/keys - Create a new API key
   *
   * Body: {
   *   ownerName: string (required)
   *   ownerEmail?: string
   *   tier?: 'free' | 'standard' | 'premium'
   *   environment?: 'live' | 'test'
   *   expiresInDays?: number
   * }
   *
   * Returns the full API key (only shown once!)
   */
  fastify.post<{ Body: CreateKeyBody }>(
    '/admin/keys',
    {
      schema: {
        tags: ['admin'],
        summary: 'Create a new API key',
        body: {
          type: 'object',
          required: ['ownerName'],
          properties: {
            ownerName: { type: 'string', minLength: 1, maxLength: 100 },
            ownerEmail: { type: 'string', format: 'email' },
            tier: { type: 'string', enum: ['free', 'standard', 'premium'] },
            environment: { type: 'string', enum: ['live', 'test'] },
            expiresInDays: { type: 'number', minimum: 1, maximum: 365 }
          }
        },
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              apiKey: { type: 'string' },
              keyInfo: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  displayKey: { type: 'string' },
                  ownerName: { type: 'string' },
                  tier: { type: 'string' }
                }
              },
              warning: { type: 'string' }
            }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: CreateKeyBody }>, reply: FastifyReply) => {
      const { ownerName, ownerEmail, tier, environment, expiresInDays } = request.body

      // Calculate expiration date if provided
      let expiresAt: Date | undefined
      if (expiresInDays) {
        expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + expiresInDays)
      }

      const result = await apiKeyService.createKey(
        ownerName,
        ownerEmail,
        tier || 'free',
        environment || 'live',
        expiresAt
      )

      return reply.status(201).send({
        success: true,
        apiKey: result.key,
        keyInfo: {
          id: result.id,
          displayKey: result.keyDisplay,
          ownerName: result.ownerName,
          tier: result.tier
        },
        warning: 'Store this API key securely. It will not be shown again.'
      })
    }
  )

  /**
   * GET /admin/keys - List all API keys
   *
   * Returns key metadata (not the actual keys)
   */
  fastify.get(
    '/admin/keys',
    {
      schema: {
        tags: ['admin'],
        summary: 'List all API keys',
        response: {
          200: {
            type: 'object',
            properties: {
              keys: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    displayKey: { type: 'string' },
                    ownerName: { type: 'string' },
                    ownerEmail: { type: 'string' },
                    tier: { type: 'string' },
                    isActive: { type: 'boolean' },
                    createdAt: { type: 'string' },
                    expiresAt: { type: 'string' },
                    lastUsedAt: { type: 'string' },
                    totalRequests: { type: 'number' },
                    totalCreditsUsed: { type: 'number' }
                  }
                }
              },
              total: { type: 'number' }
            }
          }
        }
      }
    },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const keys = await apiKeyService.listKeys()

      return reply.send({
        keys,
        total: keys.length
      })
    }
  )

  /**
   * DELETE /admin/keys/:id - Revoke an API key
   */
  fastify.delete<{ Params: KeyIdParams }>(
    '/admin/keys/:id',
    {
      schema: {
        tags: ['admin'],
        summary: 'Revoke an API key',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', pattern: '^[0-9]+$' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' }
            }
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Params: KeyIdParams }>, reply: FastifyReply) => {
      const keyId = parseInt(request.params.id, 10)

      if (isNaN(keyId)) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Invalid key ID'
        })
      }

      const success = await apiKeyService.revokeKey(keyId)

      if (!success) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'API key not found or already revoked'
        })
      }

      return reply.send({
        success: true,
        message: 'API key revoked successfully'
      })
    }
  )

  /**
   * GET /admin/keys/:id/stats - Get usage statistics for a key
   */
  fastify.get<{ Params: KeyIdParams; Querystring: StatsQuery }>(
    '/admin/keys/:id/stats',
    {
      schema: {
        tags: ['admin'],
        summary: 'Get usage statistics for an API key',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', pattern: '^[0-9]+$' }
          }
        },
        querystring: {
          type: 'object',
          properties: {
            days: { type: 'string', pattern: '^[0-9]+$' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              keyId: { type: 'number' },
              period: { type: 'string' },
              totalRequests: { type: 'number' },
              totalCredits: { type: 'number' },
              topEndpoints: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    endpoint: { type: 'string' },
                    count: { type: 'number' },
                    totalCost: { type: 'number' }
                  }
                }
              }
            }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Params: KeyIdParams; Querystring: StatsQuery }>, reply: FastifyReply) => {
      const keyId = parseInt(request.params.id, 10)
      const days = request.query.days ? parseInt(request.query.days, 10) : 30

      if (isNaN(keyId)) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Invalid key ID'
        })
      }

      const stats = await apiKeyService.getKeyStats(keyId, days)

      if (!stats) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'API key not found'
        })
      }

      return reply.send({
        keyId,
        period: `last ${days} days`,
        ...stats
      })
    }
  )

  /**
   * GET /admin/health - Get system health and circuit breaker status
   */
  fastify.get(
    '/admin/health',
    {
      schema: {
        tags: ['admin'],
        summary: 'Get system health and circuit breaker status',
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              timestamp: { type: 'string' },
              circuitBreaker: {
                type: 'object',
                properties: {
                  state: { type: 'string' },
                  metrics: {
                    type: 'object',
                    properties: {
                      workerUtilization: { type: 'number' },
                      queueDepth: { type: 'number' },
                      memoryUsageMB: { type: 'number' },
                      memoryUtilization: { type: 'number' },
                      combinedLoad: { type: 'number' }
                    }
                  },
                  lastUpdated: { type: 'string' }
                }
              },
              workerPool: {
                type: 'object',
                properties: {
                  total: { type: 'number' },
                  busy: { type: 'number' },
                  available: { type: 'number' },
                  queued: { type: 'number' }
                }
              },
              memory: {
                type: 'object',
                properties: {
                  heapUsedMB: { type: 'number' },
                  heapTotalMB: { type: 'number' },
                  rssMB: { type: 'number' }
                }
              },
              uptime: { type: 'number' }
            }
          }
        }
      }
    },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      // Get circuit breaker status
      const circuitBreaker = getCircuitBreakerStatus()

      // Get worker pool stats
      let workerPool = { total: 0, busy: 0, available: 0, queued: 0 }
      if (isWorkerPoolInitialized()) {
        workerPool = getWorkerPool().getStats()
      }

      // Get memory usage
      const memUsage = process.memoryUsage()

      return reply.send({
        status: circuitBreaker.state === 'HEALTHY' ? 'healthy' : circuitBreaker.state.toLowerCase(),
        timestamp: new Date().toISOString(),
        circuitBreaker,
        workerPool,
        memory: {
          heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
          rssMB: Math.round(memUsage.rss / 1024 / 1024)
        },
        uptime: process.uptime()
      })
    }
  )

  console.log('[AdminRoutes] Admin API routes registered')
}
