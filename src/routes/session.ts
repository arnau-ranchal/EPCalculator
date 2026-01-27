import type { FastifyInstance } from 'fastify'
import { Type } from '@sinclair/typebox'
import {
  cancelAllForSession,
  getActiveRequestCount,
  getActiveSessions,
  getTotalActiveRequests
} from '../utils/cancellation.js'

const CancelResponseSchema = Type.Object({
  status: Type.String(),
  sessionId: Type.String(),
  cancelledRequests: Type.Number(),
  message: Type.String()
})

const SessionStatusSchema = Type.Object({
  sessionId: Type.String(),
  activeRequests: Type.Number(),
  status: Type.String()
})

const ErrorResponseSchema = Type.Object({
  error: Type.String(),
  message: Type.String(),
  statusCode: Type.Number()
})

export async function sessionRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * Cancel all active requests for a session
   * Called by frontend cancel button or when user navigates away
   */
  fastify.post('/session/cancel', {
    schema: {
      tags: ['session'],
      summary: 'Cancel all active requests for a session',
      description: `Cancels all pending computations for the given session.
Running C++ computations will complete (cannot be interrupted), but pending batch items will be cancelled.
Use the x-session-id header to identify the session.`,
      headers: Type.Object({
        'x-session-id': Type.String({ description: 'Session ID to cancel requests for' })
      }),
      response: {
        200: CancelResponseSchema,
        400: ErrorResponseSchema
      }
    }
  }, async (request, reply) => {
    const sessionId = request.headers['x-session-id'] as string

    if (!sessionId) {
      reply.status(400)
      return {
        error: 'Bad Request',
        message: 'Missing x-session-id header',
        statusCode: 400
      }
    }

    const cancelledCount = cancelAllForSession(sessionId)

    fastify.log.info({ sessionId, cancelledCount }, 'Session cancellation requested')

    return {
      status: cancelledCount > 0 ? 'cancelling' : 'no_active_requests',
      sessionId,
      cancelledRequests: cancelledCount,
      message: cancelledCount > 0
        ? `Cancellation requested for ${cancelledCount} active request(s)`
        : 'No active requests to cancel'
    }
  })

  /**
   * Get session status - number of active requests
   */
  fastify.get('/session/status', {
    schema: {
      tags: ['session'],
      summary: 'Get status of a session',
      description: 'Returns the number of active requests for the given session.',
      headers: Type.Object({
        'x-session-id': Type.Optional(Type.String({ description: 'Session ID to check status for' }))
      }),
      response: {
        200: SessionStatusSchema
      }
    }
  }, async (request, reply) => {
    const sessionId = request.headers['x-session-id'] as string

    if (!sessionId) {
      reply.status(400)
      return {
        error: 'Bad Request',
        message: 'Missing x-session-id header',
        statusCode: 400
      }
    }

    const activeRequests = getActiveRequestCount(sessionId)

    return {
      sessionId,
      activeRequests,
      status: activeRequests > 0 ? 'active' : 'idle'
    }
  })

  /**
   * Get global cancellation stats (for monitoring)
   */
  fastify.get('/session/stats', {
    schema: {
      tags: ['session'],
      summary: 'Get global session statistics',
      description: 'Returns statistics about active sessions and requests across all users.',
      response: {
        200: Type.Object({
          activeSessions: Type.Number(),
          totalActiveRequests: Type.Number(),
          sessionIds: Type.Array(Type.String())
        })
      }
    }
  }, async (request, reply) => {
    const sessionIds = getActiveSessions()

    return {
      activeSessions: sessionIds.length,
      totalActiveRequests: getTotalActiveRequests(),
      sessionIds
    }
  })
}
