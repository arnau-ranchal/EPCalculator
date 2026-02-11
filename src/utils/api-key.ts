/**
 * API Key Utilities
 *
 * Key Format: epc_live_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
 *             ^^^^^^^^^ ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
 *             prefix    43 chars of base64url (32 bytes = 256 bits)
 *
 * - Prefix identifies the environment (epc_live_ or epc_test_)
 * - Random part provides 256 bits of entropy (same as Stripe, GitHub)
 * - Base64url encoding is URL-safe (no +, /, or = characters)
 */

import { randomBytes } from 'crypto'
import * as argon2 from 'argon2'

// Key format constants
export const KEY_PREFIX_LIVE = 'epc_live_'
export const KEY_PREFIX_TEST = 'epc_test_'
export const KEY_RANDOM_BYTES = 32 // 256 bits of entropy
export const KEY_HINT_LENGTH = 8   // First 8 chars of random part for display

// Argon2id parameters (OWASP recommended)
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536,    // 64 MB
  timeCost: 3,          // 3 iterations
  parallelism: 4,       // 4 threads
  hashLength: 32        // 256-bit output
} as const

/**
 * Generate a new API key with the specified environment prefix.
 *
 * @param environment - 'live' for production, 'test' for testing
 * @returns The generated API key string
 *
 * @example
 * const key = generateApiKey('live')
 * // Returns: "epc_live_7K4mNvQ2xR8sT1wY3zA5bC6dE9fG0hJ1kL2mN4oP5qR"
 */
export function generateApiKey(environment: 'live' | 'test' = 'live'): string {
  const prefix = environment === 'live' ? KEY_PREFIX_LIVE : KEY_PREFIX_TEST
  const randomPart = randomBytes(KEY_RANDOM_BYTES).toString('base64url')
  return prefix + randomPart
}

/**
 * Validate the format of an API key.
 * Does NOT verify if the key exists or is valid - just checks format.
 *
 * @param key - The API key to validate
 * @returns true if format is valid, false otherwise
 */
export function isValidKeyFormat(key: string): boolean {
  // Must start with epc_live_ or epc_test_
  // Followed by exactly 43 characters of base64url
  return /^epc_(live|test)_[A-Za-z0-9_-]{43}$/.test(key)
}

/**
 * Parse an API key into its components.
 *
 * @param key - The API key to parse
 * @returns Object with prefix, hint, and full key, or null if invalid format
 */
export function parseApiKey(key: string): {
  prefix: string    // "epc_live_" or "epc_test_"
  hint: string      // First 8 chars of random part (for display/lookup)
  environment: 'live' | 'test'
  fullKey: string   // The complete key
} | null {
  if (!isValidKeyFormat(key)) {
    return null
  }

  const prefix = key.substring(0, 9) // "epc_live_" or "epc_test_"
  const randomPart = key.substring(9)
  const hint = randomPart.substring(0, KEY_HINT_LENGTH)
  const environment = prefix === KEY_PREFIX_LIVE ? 'live' : 'test'

  return {
    prefix,
    hint,
    environment,
    fullKey: key
  }
}

/**
 * Hash an API key using Argon2id.
 * This should be used when storing a key in the database.
 *
 * @param key - The API key to hash
 * @returns The Argon2id hash of the key
 */
export async function hashApiKey(key: string): Promise<string> {
  // Use type: 2 explicitly for argon2id (avoids ESM interop issues)
  // OWASP recommended settings for API key hashing
  return argon2.hash(key, {
    type: 2,              // argon2id
    memoryCost: 65536,    // 64 MB
    timeCost: 3,          // 3 iterations
    parallelism: 4,       // 4 threads
    hashLength: 32        // 256-bit output
  })
}

/**
 * Verify an API key against its stored hash.
 * Argon2's verify function is constant-time, preventing timing attacks.
 *
 * @param key - The API key provided by the client
 * @param hash - The stored Argon2id hash
 * @returns true if the key matches the hash, false otherwise
 */
export async function verifyApiKey(key: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, key)
  } catch {
    // If verification fails (e.g., invalid hash format), return false
    return false
  }
}

/**
 * Format a key hint for display (e.g., in admin UI or logs).
 * Shows prefix + hint + masked remainder.
 *
 * @param prefix - The key prefix ("epc_live_" or "epc_test_")
 * @param hint - The key hint (first 8 chars of random part)
 * @returns Formatted string like "epc_live_7K4mNvQ2..."
 */
export function formatKeyForDisplay(prefix: string, hint: string): string {
  return `${prefix}${hint}...`
}
