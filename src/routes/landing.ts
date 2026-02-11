import type { FastifyInstance } from 'fastify'
import { config, APP_VERSION } from '../config/index.js'

/**
 * API Landing page - provides quick reference for researchers
 */
export async function landingRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/', async (_request, reply) => {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EPCalculator API</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
      min-height: 100vh;
    }
    .header {
      text-align: center;
      margin-bottom: 2rem;
      padding: 2rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    h1 { color: #C8102E; font-size: 2.5rem; margin-bottom: 0.5rem; }
    .subtitle { color: #666; font-size: 1.1rem; }
    .version {
      display: inline-block;
      background: #C8102E;
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.85rem;
      margin-top: 0.5rem;
    }
    .card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .card h2 {
      color: #C8102E;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #f0f0f0;
    }
    .links {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }
    .link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
      text-decoration: none;
      color: #333;
      transition: all 0.2s;
    }
    .link:hover {
      background: #C8102E;
      color: white;
      transform: translateY(-2px);
    }
    .link-icon { font-size: 1.5rem; }
    .link-text { font-weight: 500; }
    pre {
      background: #1e1e1e;
      color: #d4d4d4;
      padding: 1rem;
      border-radius: 8px;
      overflow-x: auto;
      font-size: 0.9rem;
    }
    code { font-family: 'Fira Code', 'Monaco', monospace; }
    .code-comment { color: #6a9955; }
    .code-string { color: #ce9178; }
    .rate-limits {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
    }
    .rate-item {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem;
      background: #f8f9fa;
      border-radius: 4px;
    }
    .rate-limit { font-weight: 600; color: #C8102E; }
    .footer {
      text-align: center;
      margin-top: 2rem;
      color: #666;
      font-size: 0.9rem;
    }
    .footer a { color: #C8102E; }
  </style>
</head>
<body>
  <div class="header">
    <h1>EPCalculator API</h1>
    <p class="subtitle">Error Probability Calculator for Digital Communications</p>
    <span class="version">v${APP_VERSION}</span>
  </div>

  <div class="card">
    <h2>Quick Links</h2>
    <div class="links">
      <a href="/docs" class="link">
        <span class="link-icon">📖</span>
        <span class="link-text">Interactive Docs</span>
      </a>
      <a href="/api-docs" class="link">
        <span class="link-icon">📄</span>
        <span class="link-text">OpenAPI Spec</span>
      </a>
      <a href="/api/v1/health" class="link">
        <span class="link-icon">💚</span>
        <span class="link-text">Health Check</span>
      </a>
      <a href="https://github.com/arnau-ranchal/EPCalculator" class="link">
        <span class="link-icon">📦</span>
        <span class="link-text">GitHub</span>
      </a>
    </div>
  </div>

  <div class="card">
    <h2>Quick Start</h2>
    <pre><code><span class="code-comment"># Single computation for 4-PSK modulation</span>
curl -X POST http://localhost:${config.PORT}/api/v1/compute/single/standard \\
  -H <span class="code-string">"Content-Type: application/json"</span> \\
  -d <span class="code-string">'{"M": 4, "typeModulation": "PSK", "SNR": 10, "R": 0.5, "N": 20, "n": 128, "threshold": 1e-6}'</span>

<span class="code-comment"># Batch with cross-product: sweep M and SNR (computes 4 combinations)</span>
curl -X POST http://localhost:${config.PORT}/api/v1/compute/batch/standard \\
  -H <span class="code-string">"Content-Type: application/json"</span> \\
  -d <span class="code-string">'{"M": [4, 8], "SNR": [10, 15], "R": 0.5, "N": 20, "n": 128, "threshold": 1e-6}'</span></code></pre>
  </div>

  <div class="card">
    <h2>Rate Limits</h2>
    <p style="margin-bottom: 1rem; color: #666;">
      Check response headers: <code>X-RateLimit-Remaining</code>, <code>X-RateLimit-Reset</code>
    </p>
    <div class="rate-limits">
      <div class="rate-item">
        <span>All endpoints</span>
        <span class="rate-limit">${config.RATE_LIMIT_MAX}/min</span>
      </div>
      <div class="rate-item">
        <span>Window</span>
        <span class="rate-limit">${config.RATE_LIMIT_WINDOW}</span>
      </div>
    </div>
  </div>

  <div class="card">
    <h2>Supported Modulations</h2>
    <p>PAM, PSK, QAM, and <strong>Custom Constellations</strong> with arbitrary points and probabilities.</p>
  </div>

  <div class="footer">
    <p>
      Built by <a href="https://www.upf.edu">UPF</a> researchers
      &middot;
      <a href="https://github.com/arnau-ranchal/EPCalculator">Source Code</a>
    </p>
  </div>
</body>
</html>
`
    reply.type('text/html').send(html)
  })
}
