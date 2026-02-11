/**
 * Session Authentication Middleware
 *
 * Validates requests using either:
 * 1. Browser session cookie (created via CSRF-protected flow)
 * 2. API key (for external developers/scripts)
 *
 * This dual approach allows:
 * - Seamless browser access (auto-session on page load)
 * - Blocking casual curl abuse (no CSRF token = no session)
 * - External API access for developers with valid keys
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { DatabaseService } from '../services/database.js'
import { ApiKeyService } from '../services/api-key-service.js'
import { config } from '../config/index.js'

// Cookie name must match auth.ts
const SESSION_COOKIE_NAME = 'epc_session'

// Paths that don't require any authentication
const PUBLIC_PATHS = [
  '/health',
  '/api/v1/health',
  '/api/v1/auth',    // Session creation/management
  '/docs',
  '/api-docs',
  '/'
]

// Paths that require admin privileges (handled by admin-auth middleware)
const ADMIN_PATHS = [
  '/api/v1/admin'
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
 * Check if a path is an admin route (handled separately).
 */
function isAdminPath(path: string): boolean {
  return ADMIN_PATHS.some(adminPath =>
    path === adminPath || path.startsWith(adminPath + '/')
  )
}

/**
 * Check if path is a static file request.
 */
function isStaticPath(path: string): boolean {
  return path.startsWith('/static/') ||
    path.endsWith('.js') ||
    path.endsWith('.css') ||
    path.endsWith('.svg') ||
    path.endsWith('.png') ||
    path.endsWith('.ico') ||
    path.endsWith('.woff') ||
    path.endsWith('.woff2')
}

// Extend FastifyRequest to include session info
declare module 'fastify' {
  interface FastifyRequest {
    browserSession?: {
      token: string
      createdAt: string
      expiresAt: string
    }
    authMethod?: 'session' | 'api_key' | 'none'
  }
}

/**
 * Register the session authentication hook.
 *
 * This replaces the API key auth for protected routes.
 * Authentication succeeds if EITHER:
 * - Valid browser session cookie exists
 * - Valid API key in X-API-Key header
 */
export async function registerSessionAuth(fastify: FastifyInstance): Promise<void> {
  const db = DatabaseService.getInstance()
  const apiKeyService = ApiKeyService.getInstance()

  // Decorate request with session and auth method
  fastify.decorateRequest('browserSession', null)
  fastify.decorateRequest('authMethod', 'none')

  // Add authentication hook
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    // Skip auth for public paths
    if (isPublicPath(request.url)) {
      return
    }

    // Skip auth for static files
    if (isStaticPath(request.url)) {
      return
    }

    // Skip auth for admin paths (handled by admin-auth middleware)
    if (isAdminPath(request.url)) {
      return
    }

    // Skip auth if session protection is disabled
    if (!config.SESSION_AUTH_REQUIRED) {
      return
    }

    // Try API key first (for external developers)
    const apiKeyHeader = request.headers['x-api-key'] as string | undefined
    if (apiKeyHeader) {
      const result = await apiKeyService.validateKey(apiKeyHeader)
      if (result.valid && result.keyInfo) {
        request.apiKey = result.keyInfo
        request.authMethod = 'api_key'
        return // Authenticated via API key
      }
      // Invalid API key - continue to check session
    }

    // Try browser session cookie
    const sessionToken = request.cookies?.[SESSION_COOKIE_NAME]
    if (sessionToken) {
      const session = await db.getBrowserSession(sessionToken)
      if (session) {
        // Update last activity
        await db.touchBrowserSession(sessionToken)

        request.browserSession = {
          token: sessionToken,
          createdAt: session.created_at,
          expiresAt: session.expires_at
        }
        request.authMethod = 'session'
        return // Authenticated via session
      }
    }

    // No valid authentication
    // Add small delay to prevent timing attacks
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 50))

    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Authentication required. Please access through the web interface or provide a valid API key.',
      statusCode: 401
    })
  })

  console.log('[SessionAuth] Session authentication middleware registered')
}

/**
 * Get authentication info from request for logging/analytics.
 */
export function getAuthInfo(request: FastifyRequest): { method: string; identifier: string | null } {
  if (request.authMethod === 'api_key' && request.apiKey) {
    return { method: 'api_key', identifier: request.apiKey.owner_name }
  }
  if (request.authMethod === 'session' && request.browserSession) {
    return { method: 'session', identifier: request.browserSession.token.substring(0, 8) + '...' }
  }
  return { method: 'none', identifier: null }
}
