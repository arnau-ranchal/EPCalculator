/**
 * API Key Service
 *
 * High-level service for managing API keys:
 * - Create new keys
 * - Validate and authenticate requests
 * - Track usage for future billing
 */

import { DatabaseService, ApiKeyRecord } from './database.js'
import {
  generateApiKey,
  parseApiKey,
  hashApiKey,
  verifyApiKey,
  isValidKeyFormat,
  formatKeyForDisplay
} from '../utils/api-key.js'

export interface ApiKeyInfo {
  id: number
  prefix: string
  hint: string
  displayKey: string          // Masked key for display (prefix + hint + ...)
  ownerName: string
  ownerEmail: string | null
  tier: 'free' | 'standard' | 'premium'
  isActive: boolean
  createdAt: Date
  expiresAt: Date | null
  lastUsedAt: Date | null
  totalRequests: number
  totalCreditsUsed: number
}

export interface CreateApiKeyResult {
  key: string          // The actual key (only returned once!)
  keyDisplay: string   // Masked version for display
  id: number
  ownerName: string
  tier: string
}

export interface ValidateKeyResult {
  valid: boolean
  keyInfo?: ApiKeyInfo
  error?: string
}

export class ApiKeyService {
  private static instance: ApiKeyService
  private db: DatabaseService

  private constructor() {
    this.db = DatabaseService.getInstance()
  }

  static getInstance(): ApiKeyService {
    if (!ApiKeyService.instance) {
      ApiKeyService.instance = new ApiKeyService()
    }
    return ApiKeyService.instance
  }

  /**
   * Create a new API key.
   * IMPORTANT: The returned key is only shown ONCE. Store it securely!
   */
  async createKey(
    ownerName: string,
    ownerEmail?: string,
    tier: 'free' | 'standard' | 'premium' = 'free',
    environment: 'live' | 'test' = 'live',
    expiresAt?: Date
  ): Promise<CreateApiKeyResult> {
    // Generate the key
    const key = generateApiKey(environment)
    const parsed = parseApiKey(key)

    if (!parsed) {
      throw new Error('Failed to generate valid API key')
    }

    // Hash for storage
    const keyHash = await hashApiKey(key)

    // Store in database
    const id = await this.db.createApiKey(
      parsed.prefix,
      parsed.hint,
      keyHash,
      ownerName,
      ownerEmail,
      tier,
      expiresAt
    )

    console.log(`[ApiKeyService] Created API key for ${ownerName} (${tier} tier)`)

    return {
      key,  // Only time the full key is returned!
      keyDisplay: formatKeyForDisplay(parsed.prefix, parsed.hint),
      id,
      ownerName,
      tier
    }
  }

  /**
   * Validate an API key from a request.
   * Returns key info if valid, error message if not.
   */
  async validateKey(apiKey: string): Promise<ValidateKeyResult> {
    // Check format first (fast, no DB lookup)
    if (!isValidKeyFormat(apiKey)) {
      return {
        valid: false,
        error: 'Invalid API key format'
      }
    }

    // Parse key to get prefix and hint
    const parsed = parseApiKey(apiKey)
    if (!parsed) {
      return {
        valid: false,
        error: 'Failed to parse API key'
      }
    }

    // Look up key by prefix + hint
    const keyRecord = await this.db.getApiKeyByHint(parsed.prefix, parsed.hint)

    if (!keyRecord) {
      return {
        valid: false,
        error: 'API key not found'
      }
    }

    // Check if key is active
    if (!keyRecord.is_active) {
      return {
        valid: false,
        error: 'API key has been revoked'
      }
    }

    // Check expiration
    if (keyRecord.expires_at) {
      const expiresAt = new Date(keyRecord.expires_at)
      if (expiresAt < new Date()) {
        return {
          valid: false,
          error: 'API key has expired'
        }
      }
    }

    // Verify the key hash (constant-time comparison)
    const isValid = await verifyApiKey(apiKey, keyRecord.key_hash)

    if (!isValid) {
      // Hash doesn't match - possible tampering or collision
      return {
        valid: false,
        error: 'Invalid API key'
      }
    }

    // Key is valid! Return info
    return {
      valid: true,
      keyInfo: this.recordToInfo(keyRecord)
    }
  }

  /**
   * Record usage for an API key (for future billing).
   */
  async recordUsage(
    keyId: number,
    endpoint: string,
    creditsCost: number,
    computationParams?: object
  ): Promise<void> {
    // Update key stats
    await this.db.updateApiKeyUsage(keyId, creditsCost)

    // Record detailed usage
    await this.db.recordApiUsage(keyId, endpoint, creditsCost, computationParams)
  }

  /**
   * List all API keys (for admin).
   */
  async listKeys(): Promise<ApiKeyInfo[]> {
    const records = await this.db.listApiKeys()
    return records.map(r => this.recordToInfo(r as ApiKeyRecord))
  }

  /**
   * Revoke an API key.
   */
  async revokeKey(keyId: number): Promise<boolean> {
    const revoked = await this.db.revokeApiKey(keyId)
    if (revoked) {
      console.log(`[ApiKeyService] Revoked API key ID ${keyId}`)
    }
    return revoked
  }

  /**
   * Get usage statistics for an API key.
   */
  async getKeyStats(keyId: number, days: number = 30) {
    return this.db.getApiKeyUsageStats(keyId, days)
  }

  /**
   * Convert database record to API info object.
   */
  private recordToInfo(record: ApiKeyRecord | Omit<ApiKeyRecord, 'key_hash'>): ApiKeyInfo {
    return {
      id: record.id,
      prefix: record.key_prefix,
      hint: record.key_hint,
      displayKey: formatKeyForDisplay(record.key_prefix, record.key_hint),
      ownerName: record.owner_name,
      ownerEmail: record.owner_email,
      tier: record.tier as 'free' | 'standard' | 'premium',
      isActive: record.is_active === 1,
      createdAt: new Date(record.created_at),
      expiresAt: record.expires_at ? new Date(record.expires_at) : null,
      lastUsedAt: record.last_used_at ? new Date(record.last_used_at) : null,
      totalRequests: record.total_requests,
      totalCreditsUsed: record.total_credits_used
    }
  }
}
