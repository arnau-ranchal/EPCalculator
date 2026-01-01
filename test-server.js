// Very basic test server
import http from 'http'

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' })

  if (req.url === '/api/health') {
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0-test'
    }))
  } else {
    res.end(JSON.stringify({ message: 'EPCalculator v2 Test Server' }))
  }
})

const PORT = process.env.PORT || 8000
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🧪 Test server running on http://0.0.0.0:${PORT}`)
  console.log(`📖 Health check: http://0.0.0.0:${PORT}/api/health`)
})

process.on('SIGTERM', () => {
  console.log('Shutting down test server...')
  server.close()
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('Shutting down test server...')
  server.close()
  process.exit(0)
})