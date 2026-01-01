export interface ComputationRecord {
    id?: number;
    timestamp: string;
    parameters: string;
    results: string;
    computation_time_ms: number;
    user_session?: string;
    ip_address?: string;
}
export interface UsageRecord {
    id?: number;
    timestamp: string;
    endpoint: string;
    user_session?: string;
    ip_address?: string;
    response_time_ms: number;
    status_code: number;
}
export declare class DatabaseService {
    private static instance;
    private db;
    private isInitialized;
    private constructor();
    static getInstance(): DatabaseService;
    initialize(): Promise<void>;
    private createTables;
    private setupCleanupJob;
    private cleanupOldRecords;
    saveComputation(record: Omit<ComputationRecord, 'id'>): Promise<number>;
    getComputationHistory(sessionId?: string, limit?: number): Promise<ComputationRecord[]>;
    recordUsage(record: Omit<UsageRecord, 'id'>): Promise<void>;
    updateUserSession(sessionId: string, ipAddress: string, userAgent: string): Promise<void>;
    getActiveUsers(timeWindowMinutes?: number): Promise<number>;
    getCachedResult(parametersHash: string): Promise<string | null>;
    getStatistics(): Promise<{
        totalComputations: number;
        totalUsers: number;
        activeUsers: number;
        averageComputationTime: number;
        databaseSize: number;
    }>;
    close(): Promise<void>;
    healthCheck(): Promise<boolean>;
}
