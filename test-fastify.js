// Test Fastify server
import Fastify from 'fastify'

console.log('🟡 Starting Fastify test...')

const fastify = Fastify({
  logger: {
    level: 'info'
  }
})

fastify.get('/api/health', async (request, reply) => {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0-test',
    uptime: process.uptime()
  }
})

async function start() {
  try {
    const port = 8001
    const host = '0.0.0.0'

    await fastify.listen({ port, host })

    console.log(`🚀 Fastify test server listening on http://${host}:${port}`)
    console.log(`📖 Health check available at http://${host}:${port}/api/health`)

  } catch (error) {
    console.error('🔴 Failed to start server:', error)
    process.exit(1)
  }
}

process.on('SIGTERM', async () => {
  await fastify.close()
  process.exit(0)
})

process.on('SIGINT', async () => {
  await fastify.close()
  process.exit(0)
})

start()