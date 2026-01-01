// Simplified server for testing purposes
import Fastify from 'fastify'
import cors from '@fastify/cors'
import staticFiles from '@fastify/static'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create Fastify instance
const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    }
  }
})

// Enable CORS
fastify.register(cors, {
  origin: true
})

// Serve static files
fastify.register(staticFiles, {
  root: path.join(__dirname, '../public'),
  prefix: '/'
})

// Health check endpoint
fastify.get('/api/health', async (request, reply) => {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    uptime: process.uptime()
  }
})

// Simple computation endpoint for testing
fastify.post('/api/compute', async (request, reply) => {
  try {
    const body = request.body as any
    
    // Extract parameters with defaults
    const M = parseFloat(body.M || '2')
    const typeModulation = body.typeModulation || 'PAM'
    const SNR = parseFloat(body.SNR || '5.0')
    const R = parseFloat(body.R || '0.5')
    const N = parseFloat(body.N || '20')
    const n = parseFloat(body.n || '128')
    const threshold = parseFloat(body.threshold || '1e-6')
    
    // Simple calculation (placeholder)
    const capacity_approx = Math.log2(1 + SNR)
    let error_exponent = 0.01
    
    if (R < capacity_approx) {
      error_exponent = Math.abs(capacity_approx - R) * 0.5
    }
    
    const error_probability = Math.pow(2, -n * error_exponent)
    const optimal_rho = 0.5 + Math.random() * 0.3
    
    return {
      error_probability,
      error_exponent,
      optimal_rho,
      computation_time_ms: 50 + Math.random() * 100,
      cached: false
    }
  } catch (error) {
    fastify.log.error('Computation error:', error)
    reply.status(500)
    return {
      error: 'Computation Failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      statusCode: 500
    }
  }
})

// Legacy endpoint for compatibility
fastify.get('/api/exponents', async (request, reply) => {
  try {
    const query = request.query as any
    
    const M = parseFloat(query.M || '2')
    const SNR = parseFloat(query.SNR || '1.0')
    const R = parseFloat(query.R || '0.5')
    const n = parseFloat(query.n || '128')
    
    // Simple calculation
    const capacity_approx = Math.log2(1 + SNR)
    let error_exponent = 0.01
    
    if (R < capacity_approx) {
      error_exponent = Math.abs(capacity_approx - R) * 0.5
    }
    
    const error_probability = Math.pow(2, -n * error_exponent)
    const optimal_rho = 0.5 + Math.random() * 0.3
    
    return {
      'Probabilidad de error': error_probability,
      'error_exponent': error_exponent,
      'rho óptima': optimal_rho
    }
  } catch (error) {
    fastify.log.error('Legacy computation error:', error)
    return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
})

// Catch-all route for SPA
fastify.get('/*', async (request, reply) => {
  return reply.sendFile('index.html')
})

// Start server
async function start() {
  try {
    const port = parseInt(process.env.PORT || '8000')
    const host = process.env.HOST || '0.0.0.0'
    
    await fastify.listen({ port, host })
    
    console.log(`🚀 EPCalculator v2 server listening on http://${host}:${port}`)
    console.log(`📖 Health check available at http://${host}:${port}/api/health`)
    
  } catch (error) {
    fastify.log.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  await fastify.close()
  process.exit(0)
})

process.on('SIGINT', async () => {
  await fastify.close()
  process.exit(0)
})

start()"
