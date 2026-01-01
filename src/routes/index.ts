import type { FastifyInstance } from 'fastify'
import { computationRoutes } from './computation.js'
import { healthRoutes } from './health.js'
import { analyticsRoutes } from './analytics.js'

export async function registerRoutes(fastify: FastifyInstance): Promise<void> {
  // Register route groups with prefixes
  await fastify.register(healthRoutes, { prefix: '/api' })
  await fastify.register(computationRoutes, { prefix: '/api' })
  await fastify.register(analyticsRoutes, { prefix: '/api' })
}