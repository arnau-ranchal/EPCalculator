import type { FastifyInstance } from 'fastify'
import { computationRoutes } from './computation.js'
import { healthRoutes } from './health.js'
import { analyticsRoutes } from './analytics.js'
import { sessionRoutes } from './session.js'
import { adminRoutes } from './admin.js'

export async function registerRoutes(fastify: FastifyInstance): Promise<void> {
  // Register route groups with /api/v1 prefix for versioned API
  await fastify.register(healthRoutes, { prefix: '/api/v1' })
  await fastify.register(computationRoutes, { prefix: '/api/v1' })
  await fastify.register(analyticsRoutes, { prefix: '/api/v1' })
  await fastify.register(sessionRoutes, { prefix: '/api/v1' })
  await fastify.register(adminRoutes, { prefix: '/api/v1' })
}