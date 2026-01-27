import type { FastifyInstance } from 'fastify'
import { Type } from '@sinclair/typebox'
import { ComputationService } from '../services/computation.js'
import { generateSessionId } from '../utils/session.js'
import { createCancellationToken, removeToken, CancellationError } from '../utils/cancellation.js'

// Schema for standard modulation (PAM/PSK/QAM)
const ComputationParametersSchema = Type.Object({
  M: Type.Number({ minimum: 2, maximum: 64 }),
  typeModulation: Type.Union([Type.Literal('PAM'), Type.Literal('PSK'), Type.Literal('QAM')]),
  SNR: Type.Number({ minimum: 0, maximum: 1e6, default: 10 }),  // max ~60dB linear
  R: Type.Number({ minimum: 0, maximum: 100, default: 0.5 }),  // bits/symbol
  N: Type.Number({ minimum: 2, maximum: 40 }),
  n: Type.Number({ minimum: 1, maximum: 1000000 }),
  threshold: Type.Number({ minimum: 1e-15, maximum: 0.1 })
})

// Schema for custom constellation points
// Frontend uses { real, imag, prob } format
const ConstellationPointSchema = Type.Object({
  real: Type.Number(),
  imag: Type.Number(),
  prob: Type.Number({ minimum: 0, maximum: 1 })
})

// Schema for custom constellation computation
const CustomComputationParametersSchema = Type.Object({
  customConstellation: Type.Object({
    points: Type.Array(ConstellationPointSchema, { minItems: 2 })
  }),
  SNR: Type.Number({ minimum: 0, maximum: 1e6, default: 10 }),  // max ~60dB linear
  R: Type.Number({ minimum: 0, maximum: 100, default: 0.5 }),  // bits/symbol
  N: Type.Number({ minimum: 2, maximum: 40 }),
  n: Type.Number({ minimum: 1, maximum: 1000000 }),
  threshold: Type.Number({ minimum: 1e-15, maximum: 0.1 })
})

const ComputationResultSchema = Type.Object({
  error_probability: Type.Number(),
  error_exponent: Type.Number(),
  optimal_rho: Type.Number(),
  computation_time_ms: Type.Number(),
  cached: Type.Boolean()
})

// Plot parameters for standard modulation
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
  x_range: Type.Tuple([Type.Number(), Type.Number()], { default: [2, 30] }),
  points: Type.Number({ minimum: 1, maximum: 1000, default: 50 }),
  snrUnit: Type.Optional(Type.Union([Type.Literal('dB'), Type.Literal('linear')]))
})

// Plot parameters for custom constellation
const CustomPlotParametersSchema = Type.Object({
  customConstellation: Type.Object({
    points: Type.Array(ConstellationPointSchema, { minItems: 2, default: [
      { real: 1, imag: 0, prob: 0.5 },
      { real: -1, imag: 0, prob: 0.5 }
    ]})
  }),
  SNR: Type.Number({ minimum: 0, maximum: 1e20, default: 10 }),
  R: Type.Number({ minimum: 0, maximum: 1e20, default: 0.5 }),
  N: Type.Number({ minimum: 2, maximum: 40, default: 20 }),
  n: Type.Number({ minimum: 1, maximum: 1000000, default: 5000 }),
  threshold: Type.Number({ minimum: 1e-15, maximum: 0.1, default: 1e-9 }),
  y: Type.Union([
    Type.Literal('error_probability'),
    Type.Literal('error_exponent'),
    Type.Literal('optimal_rho')
  ]),
  x: Type.Union([
    Type.Literal('SNR'),
    Type.Literal('R'),
    Type.Literal('N'),
    Type.Literal('n'),
    Type.Literal('threshold')
  ]),
  x_range: Type.Tuple([Type.Number(), Type.Number()], { default: [2, 30] }),
  points: Type.Number({ minimum: 1, maximum: 1000, default: 50 }),
  snrUnit: Type.Optional(Type.Union([Type.Literal('dB'), Type.Literal('linear')]))
})

// Contour parameters for standard modulation
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
  x1_range: Type.Tuple([Type.Number(), Type.Number()], { default: [0, 30] }),
  x2_range: Type.Tuple([Type.Number(), Type.Number()], { default: [0.1, 0.9] }),
  points1: Type.Number({ minimum: 1, maximum: 100, default: 20 }),
  points2: Type.Number({ minimum: 1, maximum: 100, default: 20 }),
  snrUnit: Type.Optional(Type.Union([Type.Literal('dB'), Type.Literal('linear')]))
})

// Contour parameters for custom constellation
const CustomContourParametersSchema = Type.Object({
  customConstellation: Type.Object({
    points: Type.Array(ConstellationPointSchema, { minItems: 2, default: [
      { real: 1, imag: 0, prob: 0.5 },
      { real: -1, imag: 0, prob: 0.5 }
    ]})
  }),
  SNR: Type.Number({ minimum: 0, maximum: 1e20, default: 10 }),
  R: Type.Number({ minimum: 0, maximum: 1e20, default: 0.5 }),
  N: Type.Number({ minimum: 2, maximum: 40, default: 20 }),
  n: Type.Number({ minimum: 1, maximum: 1000000, default: 5000 }),
  threshold: Type.Number({ minimum: 1e-15, maximum: 0.1, default: 1e-9 }),
  y: Type.Union([
    Type.Literal('error_probability'),
    Type.Literal('error_exponent'),
    Type.Literal('optimal_rho')
  ]),
  x1: Type.Union([
    Type.Literal('SNR'),
    Type.Literal('R'),
    Type.Literal('N'),
    Type.Literal('n'),
    Type.Literal('threshold')
  ]),
  x2: Type.Union([
    Type.Literal('SNR'),
    Type.Literal('R'),
    Type.Literal('N'),
    Type.Literal('n'),
    Type.Literal('threshold')
  ]),
  x1_range: Type.Tuple([Type.Number(), Type.Number()], { default: [2, 30] }),
  x2_range: Type.Tuple([Type.Number(), Type.Number()], { default: [0.1, 0.9] }),
  points1: Type.Number({ minimum: 1, maximum: 100, default: 20 }),
  points2: Type.Number({ minimum: 1, maximum: 100, default: 20 }),
  snrUnit: Type.Optional(Type.Union([Type.Literal('dB'), Type.Literal('linear')]))
})

export async function computationRoutes(fastify: FastifyInstance): Promise<void> {
  const computationService = ComputationService.getInstance()

  // Helper to extract session info
  function getSessionInfo(request: any) {
    const sessionId = request.headers['x-session-id'] || generateSessionId()
    const ipAddress = request.ip
    return { sessionId, ipAddress }
  }

  // Single computation endpoint - standard modulation
  fastify.post('/compute/single/standard', {
    schema: {
      tags: ['computation'],
      summary: 'Compute error probability for standard constellation (PAM/PSK/QAM)',
      description: 'Single point calculation for standard modulation schemes',
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
    const startTime = Date.now()
    const { sessionId, ipAddress } = getSessionInfo(request)

    try {
      const result = await computationService.computeSingle(
        request.body,
        sessionId,
        ipAddress
      )

      // Record usage analytics
      const responseTime = Date.now() - startTime
      await fastify.db.recordUsage({
        timestamp: new Date().toISOString(),
        endpoint: '/api/v1/compute/single/standard',
        user_session: sessionId,
        ip_address: ipAddress,
        response_time_ms: responseTime,
        status_code: 200
      })

      reply.header('x-session-id', sessionId)
      return result

    } catch (error) {
      fastify.log.error('Computation error:', error)
      const responseTime = Date.now() - startTime

      await fastify.db.recordUsage({
        timestamp: new Date().toISOString(),
        endpoint: '/api/v1/compute/single/standard',
        user_session: sessionId,
        ip_address: ipAddress,
        response_time_ms: responseTime,
        status_code: 500
      })

      reply.status(500)
      return {
        error: 'Computation Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        statusCode: 500
      }
    }
  })

  // Single computation endpoint - custom constellation
  fastify.post('/compute/single/custom', {
    schema: {
      tags: ['computation'],
      summary: 'Compute error probability for custom constellation',
      description: 'Single point calculation using user-defined constellation points',
      body: CustomComputationParametersSchema,
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
    const startTime = Date.now()
    const { sessionId, ipAddress } = getSessionInfo(request)

    try {
      const result = await computationService.computeSingle(
        request.body,
        sessionId,
        ipAddress
      )

      const responseTime = Date.now() - startTime
      await fastify.db.recordUsage({
        timestamp: new Date().toISOString(),
        endpoint: '/api/v1/compute/single/custom',
        user_session: sessionId,
        ip_address: ipAddress,
        response_time_ms: responseTime,
        status_code: 200
      })

      reply.header('x-session-id', sessionId)
      return result

    } catch (error) {
      fastify.log.error('Custom computation error:', error)
      const responseTime = Date.now() - startTime

      await fastify.db.recordUsage({
        timestamp: new Date().toISOString(),
        endpoint: '/api/v1/compute/single/custom',
        user_session: sessionId,
        ip_address: ipAddress,
        response_time_ms: responseTime,
        status_code: 500
      })

      reply.status(500)
      return {
        error: 'Computation Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        statusCode: 500
      }
    }
  })

  // Batch computation endpoint - standard modulation
  fastify.post('/compute/batch/standard', {
    schema: {
      tags: ['computation'],
      summary: 'Batch compute error probability for standard constellations',
      description: 'Compute multiple parameter sets in a single request. Returns partial results if cancelled.',
      body: Type.Object({
        parameters: Type.Array(ComputationParametersSchema)
      }),
      response: {
        200: Type.Object({
          results: Type.Array(ComputationResultSchema),
          total_computation_time_ms: Type.Number(),
          cached: Type.Boolean(),
          incomplete: Type.Optional(Type.Boolean()),
          computed_points: Type.Optional(Type.Number()),
          requested_points: Type.Optional(Type.Number())
        })
      }
    }
  }, async (request, reply) => {
    const startTime = Date.now()
    const { sessionId, ipAddress } = getSessionInfo(request)

    // Create cancellation token for batch operations
    const cancellationToken = createCancellationToken(sessionId)

    try {
      const { parameters } = request.body

      if (parameters.length > 100) {
        reply.status(400)
        return {
          error: 'Too Many Computations',
          message: 'Maximum 100 computations per batch',
          statusCode: 400
        }
      }

      const batchResult = await computationService.computeBatch(
        parameters,
        sessionId,
        ipAddress,
        cancellationToken
      )

      const totalComputationTime = Date.now() - startTime

      reply.header('x-session-id', sessionId)
      return {
        results: batchResult.results,
        total_computation_time_ms: totalComputationTime,
        cached: batchResult.allCached,
        incomplete: batchResult.cancelled,
        computed_points: batchResult.results.length,
        requested_points: batchResult.totalRequested
      }

    } catch (error) {
      fastify.log.error('Batch computation error:', error)
      reply.status(500)
      return {
        error: 'Batch Computation Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        statusCode: 500
      }
    } finally {
      removeToken(cancellationToken)
    }
  })

  // Batch computation endpoint - custom constellation
  fastify.post('/compute/batch/custom', {
    schema: {
      tags: ['computation'],
      summary: 'Batch compute error probability for custom constellations',
      description: 'Compute multiple custom constellation parameter sets. Returns partial results if cancelled.',
      body: Type.Object({
        parameters: Type.Array(CustomComputationParametersSchema)
      }),
      response: {
        200: Type.Object({
          results: Type.Array(ComputationResultSchema),
          total_computation_time_ms: Type.Number(),
          cached: Type.Boolean(),
          incomplete: Type.Optional(Type.Boolean()),
          computed_points: Type.Optional(Type.Number()),
          requested_points: Type.Optional(Type.Number())
        })
      }
    }
  }, async (request, reply) => {
    const startTime = Date.now()
    const { sessionId, ipAddress } = getSessionInfo(request)

    // Create cancellation token for batch operations
    const cancellationToken = createCancellationToken(sessionId)

    try {
      const { parameters } = request.body

      if (parameters.length > 100) {
        reply.status(400)
        return {
          error: 'Too Many Computations',
          message: 'Maximum 100 computations per batch',
          statusCode: 400
        }
      }

      const batchResult = await computationService.computeBatch(
        parameters,
        sessionId,
        ipAddress,
        cancellationToken
      )

      const totalComputationTime = Date.now() - startTime

      reply.header('x-session-id', sessionId)
      return {
        results: batchResult.results,
        total_computation_time_ms: totalComputationTime,
        cached: batchResult.allCached,
        incomplete: batchResult.cancelled,
        computed_points: batchResult.results.length,
        requested_points: batchResult.totalRequested
      }

    } catch (error) {
      fastify.log.error('Batch custom computation error:', error)
      reply.status(500)
      return {
        error: 'Batch Computation Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        statusCode: 500
      }
    } finally {
      removeToken(cancellationToken)
    }
  })

  // Range computation endpoint - for plotting line charts
  fastify.post('/compute/range/standard', {
    schema: {
      tags: ['computation'],
      operationId: 'computeRangeStandard',
      summary: 'Compute error probability over a parameter range',
      description: 'Calculate error exponents across a range of values for plotting. Supports cancellation via POST /session/cancel. Returns partial results if cancelled.',
      body: PlotParametersSchema,
      response: {
        200: Type.Object({
          x_values: Type.Array(Type.Number()),
          y_values: Type.Array(Type.Number()),
          computation_time_ms: Type.Number(),
          cached: Type.Boolean(),
          incomplete: Type.Optional(Type.Boolean()),
          computed_points: Type.Optional(Type.Number()),
          requested_points: Type.Optional(Type.Number())
        })
      }
    }
  }, async (request, reply) => {
    const startTime = Date.now()
    const { sessionId, ipAddress } = getSessionInfo(request)

    // Create cancellation token for this request
    const cancellationToken = createCancellationToken(sessionId)

    try {
      const result = await computationService.generatePlot(
        request.body,
        sessionId,
        ipAddress,
        cancellationToken
      )

      const responseTime = Date.now() - startTime

      // Log if partial results
      if (result.incomplete) {
        fastify.log.info({
          sessionId,
          computed: result.computed_points,
          requested: result.requested_points
        }, 'Returning partial plot results due to cancellation')
      }

      await fastify.db.recordUsage({
        timestamp: new Date().toISOString(),
        endpoint: '/api/v1/compute/range/standard',
        user_session: sessionId,
        ip_address: ipAddress,
        response_time_ms: responseTime,
        status_code: 200
      })

      reply.header('x-session-id', sessionId)
      return result

    } catch (error) {
      fastify.log.error('Range computation error:', error)
      reply.status(500)
      return {
        error: 'Range Computation Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        statusCode: 500
      }
    } finally {
      // Always clean up the token
      removeToken(cancellationToken)
    }
  })

  // Range computation endpoint - custom constellation
  fastify.post('/compute/range/custom', {
    schema: {
      tags: ['computation'],
      summary: 'Compute error probability over a range for custom constellation',
      description: 'Calculate error exponents across a range for custom constellation plotting. Supports cancellation via POST /session/cancel. Returns partial results if cancelled.',
      body: CustomPlotParametersSchema,
      response: {
        200: Type.Object({
          x_values: Type.Array(Type.Number()),
          y_values: Type.Array(Type.Number()),
          computation_time_ms: Type.Number(),
          cached: Type.Boolean(),
          incomplete: Type.Optional(Type.Boolean()),
          computed_points: Type.Optional(Type.Number()),
          requested_points: Type.Optional(Type.Number())
        })
      }
    }
  }, async (request, reply) => {
    const startTime = Date.now()
    const { sessionId, ipAddress } = getSessionInfo(request)

    // Create cancellation token for this request
    const cancellationToken = createCancellationToken(sessionId)

    try {
      const result = await computationService.generatePlot(
        request.body,
        sessionId,
        ipAddress,
        cancellationToken
      )

      const responseTime = Date.now() - startTime

      // Log if partial results
      if (result.incomplete) {
        fastify.log.info({
          sessionId,
          computed: result.computed_points,
          requested: result.requested_points
        }, 'Returning partial custom plot results due to cancellation')
      }

      await fastify.db.recordUsage({
        timestamp: new Date().toISOString(),
        endpoint: '/api/v1/compute/range/custom',
        user_session: sessionId,
        ip_address: ipAddress,
        response_time_ms: responseTime,
        status_code: 200
      })

      reply.header('x-session-id', sessionId)
      return result

    } catch (error) {
      fastify.log.error('Custom range computation error:', error)
      reply.status(500)
      return {
        error: 'Range Computation Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        statusCode: 500
      }
    } finally {
      removeToken(cancellationToken)
    }
  })

  // Contour/surface computation endpoint - for 3D visualizations
  fastify.post('/compute/contour/standard', {
    schema: {
      tags: ['computation'],
      summary: 'Compute error probability over a 2D parameter grid',
      description: 'Calculate error exponents for contour and surface plots. Supports cancellation via POST /session/cancel. Returns partial results if cancelled.',
      body: ContourParametersSchema,
      response: {
        200: Type.Object({
          x1_values: Type.Array(Type.Number()),
          x2_values: Type.Array(Type.Number()),
          z_matrix: Type.Array(Type.Array(Type.Number())),
          computation_time_ms: Type.Number(),
          cached: Type.Boolean(),
          incomplete: Type.Optional(Type.Boolean()),
          computed_points: Type.Optional(Type.Number()),
          requested_points: Type.Optional(Type.Number())
        })
      }
    }
  }, async (request, reply) => {
    const startTime = Date.now()
    const { sessionId, ipAddress } = getSessionInfo(request)

    // Create cancellation token for this request
    const cancellationToken = createCancellationToken(sessionId)

    try {
      const result = await computationService.generateContour(
        request.body,
        sessionId,
        ipAddress,
        cancellationToken
      )

      const responseTime = Date.now() - startTime

      // Log if partial results
      if (result.incomplete) {
        fastify.log.info({
          sessionId,
          computed: result.computed_points,
          requested: result.requested_points
        }, 'Returning partial contour results due to cancellation')
      }

      await fastify.db.recordUsage({
        timestamp: new Date().toISOString(),
        endpoint: '/api/v1/compute/contour/standard',
        user_session: sessionId,
        ip_address: ipAddress,
        response_time_ms: responseTime,
        status_code: 200
      })

      reply.header('x-session-id', sessionId)
      return result

    } catch (error) {
      fastify.log.error('Contour computation error:', error)
      reply.status(500)
      return {
        error: 'Contour Computation Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        statusCode: 500
      }
    } finally {
      removeToken(cancellationToken)
    }
  })

  // Contour/surface computation endpoint - custom constellation
  fastify.post('/compute/contour/custom', {
    schema: {
      tags: ['computation'],
      summary: 'Compute error probability over a 2D grid for custom constellation',
      description: 'Calculate error exponents for custom constellation contour/surface plots. Supports cancellation via POST /session/cancel. Returns partial results if cancelled.',
      body: CustomContourParametersSchema,
      response: {
        200: Type.Object({
          x1_values: Type.Array(Type.Number()),
          x2_values: Type.Array(Type.Number()),
          z_matrix: Type.Array(Type.Array(Type.Number())),
          computation_time_ms: Type.Number(),
          cached: Type.Boolean(),
          incomplete: Type.Optional(Type.Boolean()),
          computed_points: Type.Optional(Type.Number()),
          requested_points: Type.Optional(Type.Number())
        })
      }
    }
  }, async (request, reply) => {
    const startTime = Date.now()
    const { sessionId, ipAddress } = getSessionInfo(request)

    // Create cancellation token for this request
    const cancellationToken = createCancellationToken(sessionId)

    try {
      const result = await computationService.generateContour(
        request.body,
        sessionId,
        ipAddress,
        cancellationToken
      )

      const responseTime = Date.now() - startTime

      // Log if partial results
      if (result.incomplete) {
        fastify.log.info({
          sessionId,
          computed: result.computed_points,
          requested: result.requested_points
        }, 'Returning partial custom contour results due to cancellation')
      }

      await fastify.db.recordUsage({
        timestamp: new Date().toISOString(),
        endpoint: '/api/v1/compute/contour/custom',
        user_session: sessionId,
        ip_address: ipAddress,
        response_time_ms: responseTime,
        status_code: 200
      })

      reply.header('x-session-id', sessionId)
      return result

    } catch (error) {
      fastify.log.error('Custom contour computation error:', error)
      reply.status(500)
      return {
        error: 'Contour Computation Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        statusCode: 500
      }
    } finally {
      removeToken(cancellationToken)
    }
  })

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
    const { sessionId, ipAddress } = getSessionInfo(request)

    try {
      // Convert query parameters to computation parameters
      const params = {
        M: parseFloat(request.query.M || '2'),
        typeModulation: (request.query.typeM || 'PAM') as 'PAM' | 'PSK' | 'QAM',
        SNR: parseFloat(request.query.SNR || '1.0'),
        R: parseFloat(request.query.R || '0.5'),
        N: parseFloat(request.query.N || '20'),
        n: parseFloat(request.query.n || '128'),
        threshold: parseFloat(request.query.th || '1e-6')
      }

      const result = await computationService.computeSingle(params, sessionId, ipAddress)

      // Return in legacy format
      return {
        'Probabilidad de error': result.error_probability,
        'error_exponent': result.error_exponent,
        'rho óptima': result.optimal_rho
      }

    } catch (error) {
      fastify.log.error('Legacy computation error:', error)
      return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  })
}