import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import staticFiles from '@fastify/static'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import path from 'path'
import { fileURLToPath } from 'url'
import { DatabaseService } from './services/database.js'
import { ComputationService } from './services/computation.js'
import { registerRoutes } from './routes/index.js'
import { config } from './config/index.js'
import type { FastifyInstance } from 'fastify'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create Fastify instance
const fastify: FastifyInstance = Fastify({
  logger: {
    level: config.LOG_LEVEL,
    transport: config.NODE_ENV === 'development' ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    } : undefined
  },
  trustProxy: true,
  maxParamLength: 200
})

// Error handler
fastify.setErrorHandler(async (error, request, reply) => {
  const { validation, validationContext } = error

  // Validation error
  if (validation) {
    return reply.status(400).send({
      error: 'Validation Error',
      message: `Invalid ${validationContext}: ${error.message}`,
      statusCode: 400
    })
  }

  // Log error
  fastify.log.error(error)

  // Rate limit error
  if (error.statusCode === 429) {
    return reply.status(429).send({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded, please try again later',
      statusCode: 429
    })
  }

  // Internal server error
  const statusCode = error.statusCode || 500
  return reply.status(statusCode).send({
    error: statusCode === 500 ? 'Internal Server Error' : error.name,
    message: statusCode === 500 ? 'Something went wrong' : error.message,
    statusCode
  })
})

// Register plugins
async function registerPlugins() {
  // Security
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    }
  })

  // CORS
  await fastify.register(cors, {
    origin: config.NODE_ENV === 'development' ? true : config.ALLOWED_ORIGINS,
    credentials: true
  })

  // Rate limiting
  await fastify.register(rateLimit, {
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_WINDOW,
    errorResponseBuilder: () => ({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded, please try again later',
      statusCode: 429
    })
  })

  // API documentation
  if (config.NODE_ENV === 'development') {
    await fastify.register(swagger, {
      openapi: {
        openapi: '3.0.0',
        info: {
          title: 'EPCalculator API',
          description: 'Transmission System Analysis Tool API',
          version: '2.0.0'
        },
        servers: [
          { url: 'http://localhost:8000', description: 'Development server' }
        ],
        tags: [
          { name: 'computation', description: 'Computation endpoints' },
          { name: 'session', description: 'Session and cancellation endpoints' },
          { name: 'health', description: 'Health check endpoints' },
          { name: 'analytics', description: 'Analytics and monitoring endpoints' }
        ]
      }
    })

    await fastify.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: true
      }
    })
  }

  // Static files - serve built frontend
  await fastify.register(staticFiles, {
    root: path.join(__dirname, '../public'),
    prefix: '/static/'
  })

  // Serve SPA
  await fastify.register(staticFiles, {
    root: path.join(__dirname, '../public'),
    prefix: '/',
    decorateReply: false
  })
}

// Initialize services
async function initializeServices() {
  // Initialize database
  const dbService = DatabaseService.getInstance()
  await dbService.initialize()

  // Initialize computation service with logger for process pool
  const computationService = ComputationService.getInstance()
  await computationService.initialize(fastify.log)

  // Add services to Fastify context
  fastify.decorate('db', dbService)
  fastify.decorate('computation', computationService)
}

// Register routes
async function registerApiRoutes() {
  await registerRoutes(fastify)
  // Note: SPA catch-all is handled by @fastify/static with prefix: '/'
}

// Graceful shutdown
async function gracefulShutdown() {
  fastify.log.info('Received shutdown signal, closing server...')

  try {
    await fastify.close()
    const dbService = DatabaseService.getInstance()
    await dbService.close()
    fastify.log.info('Server closed successfully')
    process.exit(0)
  } catch (error) {
    fastify.log.error('Error during shutdown:', error)
    process.exit(1)
  }
}

// Start server
async function start() {
  try {
    await registerPlugins()
    await initializeServices()
    await registerApiRoutes()

    const address = await fastify.listen({
      port: config.PORT,
      host: config.HOST
    })

    fastify.log.info(`🚀 EPCalculator v2 server listening at ${address}`)

    if (config.NODE_ENV === 'development') {
      fastify.log.info(`📖 API documentation available at ${address}/docs`)
    }

    // Handle graceful shutdown
    process.on('SIGTERM', gracefulShutdown)
    process.on('SIGINT', gracefulShutdown)

  } catch (error) {
    fastify.log.error('Failed to start server:')
    console.error('Full error:', error)
    process.exit(1)
  }
}

// Health check endpoint
fastify.get('/health', async () => {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    uptime: process.uptime()
  }
})

// Start the server
start()

// Export for testing
export { fastify }