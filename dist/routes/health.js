import { Type } from '@sinclair/typebox';
import { ComputationService } from '../services/computation.js';
import { DatabaseService } from '../services/database.js';
import { universityConfig } from '../config/index.js';
export async function healthRoutes(fastify) {
    // Detailed health check
    fastify.get('/health', {
        schema: {
            tags: ['health'],
            summary: 'Comprehensive health check',
            response: {
                200: Type.Object({
                    status: Type.String(),
                    timestamp: Type.String(),
                    version: Type.String(),
                    uptime: Type.Number(),
                    services: Type.Object({
                        database: Type.Boolean(),
                        computation: Type.Boolean()
                    }),
                    university: Type.Object({
                        name: Type.String(),
                        activeUsers: Type.Number(),
                        maxUsers: Type.Number()
                    }),
                    resources: Type.Object({
                        memory: Type.Object({
                            used: Type.Number(),
                            total: Type.Number(),
                            percentage: Type.Number()
                        }),
                        activeComputations: Type.Number()
                    })
                })
            }
        }
    }, async (request, reply) => {
        const db = DatabaseService.getInstance();
        const computation = ComputationService.getInstance();
        // Check service health
        const dbHealth = await db.healthCheck();
        const activeUsers = await db.getActiveUsers();
        const computationStats = await computation.getComputationStats();
        // Memory usage
        const memUsage = process.memoryUsage();
        const memTotal = memUsage.heapTotal;
        const memUsed = memUsage.heapUsed;
        const memPercentage = Math.round((memUsed / memTotal) * 100);
        const healthStatus = {
            status: dbHealth ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            version: '2.0.0',
            uptime: Math.round(process.uptime()),
            services: {
                database: dbHealth,
                computation: true // Always true if service is running
            },
            university: {
                name: universityConfig.name,
                activeUsers,
                maxUsers: universityConfig.maxUsers
            },
            resources: {
                memory: {
                    used: Math.round(memUsed / 1024 / 1024), // MB
                    total: Math.round(memTotal / 1024 / 1024), // MB
                    percentage: memPercentage
                },
                activeComputations: computationStats.activeComputations
            }
        };
        return healthStatus;
    });
    // Simple liveness probe (for Kubernetes)
    fastify.get('/health/live', {
        schema: {
            tags: ['health'],
            summary: 'Liveness probe for Kubernetes',
            response: {
                200: Type.Object({
                    status: Type.String()
                })
            }
        }
    }, async (request, reply) => {
        return { status: 'alive' };
    });
    // Readiness probe (for Kubernetes)
    fastify.get('/health/ready', {
        schema: {
            tags: ['health'],
            summary: 'Readiness probe for Kubernetes',
            response: {
                200: Type.Object({
                    status: Type.String()
                }),
                503: Type.Object({
                    status: Type.String(),
                    error: Type.String()
                })
            }
        }
    }, async (request, reply) => {
        const db = DatabaseService.getInstance();
        const dbHealth = await db.healthCheck();
        if (!dbHealth) {
            reply.status(503);
            return {
                status: 'not ready',
                error: 'Database connection failed'
            };
        }
        return { status: 'ready' };
    });
}
