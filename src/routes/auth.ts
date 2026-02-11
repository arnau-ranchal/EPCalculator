/**
 * Authentication Routes
 *
 * Handles browser session creation and management.
 * These endpoints enable CSRF-protected session authentication
 * that blocks casual curl abuse while allowing seamless browser access.
 *
 * Endpoints:
 *   POST /auth/session        - Create a new session (requires CSRF token)
 *   GET  /auth/session/status - Check if current session is valid
 *   POST /auth/session/logout - End the current session
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { randomBytes } from 'crypto'
import { validateCsrfToken } from '../utils/csrf.js'
import { DatabaseService } from '../services/database.js'

// Request body types
interface CreateSessionBody {
  csrfToken: string
}

// Cookie configuration
const SESSION_COOKIE_NAME = 'epc_session'
const SESSION_TTL_HOURS = 24

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  const db = DatabaseService.getInstance()

  /**
   * POST /auth/session - Create a new browser session
   *
   * Requires a valid CSRF token from the page.
   * Sets an HTTP-only cookie with the session token.
   */
  fastify.post<{ Body: CreateSessionBody }>(
    '/auth/session',
    {
      schema: {
        tags: ['auth'],
        summary: 'Create a new browser session',
        body: {
          type: 'object',
          required: ['csrfToken'],
          properties: {
            csrfToken: { type: 'string', minLength: 64, maxLength: 64 }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              expiresAt: { type: 'string' }
            }
          },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: CreateSessionBody }>, reply: FastifyReply) => {
      const { csrfToken } = request.body

      // Validate CSRF token (one-time use)
      if (!validateCsrfToken(csrfToken)) {
        return reply.status(400).send({
          error: 'Invalid CSRF Token',
          message: 'The CSRF token is invalid, expired, or already used. Please refresh the page.'
        })
      }

      // Generate session token
      const sessionToken = randomBytes(32).toString('hex')

      // Get client info
      const ipAddress = request.ip || null
      const userAgent = request.headers['user-agent'] || null

      // Create session in database
      await db.createBrowserSession(
        sessionToken,
        csrfToken,
        ipAddress,
        userAgent,
        SESSION_TTL_HOURS
      )

      // Calculate expiration
      const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000)

      // Set HTTP-only cookie
      reply.setCookie(SESSION_COOKIE_NAME, sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: SESSION_TTL_HOURS * 60 * 60  // seconds
      })

      return reply.send({
        success: true,
        expiresAt: expiresAt.toISOString()
      })
    }
  )

  /**
   * GET /auth/session/status - Check if current session is valid
   *
   * Returns 200 if session is valid, 401 if not.
   */
  fastify.get(
    '/auth/session/status',
    {
      schema: {
        tags: ['auth'],
        summary: 'Check current session status',
        response: {
          200: {
            type: 'object',
            properties: {
              valid: { type: 'boolean' },
              expiresAt: { type: 'string' }
            }
          },
          401: {
            type: 'object',
            properties: {
              valid: { type: 'boolean' },
              message: { type: 'string' }
            }
          }
        }
      }
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Get session token from cookie
      const sessionToken = request.cookies?.[SESSION_COOKIE_NAME]

      if (!sessionToken) {
        return reply.status(401).send({
          valid: false,
          message: 'No session cookie found'
        })
      }

      // Validate session
      const session = await db.getBrowserSession(sessionToken)

      if (!session) {
        // Clear invalid cookie
        reply.clearCookie(SESSION_COOKIE_NAME, { path: '/' })
        return reply.status(401).send({
          valid: false,
          message: 'Session expired or invalid'
        })
      }

      // Update last activity
      await db.touchBrowserSession(sessionToken)

      return reply.send({
        valid: true,
        expiresAt: session.expires_at
      })
    }
  )

  /**
   * POST /auth/session/logout - End the current session
   */
  fastify.post(
    '/auth/session/logout',
    {
      schema: {
        tags: ['auth'],
        summary: 'End the current session',
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' }
            }
          }
        }
      }
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const sessionToken = request.cookies?.[SESSION_COOKIE_NAME]

      if (sessionToken) {
        // Delete from database
        await db.deleteBrowserSession(sessionToken)
      }

      // Clear cookie
      reply.clearCookie(SESSION_COOKIE_NAME, { path: '/' })

      return reply.send({ success: true })
    }
  )

  console.log('[AuthRoutes] Browser session routes registered')
}

// Export cookie name for use in middleware
export { SESSION_COOKIE_NAME }
