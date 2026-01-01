import type { FastifyInstance } from 'fastify'
import { Type } from '@sinclair/typebox'
import { DatabaseService } from '../services/database.js'
import { ComputationService } from '../services/computation.js'

export async function analyticsRoutes(fastify: FastifyInstance): Promise<void> {
  // Analytics dashboard data
  fastify.get('/analytics', {
    schema: {
      tags: ['analytics'],
      summary: 'Get analytics dashboard data',
      response: {
        200: Type.Object({
          computations: Type.Object({
            total: Type.Number(),
            today: Type.Number(),
            averageTime: Type.Number(),
            active: Type.Number()
          }),
          users: Type.Object({
            total: Type.Number(),
            active: Type.Number(),
            activeLastHour: Type.Number()
          }),
          performance: Type.Object({
            databaseSize: Type.Number(),
            memoryUsage: Type.Number(),
            uptime: Type.Number()
          })
        })
      }
    }
  }, async (request, reply) => {
    const db = DatabaseService.getInstance()
    const computation = ComputationService.getInstance()

    try {
      const [dbStats, computationStats] = await Promise.all([
        db.getStatistics(),
        computation.getComputationStats()
      ])

      const memUsage = process.memoryUsage()
      const memPercentage = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)

      return {
        computations: {
          total: dbStats.totalComputations,
          today: computationStats.totalComputationsToday,
          averageTime: Math.round(dbStats.averageComputationTime),
          active: computationStats.activeComputations
        },
        users: {
          total: dbStats.totalUsers,
          active: dbStats.activeUsers,
          activeLastHour: await db.getActiveUsers(60)
        },
        performance: {
          databaseSize: Math.round(dbStats.databaseSize / 1024 / 1024), // MB
          memoryUsage: memPercentage,
          uptime: Math.round(process.uptime())
        }
      }

    } catch (error) {
      fastify.log.error('Analytics error:', error)
      reply.status(500)
      return {
        error: 'Analytics Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        statusCode: 500
      }
    }
  })

  // Computation history for a session
  fastify.get('/analytics/history/:sessionId', {
    schema: {
      tags: ['analytics'],
      summary: 'Get computation history for a session',
      params: Type.Object({
        sessionId: Type.String()
      }),
      querystring: Type.Object({
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100 }))
      }),
      response: {
        200: Type.Array(Type.Object({
          id: Type.Number(),
          timestamp: Type.String(),
          parameters: Type.String(),
          results: Type.String(),
          computation_time_ms: Type.Number()
        }))
      }
    }
  }, async (request, reply) => {
    const { sessionId } = request.params
    const { limit = 50 } = request.query

    try {
      const db = DatabaseService.getInstance()
      const history = await db.getComputationHistory(sessionId, limit)

      return history.map(record => ({
        id: record.id!,
        timestamp: record.timestamp,
        parameters: record.parameters,
        results: record.results,
        computation_time_ms: record.computation_time_ms
      }))

    } catch (error) {
      fastify.log.error('History retrieval error:', error)
      reply.status(500)
      return {
        error: 'History Retrieval Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        statusCode: 500
      }
    }
  })

  // System status for university administrators
  fastify.get('/analytics/system', {
    schema: {
      tags: ['analytics'],
      summary: 'Get detailed system status (admin only)',
      response: {
        200: Type.Object({
          timestamp: Type.String(),
          system: Type.Object({
            nodeVersion: Type.String(),
            platform: Type.String(),
            arch: Type.String(),
            cpuUsage: Type.Number(),
            memoryUsage: Type.Object({
              rss: Type.Number(),
              heapTotal: Type.Number(),
              heapUsed: Type.Number(),
              external: Type.Number()
            })
          }),
          database: Type.Object({
            connected: Type.Boolean(),
            size: Type.Number(),
            totalRecords: Type.Number()
          }),
          environment: Type.Object({
            nodeEnv: Type.String(),
            port: Type.Number(),
            maxUsers: Type.Number()
          })
        })
      }
    }
  }, async (request, reply) => {
    try {
      const db = DatabaseService.getInstance()
      const [dbHealth, dbStats] = await Promise.all([
        db.healthCheck(),
        db.getStatistics()
      ])

      const memUsage = process.memoryUsage()
      const cpuUsage = process.cpuUsage()

      return {
        timestamp: new Date().toISOString(),
        system: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          cpuUsage: Math.round(((cpuUsage.user + cpuUsage.system) / 1000000) * 100) / 100, // Convert to seconds
          memoryUsage: {
            rss: Math.round(memUsage.rss / 1024 / 1024), // MB
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
            external: Math.round(memUsage.external / 1024 / 1024) // MB
          }
        },
        database: {
          connected: dbHealth,
          size: Math.round(dbStats.databaseSize / 1024 / 1024), // MB
          totalRecords: dbStats.totalComputations
        },
        environment: {
          nodeEnv: process.env.NODE_ENV || 'production',
          port: parseInt(process.env.PORT || '8000'),
          maxUsers: parseInt(process.env.MAX_USERS || '50')
        }
      }

    } catch (error) {
      fastify.log.error('System status error:', error)
      reply.status(500)
      return {
        error: 'System Status Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        statusCode: 500
      }
    }
  })
}