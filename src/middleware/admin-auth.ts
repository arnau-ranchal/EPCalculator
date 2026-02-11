/**
 * Admin Authentication Middleware
 *
 * Protects admin routes with either:
 * 1. Basic Auth credentials (configurable via env vars)
 * 2. API key with admin privileges
 *
 * This is required for sensitive operations like:
 * - Creating/revoking API keys
 * - Viewing all API keys
 * - System configuration
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { config } from '../config/index.js'
import { ApiKeyService } from '../services/api-key-service.js'

// Admin paths that require authentication
const ADMIN_PATHS = ['/api/v1/admin']

/**
 * Check if a path is an admin route.
 */
function isAdminPath(path: string): boolean {
  return ADMIN_PATHS.some(adminPath =>
    path === adminPath || path.startsWith(adminPath + '/')
  )
}

/**
 * Parse Basic Auth header.
 */
function parseBasicAuth(header: string): { username: string; password: string } | null {
  if (!header.startsWith('Basic ')) {
    return null
  }

  try {
    const base64 = header.slice(6)
    const decoded = Buffer.from(base64, 'base64').toString('utf-8')
    const [username, password] = decoded.split(':')
    if (username && password) {
      return { username, password }
    }
  } catch {
    return null
  }
  return null
}

/**
 * Register the admin authentication hook.
 */
export async function registerAdminAuth(fastify: FastifyInstance): Promise<void> {
  const apiKeyService = ApiKeyService.getInstance()

  // Admin credentials from environment
  const adminUsername = config.ADMIN_USERNAME
  const adminPassword = config.ADMIN_PASSWORD

  // Add authentication hook
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    // Only apply to admin paths
    if (!isAdminPath(request.url)) {
      return
    }

    // Skip admin auth if not required
    if (!config.ADMIN_AUTH_REQUIRED) {
      return
    }

    // Try API key first (check for admin flag)
    const apiKeyHeader = request.headers['x-api-key'] as string | undefined
    if (apiKeyHeader) {
      const result = await apiKeyService.validateKey(apiKeyHeader)
      if (result.valid && result.keyInfo?.is_admin) {
        request.apiKey = result.keyInfo
        return // Authenticated via admin API key
      }
    }

    // Try Basic Auth
    const authHeader = request.headers.authorization
    if (authHeader) {
      const credentials = parseBasicAuth(authHeader)
      if (credentials) {
        // Validate against configured credentials
        if (credentials.username === adminUsername && credentials.password === adminPassword) {
          return // Authenticated via Basic Auth
        }
      }
    }

    // Neither valid admin API key nor Basic Auth
    // Return 401 with WWW-Authenticate header for Basic Auth prompt
    reply
      .status(401)
      .header('WWW-Authenticate', 'Basic realm="Admin API"')
      .send({
        error: 'Unauthorized',
        message: 'Admin authentication required. Use Basic Auth or provide an admin API key.',
        statusCode: 401
      })
  })

  if (config.ADMIN_AUTH_REQUIRED) {
    console.log('[AdminAuth] Admin authentication middleware registered')
  } else {
    console.log('[AdminAuth] Admin authentication disabled (ADMIN_AUTH_REQUIRED=false)')
  }
}
