/**
 * CSRF Token Management
 *
 * Provides protection against Cross-Site Request Forgery attacks.
 * CSRF tokens are:
 * - Generated when the HTML page is served
 * - Embedded in the page as a <meta> tag
 * - Required when creating a browser session
 * - One-time use (invalidated after use)
 * - Short-lived (5 minute TTL)
 */

import { randomBytes } from 'crypto'

interface CsrfTokenEntry {
  createdAt: Date
  used: boolean
}

// In-memory store for valid CSRF tokens
// Note: In a multi-server setup, this would need to be Redis or similar
const csrfTokens = new Map<string, CsrfTokenEntry>()

// Configuration
const CSRF_TTL_MS = 5 * 60 * 1000  // 5 minutes
const CLEANUP_INTERVAL_MS = 60 * 1000  // Run cleanup every minute

/**
 * Generate a new CSRF token.
 * Token is 32 random bytes encoded as hex (64 characters).
 */
export function generateCsrfToken(): string {
  const token = randomBytes(32).toString('hex')
  csrfTokens.set(token, {
    createdAt: new Date(),
    used: false
  })
  return token
}

/**
 * Validate and consume a CSRF token.
 * Returns true if token is valid (exists, not used, not expired).
 * Token is marked as used after validation (one-time use).
 */
export function validateCsrfToken(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false
  }

  const entry = csrfTokens.get(token)
  if (!entry) {
    return false
  }

  // Check if already used
  if (entry.used) {
    return false
  }

  // Check TTL
  const age = Date.now() - entry.createdAt.getTime()
  if (age > CSRF_TTL_MS) {
    csrfTokens.delete(token)
    return false
  }

  // Mark as used (one-time use)
  entry.used = true
  return true
}

/**
 * Check if a CSRF token exists (without consuming it).
 * Useful for status checks.
 */
export function csrfTokenExists(token: string): boolean {
  const entry = csrfTokens.get(token)
  if (!entry) return false
  if (entry.used) return false

  const age = Date.now() - entry.createdAt.getTime()
  return age <= CSRF_TTL_MS
}

/**
 * Clean up expired tokens.
 * Called automatically on interval.
 */
function cleanupExpiredTokens(): void {
  const now = Date.now()
  let cleaned = 0

  for (const [token, entry] of csrfTokens.entries()) {
    const age = now - entry.createdAt.getTime()
    // Remove if expired OR used (used tokens can be cleaned up after a short delay)
    if (age > CSRF_TTL_MS || (entry.used && age > 60000)) {
      csrfTokens.delete(token)
      cleaned++
    }
  }

  if (cleaned > 0) {
    console.log(`[CSRF] Cleaned up ${cleaned} expired tokens, ${csrfTokens.size} active`)
  }
}

// Start cleanup interval
const cleanupInterval = setInterval(cleanupExpiredTokens, CLEANUP_INTERVAL_MS)

// Ensure cleanup stops when process exits
process.on('exit', () => {
  clearInterval(cleanupInterval)
})

/**
 * Get current token count (for monitoring/debugging).
 */
export function getCsrfTokenCount(): number {
  return csrfTokens.size
}
