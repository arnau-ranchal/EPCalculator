import { Type } from '@sinclair/typebox';
import { ComputationService } from '../services/computation.js';
import { generateSessionId } from '../utils/session.js';
import { createCancellationToken, removeToken } from '../utils/cancellation.js';
import { computeUnifiedStandard, computeUnifiedCustom } from '../services/unified-computation.js';
// =============================================================================
// UNIFIED API SCHEMAS
// =============================================================================
// Schema for custom constellation points
const ConstellationPointSchema = Type.Object({
    real: Type.Number(),
    imag: Type.Number(),
    prob: Type.Number({ minimum: 0, maximum: 1 })
});
// Helper to create parameter-specific polymorphic schemas with defaults
function createParameterSchema(opts) {
    const { minimum, maximum, default: defaultVal } = opts;
    const constraints = { minimum, maximum };
    const RangeStep = Type.Object({
        min: Type.Number(constraints),
        max: Type.Number(constraints),
        step: Type.Number({ minimum: 0.0001 })
    });
    const RangePoints = Type.Object({
        min: Type.Number(constraints),
        max: Type.Number(constraints),
        points: Type.Integer({ minimum: 1, maximum: 1000 })
    });
    // Add default to the number type for Swagger examples
    const numberSchema = defaultVal !== undefined
        ? Type.Number({ ...constraints, default: defaultVal })
        : Type.Number(constraints);
    return Type.Union([
        numberSchema,
        Type.Array(Type.Number(constraints), { minItems: 1, maxItems: 1000 }),
        RangeStep,
        RangePoints
    ]);
}
// Parameter-specific schemas with correct ranges and sensible defaults
// See PARAMETER_CONSTRAINTS in unified-api.ts for authoritative values
const MParameterSchema = createParameterSchema({ minimum: 2, maximum: 64, default: 4 });
// SNR: allows [-30, 1e20] to accept both dB (min -30) and linear (max 1e20)
// Default of 10 works for both units. Unit-specific validation at service level.
const SNRParameterSchema = createParameterSchema({ minimum: -30, maximum: 1e20, default: 10 });
const RParameterSchema = createParameterSchema({ minimum: 0, maximum: 1e20, default: 0.5 });
const NParameterSchema = createParameterSchema({ minimum: 2, maximum: 40, default: 20 });
const nParameterSchema = createParameterSchema({ minimum: 1, maximum: 1_000_000, default: 128 });
const thresholdParameterSchema = createParameterSchema({ minimum: 1e-15, maximum: 0.1, default: 1e-9 });
// Output metrics
const OutputMetricSchema = Type.Union([
    Type.Literal('error_probability'),
    Type.Literal('error_exponent'),
    Type.Literal('optimal_rho'),
    Type.Literal('mutual_information'),
    Type.Literal('cutoff_rate'),
    Type.Literal('critical_rate')
]);
// Unified compute request for standard modulation
const UnifiedComputeStandardSchema = Type.Object({
    M: MParameterSchema,
    typeModulation: Type.Union([Type.Literal('PAM'), Type.Literal('PSK'), Type.Literal('QAM')], { default: 'QAM' }),
    SNR: SNRParameterSchema,
    R: RParameterSchema,
    N: NParameterSchema,
    n: nParameterSchema,
    threshold: thresholdParameterSchema,
    snrUnit: Type.Optional(Type.Union([Type.Literal('dB'), Type.Literal('linear')], { default: 'dB' })),
    metrics: Type.Optional(Type.Array(OutputMetricSchema, { default: ['error_probability', 'error_exponent'] })),
    format: Type.Optional(Type.Union([Type.Literal('flat'), Type.Literal('matrix')], { default: 'flat' }))
}, {
    // Example showcasing all 4 polymorphic formats:
    // - Single value: M, R, threshold
    // - Range with step: SNR
    // - Range with points: N
    // - Explicit list: n
    examples: [{
            M: 4, // Single value
            typeModulation: 'QAM',
            SNR: { min: 0, max: 20, step: 5 }, // Range with step → [0, 5, 10, 15, 20]
            R: 0.5, // Single value
            N: { min: 15, max: 25, points: 3 }, // Range with points → [15, 20, 25]
            n: [64, 128, 256], // Explicit list
            threshold: 1e-9, // Single value
            snrUnit: 'dB',
            metrics: ['error_probability', 'error_exponent'],
            format: 'flat'
        }]
});
// Unified compute request for custom constellation
const UnifiedComputeCustomSchema = Type.Object({
    customConstellation: Type.Object({
        // BPSK constellation with probabilities summing to 1.0
        points: Type.Array(ConstellationPointSchema, {
            minItems: 2,
            maxItems: 256,
            default: [
                { real: 1, imag: 0, prob: 0.5 },
                { real: -1, imag: 0, prob: 0.5 }
            ]
        })
    }),
    SNR: SNRParameterSchema,
    R: RParameterSchema,
    N: NParameterSchema,
    n: nParameterSchema,
    threshold: thresholdParameterSchema,
    snrUnit: Type.Optional(Type.Union([Type.Literal('dB'), Type.Literal('linear')], { default: 'dB' })),
    metrics: Type.Optional(Type.Array(OutputMetricSchema, { default: ['error_probability', 'error_exponent'] })),
    format: Type.Optional(Type.Union([Type.Literal('flat'), Type.Literal('matrix')], { default: 'flat' }))
}, {
    // Example showcasing all 4 polymorphic formats (complementary to standard):
    // - Single value: N, threshold
    // - Range with step: n
    // - Range with points: R
    // - Explicit list: SNR
    examples: [{
            customConstellation: {
                points: [
                    { real: 1, imag: 0, prob: 0.5 },
                    { real: -1, imag: 0, prob: 0.5 }
                ]
            },
            SNR: [5, 10, 15, 20], // Explicit list
            R: { min: 0.3, max: 0.7, points: 5 }, // Range with points → [0.3, 0.4, 0.5, 0.6, 0.7]
            N: 20, // Single value
            n: { min: 100, max: 500, step: 100 }, // Range with step → [100, 200, 300, 400, 500]
            threshold: 1e-9, // Single value
            snrUnit: 'dB',
            metrics: ['error_probability', 'error_exponent'],
            format: 'flat'
        }]
});
// Axis info in response
const AxisInfoSchema = Type.Object({
    name: Type.String(),
    values: Type.Array(Type.Number()),
    unit: Type.Optional(Type.String())
});
// Result point with metrics
const ResultPointSchema = Type.Object({
    params: Type.Record(Type.String(), Type.Number()),
    metrics: Type.Record(Type.String(), Type.Number()),
    cached: Type.Boolean(),
    computation_time_ms: Type.Number()
});
// Meta information
const ComputeMetaSchema = Type.Object({
    total_points: Type.Number(),
    cached_points: Type.Number(),
    total_computation_time_ms: Type.Number(),
    incomplete: Type.Optional(Type.Boolean()),
    requested_points: Type.Optional(Type.Number())
});
// Unified response (flat format)
const UnifiedComputeResponseFlatSchema = Type.Object({
    format: Type.Literal('flat'),
    axes: Type.Array(AxisInfoSchema),
    results: Type.Array(ResultPointSchema),
    meta: ComputeMetaSchema
});
// Unified response (matrix format) - results is nested array
const UnifiedComputeResponseMatrixSchema = Type.Object({
    format: Type.Literal('matrix'),
    axes: Type.Array(AxisInfoSchema),
    results: Type.Any(), // Nested array structure
    meta: ComputeMetaSchema
});
// Combined response schema
const UnifiedComputeResponseSchema = Type.Union([
    UnifiedComputeResponseFlatSchema,
    UnifiedComputeResponseMatrixSchema
]);
export async function computationRoutes(fastify) {
    const computationService = ComputationService.getInstance();
    // Helper to extract session info
    function getSessionInfo(request) {
        const sessionId = request.headers['x-session-id'] || generateSessionId();
        const ipAddress = request.ip;
        return { sessionId, ipAddress };
    }
    // =============================================================================
    // UNIFIED COMPUTATION ENDPOINTS
    // =============================================================================
    // Unified computation endpoint - standard modulation
    fastify.post('/compute/standard', {
        schema: {
            tags: ['computation'],
            summary: 'Unified computation for standard modulation (PAM/PSK/QAM)',
            description: `Compute error metrics with polymorphic parameter values. Each parameter can be:
- Single value: \`"SNR": 10\`
- Explicit list: \`"SNR": [5, 10, 15, 20]\`
- Range (step): \`"SNR": { "min": 0, "max": 20, "step": 2 }\`
- Range (points): \`"SNR": { "min": 0, "max": 20, "points": 11 }\`

Multi-value parameters are combined via Cartesian product (max 10,000 total points).
Supports cancellation via POST /session/cancel. Returns partial results if cancelled.`,
            body: UnifiedComputeStandardSchema,
            response: {
                200: UnifiedComputeResponseSchema,
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
        const cancellationToken = createCancellationToken(sessionId);
        try {
            const result = await computeUnifiedStandard(request.body, sessionId, ipAddress, cancellationToken, fastify.log);
            const responseTime = Date.now() - startTime;
            if (result.meta.incomplete) {
                fastify.log.info({
                    sessionId,
                    computed: result.meta.total_points,
                    requested: result.meta.requested_points
                }, 'Returning partial unified results due to cancellation');
            }
            await fastify.db.recordUsage({
                timestamp: new Date().toISOString(),
                endpoint: '/api/v1/compute/standard',
                user_session: sessionId,
                ip_address: ipAddress,
                response_time_ms: responseTime,
                status_code: 200
            });
            reply.header('x-session-id', sessionId);
            return result;
        }
        catch (error) {
            fastify.log.error('Unified standard computation error:', error);
            const responseTime = Date.now() - startTime;
            await fastify.db.recordUsage({
                timestamp: new Date().toISOString(),
                endpoint: '/api/v1/compute/standard',
                user_session: sessionId,
                ip_address: ipAddress,
                response_time_ms: responseTime,
                status_code: error instanceof Error && error.message.includes('exceeds') ? 400 : 500
            });
            const statusCode = error instanceof Error && error.message.includes('exceeds') ? 400 : 500;
            reply.status(statusCode);
            return {
                error: statusCode === 400 ? 'Validation Error' : 'Computation Failed',
                message: error instanceof Error ? error.message : 'Unknown error',
                statusCode
            };
        }
        finally {
            removeToken(cancellationToken);
        }
    });
    // Unified computation endpoint - custom constellation
    fastify.post('/compute/custom', {
        schema: {
            tags: ['computation'],
            summary: 'Unified computation for custom constellation',
            description: `Compute error metrics for custom constellation with polymorphic parameter values. Each parameter can be:
- Single value: \`"SNR": 10\`
- Explicit list: \`"SNR": [5, 10, 15, 20]\`
- Range (step): \`"SNR": { "min": 0, "max": 20, "step": 2 }\`
- Range (points): \`"SNR": { "min": 0, "max": 20, "points": 11 }\`

Multi-value parameters are combined via Cartesian product (max 10,000 total points).
Supports cancellation via POST /session/cancel. Returns partial results if cancelled.`,
            body: UnifiedComputeCustomSchema,
            response: {
                200: UnifiedComputeResponseSchema,
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
        const cancellationToken = createCancellationToken(sessionId);
        try {
            const result = await computeUnifiedCustom(request.body, sessionId, ipAddress, cancellationToken, fastify.log);
            const responseTime = Date.now() - startTime;
            if (result.meta.incomplete) {
                fastify.log.info({
                    sessionId,
                    computed: result.meta.total_points,
                    requested: result.meta.requested_points
                }, 'Returning partial unified custom results due to cancellation');
            }
            await fastify.db.recordUsage({
                timestamp: new Date().toISOString(),
                endpoint: '/api/v1/compute/custom',
                user_session: sessionId,
                ip_address: ipAddress,
                response_time_ms: responseTime,
                status_code: 200
            });
            reply.header('x-session-id', sessionId);
            return result;
        }
        catch (error) {
            fastify.log.error('Unified custom computation error:', error);
            const responseTime = Date.now() - startTime;
            await fastify.db.recordUsage({
                timestamp: new Date().toISOString(),
                endpoint: '/api/v1/compute/custom',
                user_session: sessionId,
                ip_address: ipAddress,
                response_time_ms: responseTime,
                status_code: error instanceof Error && error.message.includes('exceeds') ? 400 : 500
            });
            const statusCode = error instanceof Error && (error.message.includes('exceeds') ||
                error.message.includes('at least') ||
                error.message.includes('probabilities')) ? 400 : 500;
            reply.status(statusCode);
            return {
                error: statusCode === 400 ? 'Validation Error' : 'Computation Failed',
                message: error instanceof Error ? error.message : 'Unknown error',
                statusCode
            };
        }
        finally {
            removeToken(cancellationToken);
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
//# sourceMappingURL=computation.js.map