import { Type } from '@sinclair/typebox';
import { ComputationService } from '../services/computation.js';
import { generateSessionId } from '../utils/session.js';
const ComputationParametersSchema = Type.Object({
    M: Type.Number({ minimum: 2, maximum: 64 }),
    typeModulation: Type.Union([Type.Literal('PAM'), Type.Literal('PSK'), Type.Literal('QAM')]),
    SNR: Type.Number({ minimum: 0, maximum: 1e20 }),
    R: Type.Number({ minimum: 0, maximum: 1e20 }),
    N: Type.Number({ minimum: 2, maximum: 40 }),
    n: Type.Number({ minimum: 1, maximum: 1000000 }),
    threshold: Type.Number({ minimum: 1e-15, maximum: 0.1 })
});
const ComputationResultSchema = Type.Object({
    error_probability: Type.Number(),
    error_exponent: Type.Number(),
    optimal_rho: Type.Number(),
    computation_time_ms: Type.Number(),
    cached: Type.Boolean()
});
const PlotParametersSchema = Type.Object({
    ...ComputationParametersSchema.properties,
    y: Type.Union([
        Type.Literal('error_probability'),
        Type.Literal('error_exponent'),
        Type.Literal('optimal_rho')
    ]),
    x: Type.Union([
        Type.Literal('M'),
        Type.Literal('SNR'),
        Type.Literal('R'),
        Type.Literal('N'),
        Type.Literal('n'),
        Type.Literal('threshold')
    ]),
    x_range: Type.Tuple([Type.Number(), Type.Number()]),
    points: Type.Number({ minimum: 1, maximum: 1000 }),
    snrUnit: Type.Optional(Type.Union([Type.Literal('dB'), Type.Literal('linear')]))
});
const ContourParametersSchema = Type.Object({
    ...ComputationParametersSchema.properties,
    y: Type.Union([
        Type.Literal('error_probability'),
        Type.Literal('error_exponent'),
        Type.Literal('optimal_rho')
    ]),
    x1: Type.Union([
        Type.Literal('M'),
        Type.Literal('SNR'),
        Type.Literal('R'),
        Type.Literal('N'),
        Type.Literal('n'),
        Type.Literal('threshold')
    ]),
    x2: Type.Union([
        Type.Literal('M'),
        Type.Literal('SNR'),
        Type.Literal('R'),
        Type.Literal('N'),
        Type.Literal('n'),
        Type.Literal('threshold')
    ]),
    x1_range: Type.Tuple([Type.Number(), Type.Number()]),
    x2_range: Type.Tuple([Type.Number(), Type.Number()]),
    points1: Type.Number({ minimum: 1, maximum: 100 }),
    points2: Type.Number({ minimum: 1, maximum: 100 }),
    snrUnit: Type.Optional(Type.Union([Type.Literal('dB'), Type.Literal('linear')]))
});
export async function computationRoutes(fastify) {
    const computationService = ComputationService.getInstance();
    // Helper to extract session info
    function getSessionInfo(request) {
        const sessionId = request.headers['x-session-id'] || generateSessionId();
        const ipAddress = request.ip;
        return { sessionId, ipAddress };
    }
    // Single computation endpoint
    fastify.post('/compute', {
        schema: {
            tags: ['computation'],
            summary: 'Compute error probability metrics for given parameters',
            body: ComputationParametersSchema,
            response: {
                200: ComputationResultSchema,
                400: Type.Object({
                    error: Type.String(),
                    message: Type.String(),
                    statusCode: Type.Number()
                }),
                500: Type.Object({
                    error: Type.String(),
                    message: Type.String(),
                    statusCode: Type.Number()
                })
            }
        }
    }, async (request, reply) => {
        const startTime = Date.now();
        const { sessionId, ipAddress } = getSessionInfo(request);
        try {
            const result = await computationService.computeSingle(request.body, sessionId, ipAddress);
            // Record usage analytics
            const responseTime = Date.now() - startTime;
            await fastify.db.recordUsage({
                timestamp: new Date().toISOString(),
                endpoint: '/api/compute',
                user_session: sessionId,
                ip_address: ipAddress,
                response_time_ms: responseTime,
                status_code: 200
            });
            reply.header('x-session-id', sessionId);
            return result;
        }
        catch (error) {
            fastify.log.error('Computation error:', error);
            const responseTime = Date.now() - startTime;
            await fastify.db.recordUsage({
                timestamp: new Date().toISOString(),
                endpoint: '/api/compute',
                user_session: sessionId,
                ip_address: ipAddress,
                response_time_ms: responseTime,
                status_code: 500
            });
            reply.status(500);
            return {
                error: 'Computation Failed',
                message: error instanceof Error ? error.message : 'Unknown error',
                statusCode: 500
            };
        }
    });
    // Batch computation endpoint
    fastify.post('/compute/batch', {
        schema: {
            tags: ['computation'],
            summary: 'Compute error probability metrics for multiple parameter sets',
            body: Type.Object({
                parameters: Type.Array(ComputationParametersSchema)
            }),
            response: {
                200: Type.Object({
                    results: Type.Array(ComputationResultSchema),
                    total_computation_time_ms: Type.Number()
                })
            }
        }
    }, async (request, reply) => {
        const startTime = Date.now();
        const { sessionId, ipAddress } = getSessionInfo(request);
        try {
            const { parameters } = request.body;
            if (parameters.length > 100) {
                reply.status(400);
                return {
                    error: 'Too Many Computations',
                    message: 'Maximum 100 computations per batch',
                    statusCode: 400
                };
            }
            const results = await computationService.computeBatch(parameters, sessionId, ipAddress);
            const totalComputationTime = Date.now() - startTime;
            reply.header('x-session-id', sessionId);
            return {
                results,
                total_computation_time_ms: totalComputationTime
            };
        }
        catch (error) {
            fastify.log.error('Batch computation error:', error);
            reply.status(500);
            return {
                error: 'Batch Computation Failed',
                message: error instanceof Error ? error.message : 'Unknown error',
                statusCode: 500
            };
        }
    });
    // Plot generation endpoint
    fastify.post('/plot', {
        schema: {
            tags: ['computation'],
            summary: 'Generate plot data for given parameters',
            body: PlotParametersSchema,
            response: {
                200: Type.Object({
                    x_values: Type.Array(Type.Number()),
                    y_values: Type.Array(Type.Number()),
                    computation_time_ms: Type.Number()
                })
            }
        }
    }, async (request, reply) => {
        const startTime = Date.now();
        const { sessionId, ipAddress } = getSessionInfo(request);
        try {
            const result = await computationService.generatePlot(request.body, sessionId, ipAddress);
            const responseTime = Date.now() - startTime;
            await fastify.db.recordUsage({
                timestamp: new Date().toISOString(),
                endpoint: '/api/plot',
                user_session: sessionId,
                ip_address: ipAddress,
                response_time_ms: responseTime,
                status_code: 200
            });
            reply.header('x-session-id', sessionId);
            return result;
        }
        catch (error) {
            fastify.log.error('Plot generation error:', error);
            reply.status(500);
            return {
                error: 'Plot Generation Failed',
                message: error instanceof Error ? error.message : 'Unknown error',
                statusCode: 500
            };
        }
    });
    // Contour plot generation endpoint
    fastify.post('/contour', {
        schema: {
            tags: ['computation'],
            summary: 'Generate contour plot data for given parameters',
            body: ContourParametersSchema,
            response: {
                200: Type.Object({
                    x1_values: Type.Array(Type.Number()),
                    x2_values: Type.Array(Type.Number()),
                    z_matrix: Type.Array(Type.Array(Type.Number())),
                    computation_time_ms: Type.Number()
                })
            }
        }
    }, async (request, reply) => {
        const startTime = Date.now();
        const { sessionId, ipAddress } = getSessionInfo(request);
        try {
            const result = await computationService.generateContour(request.body, sessionId, ipAddress);
            const responseTime = Date.now() - startTime;
            await fastify.db.recordUsage({
                timestamp: new Date().toISOString(),
                endpoint: '/api/contour',
                user_session: sessionId,
                ip_address: ipAddress,
                response_time_ms: responseTime,
                status_code: 200
            });
            reply.header('x-session-id', sessionId);
            return result;
        }
        catch (error) {
            fastify.log.error('Contour generation error:', error);
            reply.status(500);
            return {
                error: 'Contour Generation Failed',
                message: error instanceof Error ? error.message : 'Unknown error',
                statusCode: 500
            };
        }
    });
    // Legacy compatibility endpoints
    fastify.get('/exponents', {
        schema: {
            tags: ['computation'],
            summary: 'Legacy endpoint for computing exponents (GET)',
            querystring: Type.Object({
                M: Type.Optional(Type.String()),
                typeM: Type.Optional(Type.String()),
                SNR: Type.Optional(Type.String()),
                R: Type.Optional(Type.String()),
                N: Type.Optional(Type.String()),
                n: Type.Optional(Type.String()),
                th: Type.Optional(Type.String())
            })
        }
    }, async (request, reply) => {
        const { sessionId, ipAddress } = getSessionInfo(request);
        try {
            // Convert query parameters to computation parameters
            const params = {
                M: parseFloat(request.query.M || '2'),
                typeModulation: (request.query.typeM || 'PAM'),
                SNR: parseFloat(request.query.SNR || '1.0'),
                R: parseFloat(request.query.R || '0.5'),
                N: parseFloat(request.query.N || '20'),
                n: parseFloat(request.query.n || '128'),
                threshold: parseFloat(request.query.th || '1e-6')
            };
            const result = await computationService.computeSingle(params, sessionId, ipAddress);
            // Return in legacy format
            return {
                'Probabilidad de error': result.error_probability,
                'error_exponent': result.error_exponent,
                'rho óptima': result.optimal_rho
            };
        }
        catch (error) {
            fastify.log.error('Legacy computation error:', error);
            return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
    });
}
