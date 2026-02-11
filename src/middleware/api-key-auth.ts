/**
 * API Key Authentication Middleware
 *
 * Fastify hook that validates API keys on protected routes.
 * Attaches key info to request for downstream use.
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { ApiKeyService, ApiKeyInfo } from '../services/api-key-service.js'
import { config } from '../config/index.js'

// Extend FastifyRequest to include API key info
declare module 'fastify' {
  interface FastifyRequest {
    apiKey?: ApiKeyInfo
  }
}

// Paths that don't require authentication
// Note: Admin routes are public for bootstrap purposes (create first key)
// TODO: Add admin authentication (basic auth, session, or admin API key)
const PUBLIC_PATHS = [
  '/health',
  '/api/v1/health',
  '/api/v1/admin',
  '/docs',
  '/api-docs',
  '/'
]

/**
 * Check if a path is public (doesn't require authentication).
 */
function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.some(publicPath =>
    path === publicPath || path.startsWith(publicPath + '/')
  )
}

/**
 * Register the API key authentication hook.
 */
export async function registerApiKeyAuth(fastify: FastifyInstance): Promise<void> {
  const apiKeyService = ApiKeyService.getInstance()

  // Decorate request with apiKey property
  fastify.decorateRequest('apiKey', null)

  // Add authentication hook
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    // Skip auth for public paths
    if (isPublicPath(request.url)) {
      return
    }

    // Skip auth if not required (for gradual rollout)
    if (!config.API_KEY_REQUIRED) {
      return
    }

    // Get API key from header
    const apiKeyHeader = request.headers['x-api-key'] as string | undefined

    if (!apiKeyHeader) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'API key required. Include X-API-Key header.',
        statusCode: 401
      })
    }

    // Validate the key
    const result = await apiKeyService.validateKey(apiKeyHeader)

    if (!result.valid) {
      // Add small delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 100))

      return reply.status(401).send({
        error: 'Unauthorized',
        message: result.error || 'Invalid API key',
        statusCode: 401
      })
    }

    // Attach key info to request
    request.apiKey = result.keyInfo
  })

  console.log('[ApiKeyAuth] Authentication middleware registered')
}

/**
 * Optional middleware for routes that benefit from API key but don't require it.
 * Validates key if present, but allows anonymous access.
 */
export async function optionalApiKeyAuth(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const apiKeyHeader = request.headers['x-api-key'] as string | undefined

  if (!apiKeyHeader) {
    return // Anonymous access allowed
  }

  const apiKeyService = ApiKeyService.getInstance()
  const result = await apiKeyService.validateKey(apiKeyHeader)

  if (result.valid && result.keyInfo) {
    request.apiKey = result.keyInfo
  }
  // If invalid, just ignore and allow anonymous access
}
