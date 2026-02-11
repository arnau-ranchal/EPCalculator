/**
 * CSRF Token Injector Middleware
 *
 * Injects a fresh CSRF token into HTML responses.
 * The token is added as a meta tag in the head:
 * <meta name="csrf-token" content="TOKEN_HERE">
 *
 * The frontend reads this token and uses it to create a session.
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { generateCsrfToken } from '../utils/csrf.js'
import { config } from '../config/index.js'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Register the CSRF token injection for HTML pages.
 */
export async function registerCsrfInjector(fastify: FastifyInstance): Promise<void> {
  // Only inject if session auth is enabled
  if (!config.SESSION_AUTH_REQUIRED) {
    console.log('[CsrfInjector] Session auth disabled, skipping CSRF injection')
    return
  }

  // Read the base HTML template
  const publicDir = path.join(__dirname, '../../public')
  const indexPath = path.join(publicDir, 'index.html')

  // Route handler for root path to inject CSRF
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Read the HTML file
      let html = fs.readFileSync(indexPath, 'utf-8')

      // Generate a fresh CSRF token
      const csrfToken = generateCsrfToken()

      // Inject the CSRF token as a meta tag in the head
      // Look for </head> and insert before it
      const csrfMeta = `<meta name="csrf-token" content="${csrfToken}">\n  </head>`
      html = html.replace('</head>', csrfMeta)

      // Also add a script to auto-create session
      const sessionScript = `
    <script>
      // Auto-create session on page load
      (function() {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
        if (!csrfToken) return;

        // Check if we already have a session
        fetch('/api/v1/auth/session/status', { credentials: 'include' })
          .then(r => r.json())
          .then(data => {
            if (!data.valid) {
              // Create new session
              return fetch('/api/v1/auth/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ csrfToken })
              });
            }
          })
          .catch(console.error);
      })();
    </script>
  </body>`
      html = html.replace('</body>', sessionScript)

      reply.type('text/html').send(html)
    } catch (error) {
      // If file not found, return 404
      reply.status(404).send({ error: 'Page not found' })
    }
  })

  console.log('[CsrfInjector] CSRF token injection registered for root path')
}
