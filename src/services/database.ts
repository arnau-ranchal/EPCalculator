import Database from 'better-sqlite3'
import { config } from '../config/index.js'
import path from 'path'
import fs from 'fs'

export interface ComputationRecord {
  id?: number
  timestamp: string
  parameters: string // JSON stringified parameters
  results: string // JSON stringified results
  computation_time_ms: number
  user_session?: string
  ip_address?: string
}

export interface UsageRecord {
  id?: number
  timestamp: string
  endpoint: string
  user_session?: string
  ip_address?: string
  response_time_ms: number
  status_code: number
}

// API Key interfaces for authentication and usage tracking
export interface ApiKeyRecord {
  id: number
  key_prefix: string
  key_hint: string
  key_hash: string
  owner_name: string
  owner_email: string | null
  tier: 'free' | 'standard' | 'premium'
  is_active: number  // SQLite uses 0/1 for boolean
  created_at: string
  expires_at: string | null
  last_used_at: string | null
  total_requests: number
  total_credits_used: number  // Track for future billing
}

export interface ApiUsageRecord {
  id?: number
  key_id: number
  timestamp: string
  endpoint: string
  request_cost: number  // Computed cost (tracked, not enforced)
  computation_params: string | null  // JSON summary of params
}

export class DatabaseService {
  private static instance: DatabaseService
  private db: Database.Database | null = null
  private isInitialized = false

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      // Ensure data directory exists
      const dbDir = path.dirname(config.DATABASE_PATH)
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true })
      }

      // Open database connection
      this.db = new Database(config.DATABASE_PATH, {
        verbose: config.NODE_ENV === 'development' ? console.log : undefined
      })

      // Configure SQLite settings
      if (config.DATABASE_WAL_MODE) {
        this.db.pragma('journal_mode = WAL')
      }
      this.db.pragma('synchronous = NORMAL')
      this.db.pragma('cache_size = 1000')
      this.db.pragma('temp_store = memory')

      // Create tables
      this.createTables()

      // Setup cleanup job
      this.setupCleanupJob()

      this.isInitialized = true
      console.log('✅ Database initialized successfully')

    } catch (error) {
      console.error('❌ Database initialization failed:', error)
      throw error
    }
  }

  private createTables(): void {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    // Computations table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS computations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        parameters TEXT NOT NULL,
        results TEXT NOT NULL,
        computation_time_ms INTEGER NOT NULL,
        user_session TEXT,
        ip_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Usage analytics table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS usage_analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        user_session TEXT,
        ip_address TEXT,
        response_time_ms INTEGER NOT NULL,
        status_code INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // User sessions table (for tracking university usage)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT UNIQUE NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        computation_count INTEGER DEFAULT 0
      )
    `)

    // Create indexes for performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_computations_timestamp ON computations(timestamp);
      CREATE INDEX IF NOT EXISTS idx_computations_session ON computations(user_session);
      CREATE INDEX IF NOT EXISTS idx_usage_timestamp ON usage_analytics(timestamp);
      CREATE INDEX IF NOT EXISTS idx_usage_endpoint ON usage_analytics(endpoint);
      CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON user_sessions(session_id);
    `)

    // API Keys table for authentication
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key_prefix TEXT NOT NULL,
        key_hint TEXT NOT NULL,
        key_hash TEXT NOT NULL UNIQUE,
        owner_name TEXT NOT NULL,
        owner_email TEXT,
        tier TEXT DEFAULT 'free',
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        last_used_at DATETIME,
        total_requests INTEGER DEFAULT 0,
        total_credits_used INTEGER DEFAULT 0,
        UNIQUE(key_prefix, key_hint)
      )
    `)

    // API Usage tracking (for future billing)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS api_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key_id INTEGER NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        endpoint TEXT NOT NULL,
        request_cost INTEGER DEFAULT 1,
        computation_params TEXT,
        FOREIGN KEY (key_id) REFERENCES api_keys(id) ON DELETE CASCADE
      )
    `)

    // API Keys indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_api_keys_prefix_hint ON api_keys(key_prefix, key_hint);
      CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);
      CREATE INDEX IF NOT EXISTS idx_api_usage_key_id ON api_usage(key_id);
      CREATE INDEX IF NOT EXISTS idx_api_usage_timestamp ON api_usage(timestamp);
    `)
  }

  private setupCleanupJob(): void {
    // Clean up old records every hour
    setInterval(() => {
      this.cleanupOldRecords()
    }, 60 * 60 * 1000) // 1 hour
  }

  private cleanupOldRecords(): void {
    if (!this.db) return

    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

      // Keep only last 30 days of data
      const deletedComputations = this.db.prepare(`
        DELETE FROM computations WHERE created_at < ?
      `).run(thirtyDaysAgo)

      const deletedUsage = this.db.prepare(`
        DELETE FROM usage_analytics WHERE created_at < ?
      `).run(thirtyDaysAgo)

      if (deletedComputations.changes > 0 || deletedUsage.changes > 0) {
        console.log(`🧹 Cleaned up ${deletedComputations.changes} computation records and ${deletedUsage.changes} usage records`)
      }

      // Vacuum database to reclaim space
      this.db.exec('VACUUM')

    } catch (error) {
      console.error('Error during database cleanup:', error)
    }
  }

  // Computation record methods
  async saveComputation(record: Omit<ComputationRecord, 'id'>): Promise<number> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const stmt = this.db.prepare(`
      INSERT INTO computations (timestamp, parameters, results, computation_time_ms, user_session, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `)

    const result = stmt.run(
      record.timestamp,
      record.parameters,
      record.results,
      record.computation_time_ms,
      record.user_session,
      record.ip_address
    )

    return result.lastInsertRowid as number
  }

  async getComputationHistory(sessionId?: string, limit = 100): Promise<ComputationRecord[]> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    let query = 'SELECT * FROM computations'
    let params: any[] = []

    if (sessionId) {
      query += ' WHERE user_session = ?'
      params = [sessionId]
    }

    query += ' ORDER BY created_at DESC LIMIT ?'
    params.push(limit)

    const stmt = this.db.prepare(query)
    return stmt.all(...params) as ComputationRecord[]
  }

  // Usage analytics methods
  async recordUsage(record: Omit<UsageRecord, 'id'>): Promise<void> {
    if (!this.db || !config.ENABLE_USAGE_ANALYTICS) {
      return
    }

    const stmt = this.db.prepare(`
      INSERT INTO usage_analytics (timestamp, endpoint, user_session, ip_address, response_time_ms, status_code)
      VALUES (?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      record.timestamp,
      record.endpoint,
      record.user_session,
      record.ip_address,
      record.response_time_ms,
      record.status_code
    )
  }

  // User session methods
  async updateUserSession(sessionId: string, ipAddress: string, userAgent: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const stmt = this.db.prepare(`
      INSERT INTO user_sessions (session_id, ip_address, user_agent, computation_count)
      VALUES (?, ?, ?, 1)
      ON CONFLICT(session_id) DO UPDATE SET
        last_seen = CURRENT_TIMESTAMP,
        computation_count = computation_count + 1
    `)

    stmt.run(sessionId, ipAddress, userAgent)
  }

  async getActiveUsers(timeWindowMinutes = 60): Promise<number> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const cutoff = new Date(Date.now() - timeWindowMinutes * 60 * 1000).toISOString()

    const stmt = this.db.prepare(`
      SELECT COUNT(DISTINCT session_id) as count
      FROM user_sessions
      WHERE last_seen > ?
    `)

    const result = stmt.get(cutoff) as { count: number }
    return result.count
  }

  // Cache methods for computation results
  async getCachedResult(parametersHash: string): Promise<string | null> {
    if (!this.db || !config.ENABLE_COMPUTATION_CACHE) {
      return null
    }

    const cutoff = new Date(Date.now() - config.CACHE_TTL * 1000).toISOString()

    const stmt = this.db.prepare(`
      SELECT results FROM computations
      WHERE parameters = ? AND timestamp > ?
      ORDER BY timestamp DESC
      LIMIT 1
    `)

    const result = stmt.get(parametersHash, cutoff) as { results: string } | undefined
    return result?.results || null
  }

  /**
   * Batch lookup of cached results for multiple parameter hashes.
   * Returns a Map of hash → results JSON string for all found entries.
   * This is much more efficient than N individual getCachedResult calls.
   */
  async getBatchCachedResults(parameterHashes: string[]): Promise<Map<string, string>> {
    const results = new Map<string, string>()

    if (!this.db || !config.ENABLE_COMPUTATION_CACHE || parameterHashes.length === 0) {
      return results
    }

    const cutoff = new Date(Date.now() - config.CACHE_TTL * 1000).toISOString()

    // Use a single query with IN clause for efficiency
    // We need the most recent result for each unique hash
    const placeholders = parameterHashes.map(() => '?').join(',')

    // SQLite query: Get most recent cached result for each hash
    // Using a subquery to get the max timestamp per parameter, then join to get results
    const stmt = this.db.prepare(`
      SELECT c.parameters, c.results
      FROM computations c
      INNER JOIN (
        SELECT parameters, MAX(timestamp) as max_ts
        FROM computations
        WHERE parameters IN (${placeholders}) AND timestamp > ?
        GROUP BY parameters
      ) latest ON c.parameters = latest.parameters AND c.timestamp = latest.max_ts
    `)

    // Parameters: all hashes, then cutoff
    const queryParams = [...parameterHashes, cutoff]
    const rows = stmt.all(...queryParams) as Array<{ parameters: string; results: string }>

    for (const row of rows) {
      results.set(row.parameters, row.results)
    }

    return results
  }

  // Database statistics
  async getStatistics(): Promise<{
    totalComputations: number
    totalUsers: number
    activeUsers: number
    averageComputationTime: number
    databaseSize: number
  }> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const stats = {
      totalComputations: 0,
      totalUsers: 0,
      activeUsers: 0,
      averageComputationTime: 0,
      databaseSize: 0
    }

    try {
      // Total computations
      const computationsResult = this.db.prepare('SELECT COUNT(*) as count FROM computations').get() as { count: number }
      stats.totalComputations = computationsResult.count

      // Total users
      const usersResult = this.db.prepare('SELECT COUNT(*) as count FROM user_sessions').get() as { count: number }
      stats.totalUsers = usersResult.count

      // Active users (last hour)
      stats.activeUsers = await this.getActiveUsers(60)

      // Average computation time
      const avgTimeResult = this.db.prepare('SELECT AVG(computation_time_ms) as avg FROM computations').get() as { avg: number }
      stats.averageComputationTime = avgTimeResult.avg || 0

      // Database size (approximate)
      const sizeResult = this.db.prepare('SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()').get() as { size: number }
      stats.databaseSize = sizeResult.size

    } catch (error) {
      console.error('Error getting database statistics:', error)
    }

    return stats
  }

  // ============================================
  // API Key Methods
  // ============================================

  /**
   * Find an API key by prefix and hint (for efficient lookup).
   * Returns the full record if found, null otherwise.
   */
  async getApiKeyByHint(prefix: string, hint: string): Promise<ApiKeyRecord | null> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const stmt = this.db.prepare(`
      SELECT * FROM api_keys
      WHERE key_prefix = ? AND key_hint = ? AND is_active = 1
    `)

    const result = stmt.get(prefix, hint) as ApiKeyRecord | undefined
    return result || null
  }

  /**
   * Create a new API key record.
   * Returns the inserted ID.
   */
  async createApiKey(
    keyPrefix: string,
    keyHint: string,
    keyHash: string,
    ownerName: string,
    ownerEmail?: string,
    tier: 'free' | 'standard' | 'premium' = 'free',
    expiresAt?: Date
  ): Promise<number> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const stmt = this.db.prepare(`
      INSERT INTO api_keys (key_prefix, key_hint, key_hash, owner_name, owner_email, tier, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    const result = stmt.run(
      keyPrefix,
      keyHint,
      keyHash,
      ownerName,
      ownerEmail || null,
      tier,
      expiresAt?.toISOString() || null
    )

    return result.lastInsertRowid as number
  }

  /**
   * Update last_used_at and increment total_requests for an API key.
   */
  async updateApiKeyUsage(keyId: number, creditsCost: number = 1): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const stmt = this.db.prepare(`
      UPDATE api_keys
      SET last_used_at = CURRENT_TIMESTAMP,
          total_requests = total_requests + 1,
          total_credits_used = total_credits_used + ?
      WHERE id = ?
    `)

    stmt.run(creditsCost, keyId)
  }

  /**
   * Record API usage for future billing.
   */
  async recordApiUsage(
    keyId: number,
    endpoint: string,
    requestCost: number,
    computationParams?: object
  ): Promise<void> {
    if (!this.db) {
      return
    }

    const stmt = this.db.prepare(`
      INSERT INTO api_usage (key_id, endpoint, request_cost, computation_params)
      VALUES (?, ?, ?, ?)
    `)

    stmt.run(
      keyId,
      endpoint,
      requestCost,
      computationParams ? JSON.stringify(computationParams) : null
    )
  }

  /**
   * List all API keys (for admin).
   */
  async listApiKeys(): Promise<Omit<ApiKeyRecord, 'key_hash'>[]> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const stmt = this.db.prepare(`
      SELECT id, key_prefix, key_hint, owner_name, owner_email, tier,
             is_active, created_at, expires_at, last_used_at,
             total_requests, total_credits_used
      FROM api_keys
      ORDER BY created_at DESC
    `)

    return stmt.all() as Omit<ApiKeyRecord, 'key_hash'>[]
  }

  /**
   * Revoke (deactivate) an API key.
   */
  async revokeApiKey(keyId: number): Promise<boolean> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const stmt = this.db.prepare(`
      UPDATE api_keys SET is_active = 0 WHERE id = ?
    `)

    const result = stmt.run(keyId)
    return result.changes > 0
  }

  /**
   * Get usage statistics for an API key.
   */
  async getApiKeyUsageStats(keyId: number, days: number = 30): Promise<{
    totalRequests: number
    totalCredits: number
    usageByEndpoint: Array<{ endpoint: string; count: number; credits: number }>
  }> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    // Total stats
    const totalStmt = this.db.prepare(`
      SELECT COUNT(*) as total_requests, COALESCE(SUM(request_cost), 0) as total_credits
      FROM api_usage
      WHERE key_id = ? AND timestamp > ?
    `)
    const totals = totalStmt.get(keyId, cutoff) as { total_requests: number; total_credits: number }

    // By endpoint
    const byEndpointStmt = this.db.prepare(`
      SELECT endpoint, COUNT(*) as count, COALESCE(SUM(request_cost), 0) as credits
      FROM api_usage
      WHERE key_id = ? AND timestamp > ?
      GROUP BY endpoint
      ORDER BY credits DESC
    `)
    const usageByEndpoint = byEndpointStmt.all(keyId, cutoff) as Array<{ endpoint: string; count: number; credits: number }>

    return {
      totalRequests: totals.total_requests,
      totalCredits: totals.total_credits,
      usageByEndpoint
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close()
      this.db = null
      this.isInitialized = false
      console.log('✅ Database connection closed')
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    if (!this.db) {
      return false
    }

    try {
      this.db.prepare('SELECT 1').get()
      return true
    } catch {
      return false
    }
  }
}