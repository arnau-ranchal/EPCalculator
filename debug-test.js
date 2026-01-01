import http from 'http'

console.log('🟡 Starting debug test...')

try {
  console.log('🟢 Node.js version:', process.version)
  console.log('🟢 Platform:', process.platform)
  console.log('🟢 Current directory:', process.cwd())
  console.log('🟢 HTTP module loaded successfully')

  const server = http.createServer((req, res) => {
    console.log('📥 Request received:', req.method, req.url)
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('Hello from debug server!')
  })

  server.on('error', (err) => {
    console.error('🔴 Server error:', err)
    process.exit(1)
  })

  server.listen(8000, '127.0.0.1', () => {
    console.log('🟢 Debug server listening on http://127.0.0.1:8000')

    // Keep server running for a few seconds
    setTimeout(() => {
      console.log('🟡 Closing debug server')
      server.close()
    }, 5000)
  })

} catch (error) {
  console.error('🔴 Fatal error:', error)
  process.exit(1)
}