import Database from 'better-sqlite3';
import { config } from '../config/index.js';
import path from 'path';
import fs from 'fs';
export class DatabaseService {
    static instance;
    db = null;
    isInitialized = false;
    constructor() { }
    static getInstance() {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }
    async initialize() {
        if (this.isInitialized) {
            return;
        }
        try {
            // Ensure data directory exists
            const dbDir = path.dirname(config.DATABASE_PATH);
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }
            // Open database connection
            this.db = new Database(config.DATABASE_PATH, {
                verbose: config.NODE_ENV === 'development' ? console.log : undefined
            });
            // Configure SQLite settings
            if (config.DATABASE_WAL_MODE) {
                this.db.pragma('journal_mode = WAL');
            }
            this.db.pragma('synchronous = NORMAL');
            this.db.pragma('cache_size = 1000');
            this.db.pragma('temp_store = memory');
            // Create tables
            this.createTables();
            // Setup cleanup job
            this.setupCleanupJob();
            this.isInitialized = true;
            console.log('✅ Database initialized successfully');
        }
        catch (error) {
            console.error('❌ Database initialization failed:', error);
            throw error;
        }
    }
    createTables() {
        if (!this.db) {
            throw new Error('Database not initialized');
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
    `);
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
    `);
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
    `);
        // Create indexes for performance
        this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_computations_timestamp ON computations(timestamp);
      CREATE INDEX IF NOT EXISTS idx_computations_session ON computations(user_session);
      CREATE INDEX IF NOT EXISTS idx_usage_timestamp ON usage_analytics(timestamp);
      CREATE INDEX IF NOT EXISTS idx_usage_endpoint ON usage_analytics(endpoint);
      CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON user_sessions(session_id);
    `);
    }
    setupCleanupJob() {
        // Clean up old records every hour
        setInterval(() => {
            this.cleanupOldRecords();
        }, 60 * 60 * 1000); // 1 hour
    }
    cleanupOldRecords() {
        if (!this.db)
            return;
        try {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
            // Keep only last 30 days of data
            const deletedComputations = this.db.prepare(`
        DELETE FROM computations WHERE created_at < ?
      `).run(thirtyDaysAgo);
            const deletedUsage = this.db.prepare(`
        DELETE FROM usage_analytics WHERE created_at < ?
      `).run(thirtyDaysAgo);
            if (deletedComputations.changes > 0 || deletedUsage.changes > 0) {
                console.log(`🧹 Cleaned up ${deletedComputations.changes} computation records and ${deletedUsage.changes} usage records`);
            }
            // Vacuum database to reclaim space
            this.db.exec('VACUUM');
        }
        catch (error) {
            console.error('Error during database cleanup:', error);
        }
    }
    // Computation record methods
    async saveComputation(record) {
        if (!this.db) {
            throw new Error('Database not initialized');
        }
        const stmt = this.db.prepare(`
      INSERT INTO computations (timestamp, parameters, results, computation_time_ms, user_session, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
        const result = stmt.run(record.timestamp, record.parameters, record.results, record.computation_time_ms, record.user_session, record.ip_address);
        return result.lastInsertRowid;
    }
    async getComputationHistory(sessionId, limit = 100) {
        if (!this.db) {
            throw new Error('Database not initialized');
        }
        let query = 'SELECT * FROM computations';
        let params = [];
        if (sessionId) {
            query += ' WHERE user_session = ?';
            params = [sessionId];
        }
        query += ' ORDER BY created_at DESC LIMIT ?';
        params.push(limit);
        const stmt = this.db.prepare(query);
        return stmt.all(...params);
    }
    // Usage analytics methods
    async recordUsage(record) {
        if (!this.db || !config.ENABLE_USAGE_ANALYTICS) {
            return;
        }
        const stmt = this.db.prepare(`
      INSERT INTO usage_analytics (timestamp, endpoint, user_session, ip_address, response_time_ms, status_code)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
        stmt.run(record.timestamp, record.endpoint, record.user_session, record.ip_address, record.response_time_ms, record.status_code);
    }
    // User session methods
    async updateUserSession(sessionId, ipAddress, userAgent) {
        if (!this.db) {
            throw new Error('Database not initialized');
        }
        const stmt = this.db.prepare(`
      INSERT INTO user_sessions (session_id, ip_address, user_agent, computation_count)
      VALUES (?, ?, ?, 1)
      ON CONFLICT(session_id) DO UPDATE SET
        last_seen = CURRENT_TIMESTAMP,
        computation_count = computation_count + 1
    `);
        stmt.run(sessionId, ipAddress, userAgent);
    }
    async getActiveUsers(timeWindowMinutes = 60) {
        if (!this.db) {
            throw new Error('Database not initialized');
        }
        const cutoff = new Date(Date.now() - timeWindowMinutes * 60 * 1000).toISOString();
        const stmt = this.db.prepare(`
      SELECT COUNT(DISTINCT session_id) as count
      FROM user_sessions
      WHERE last_seen > ?
    `);
        const result = stmt.get(cutoff);
        return result.count;
    }
    // Cache methods for computation results
    async getCachedResult(parametersHash) {
        if (!this.db || !config.ENABLE_COMPUTATION_CACHE) {
            return null;
        }
        const cutoff = new Date(Date.now() - config.CACHE_TTL * 1000).toISOString();
        const stmt = this.db.prepare(`
      SELECT results FROM computations
      WHERE parameters = ? AND timestamp > ?
      ORDER BY timestamp DESC
      LIMIT 1
    `);
        const result = stmt.get(parametersHash, cutoff);
        return result?.results || null;
    }
    // Database statistics
    async getStatistics() {
        if (!this.db) {
            throw new Error('Database not initialized');
        }
        const stats = {
            totalComputations: 0,
            totalUsers: 0,
            activeUsers: 0,
            averageComputationTime: 0,
            databaseSize: 0
        };
        try {
            // Total computations
            const computationsResult = this.db.prepare('SELECT COUNT(*) as count FROM computations').get();
            stats.totalComputations = computationsResult.count;
            // Total users
            const usersResult = this.db.prepare('SELECT COUNT(*) as count FROM user_sessions').get();
            stats.totalUsers = usersResult.count;
            // Active users (last hour)
            stats.activeUsers = await this.getActiveUsers(60);
            // Average computation time
            const avgTimeResult = this.db.prepare('SELECT AVG(computation_time_ms) as avg FROM computations').get();
            stats.averageComputationTime = avgTimeResult.avg || 0;
            // Database size (approximate)
            const sizeResult = this.db.prepare('SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()').get();
            stats.databaseSize = sizeResult.size;
        }
        catch (error) {
            console.error('Error getting database statistics:', error);
        }
        return stats;
    }
    async close() {
        if (this.db) {
            this.db.close();
            this.db = null;
            this.isInitialized = false;
            console.log('✅ Database connection closed');
        }
    }
    // Health check
    async healthCheck() {
        if (!this.db) {
            return false;
        }
        try {
            this.db.prepare('SELECT 1').get();
            return true;
        }
        catch {
            return false;
        }
    }
}
