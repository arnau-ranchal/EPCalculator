/**
 * Unified Computation Service
 *
 * Handles parameter expansion, Cartesian product generation, and result formatting
 * for the unified computation API.
 */

import type {
  ParameterValue,
  OutputMetric,
  SNRUnit,
  ResponseFormat,
  InternalAxisInfo,
  ResultPoint,
  NestedMetricArray,
  UnifiedComputeStandardRequest,
  UnifiedComputeCustomRequest,
  UnifiedComputeResponseFlat,
  UnifiedComputeResponseMatrix,
  UnifiedComputeResponse,
  ConstellationPoint
} from '../types/unified-api.js'

import {
  isRangeValue,
  isStepRange,
  isPointsRange,
  isArrayValue,
  DEFAULT_METRICS,
  MAX_TOTAL_POINTS,
  MAX_VALUES_PER_AXIS,
  PARAMETER_CONSTRAINTS
} from '../types/unified-api.js'

import { ComputationService, type ComputationParameters, type CustomComputationParameters, type ComputationResult } from './computation.js'
import type { CancellationToken } from '../utils/cancellation.js'
import type { FastifyBaseLogger } from 'fastify'

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate linearly spaced values (like numpy.linspace)
 */
function linspace(start: number, end: number, points: number): number[] {
  if (points === 1) return [start]
  return Array.from({ length: points }, (_, i) =>
    start + (end - start) * i / (points - 1)
  )
}

/**
 * Generate values with step (like numpy.arange, but inclusive of end)
 */
function arange(start: number, end: number, step: number): number[] {
  const values: number[] = []
  // Use small epsilon to handle floating point precision issues
  for (let v = start; v <= end + 1e-10; v += step) {
    values.push(v)
  }
  return values
}

/**
 * Expand a polymorphic parameter value into concrete arrays
 *
 * @param value - The polymorphic value (single, list, or range)
 * @param paramName - Name of the parameter (for special handling of integers and SNR)
 * @param snrUnit - SNR unit for dB conversion
 * @returns Object with display values (for response) and compute values (for computation)
 */
export function expandParameter(
  value: ParameterValue,
  paramName: string,
  snrUnit?: SNRUnit
): { display: number[], compute: number[] } {
  let displayValues: number[]

  if (typeof value === 'number') {
    // Single value
    displayValues = [value]
  } else if (isArrayValue(value)) {
    // Explicit list
    displayValues = [...value]
  } else if (isRangeValue(value)) {
    if (isStepRange(value)) {
      // Step-based range
      displayValues = arange(value.min, value.max, value.step)
    } else if (isPointsRange(value)) {
      // Points-based range
      displayValues = linspace(value.min, value.max, value.points)
    } else {
      throw new Error(`Invalid range for ${paramName}: must have either 'step' or 'points'`)
    }
  } else {
    throw new Error(`Invalid value type for ${paramName}`)
  }

  // Limit values per axis
  if (displayValues.length > MAX_VALUES_PER_AXIS) {
    throw new Error(`Too many values for ${paramName}: ${displayValues.length} exceeds limit of ${MAX_VALUES_PER_AXIS}`)
  }

  // Round and deduplicate for integer parameters
  if (['M', 'N', 'n'].includes(paramName)) {
    displayValues = [...new Set(displayValues.map(v => Math.round(v)))].sort((a, b) => a - b)
  }

  // SNR dB → linear conversion for computation
  let computeValues: number[]
  if (paramName === 'SNR' && snrUnit === 'dB') {
    computeValues = displayValues.map(dB => Math.pow(10, dB / 10))
  } else {
    computeValues = displayValues
  }

  return { display: displayValues, compute: computeValues }
}

/**
 * Validate parameter bounds
 */
function validateParameterBounds(
  paramName: string,
  values: number[],
  snrUnit?: SNRUnit
): void {
  let constraint: { min: number, max: number }

  switch (paramName) {
    case 'M':
      constraint = PARAMETER_CONSTRAINTS.M
      break
    case 'SNR':
      constraint = snrUnit === 'dB' ? PARAMETER_CONSTRAINTS.SNR_dB : PARAMETER_CONSTRAINTS.SNR_linear
      break
    case 'R':
      constraint = PARAMETER_CONSTRAINTS.R
      break
    case 'N':
      constraint = PARAMETER_CONSTRAINTS.N
      break
    case 'n':
      constraint = PARAMETER_CONSTRAINTS.n
      break
    case 'threshold':
      constraint = PARAMETER_CONSTRAINTS.threshold
      break
    default:
      return // No validation for unknown params
  }

  for (const v of values) {
    if (v < constraint.min || v > constraint.max) {
      throw new Error(
        `${paramName} value ${v} out of range [${constraint.min}, ${constraint.max}]`
      )
    }
  }
}

/**
 * Generate Cartesian product of expanded parameters
 *
 * @returns Object containing axes info and flat list of computation parameters
 */
export function generateCartesianProduct(
  request: UnifiedComputeStandardRequest,
  logger?: FastifyBaseLogger
): {
  axes: InternalAxisInfo[]
  paramsList: ComputationParameters[]
  totalPoints: number
  fixedParams: Record<string, number | string>
} {
  const sweepableParams = ['M', 'SNR', 'R', 'N', 'n', 'threshold'] as const
  const axes: InternalAxisInfo[] = []
  const expanded: Record<string, { display: number[], compute: number[] }> = {}
  const fixedParams: Record<string, number | string> = {
    typeModulation: request.typeModulation
  }

  // Expand all parameters
  for (const name of sweepableParams) {
    const value = request[name]
    const result = expandParameter(value, name, request.snrUnit)
    expanded[name] = result

    // Validate bounds
    validateParameterBounds(name, result.display, request.snrUnit)

    // Track if this parameter varies (more than one value)
    if (result.display.length > 1) {
      axes.push({
        name,
        displayValues: result.display,
        computeValues: result.compute
      })
    } else {
      // Fixed parameter
      fixedParams[name] = result.display[0]
    }
  }

  // Calculate total points
  const totalPoints = axes.length === 0
    ? 1
    : axes.reduce((p, a) => p * a.displayValues.length, 1)

  if (totalPoints > MAX_TOTAL_POINTS) {
    throw new Error(
      `Total points (${totalPoints}) exceeds maximum (${MAX_TOTAL_POINTS}). ` +
      `Reduce range points or parameter combinations.`
    )
  }

  logger?.info(`Unified compute: ${axes.length} varying axes, ${totalPoints} total points`)

  // Generate Cartesian product
  const paramsList: ComputationParameters[] = []

  function generate(axisIndex: number, current: Partial<ComputationParameters>) {
    if (axisIndex >= axes.length) {
      // Base case: all axes assigned, create full params
      paramsList.push({
        M: expanded.M.compute[0],
        typeModulation: request.typeModulation,
        SNR: expanded.SNR.compute[0],
        R: expanded.R.compute[0],
        N: expanded.N.compute[0],
        n: expanded.n.compute[0],
        threshold: expanded.threshold.compute[0],
        ...current
      } as ComputationParameters)
      return
    }

    const axis = axes[axisIndex]
    for (const v of axis.computeValues) {
      generate(axisIndex + 1, { ...current, [axis.name]: v })
    }
  }

  generate(0, {})

  return { axes, paramsList, totalPoints, fixedParams }
}

/**
 * Generate Cartesian product for custom constellation requests
 */
export function generateCartesianProductCustom(
  request: UnifiedComputeCustomRequest,
  logger?: FastifyBaseLogger
): {
  axes: InternalAxisInfo[]
  paramsList: CustomComputationParameters[]
  totalPoints: number
  fixedParams: Record<string, number | ConstellationPoint[]>
} {
  const sweepableParams = ['SNR', 'R', 'N', 'n', 'threshold'] as const
  const axes: InternalAxisInfo[] = []
  const expanded: Record<string, { display: number[], compute: number[] }> = {}
  const fixedParams: Record<string, number | ConstellationPoint[]> = {
    customConstellation: request.customConstellation.points
  }

  // Expand all parameters
  for (const name of sweepableParams) {
    const value = request[name]
    const result = expandParameter(value, name, request.snrUnit)
    expanded[name] = result

    // Validate bounds
    validateParameterBounds(name, result.display, request.snrUnit)

    // Track if this parameter varies
    if (result.display.length > 1) {
      axes.push({
        name,
        displayValues: result.display,
        computeValues: result.compute
      })
    } else {
      fixedParams[name] = result.display[0]
    }
  }

  // Calculate total points
  const totalPoints = axes.length === 0
    ? 1
    : axes.reduce((p, a) => p * a.displayValues.length, 1)

  if (totalPoints > MAX_TOTAL_POINTS) {
    throw new Error(
      `Total points (${totalPoints}) exceeds maximum (${MAX_TOTAL_POINTS}). ` +
      `Reduce range points or parameter combinations.`
    )
  }

  logger?.info(`Unified custom compute: ${axes.length} varying axes, ${totalPoints} total points`)

  // Generate Cartesian product
  const paramsList: CustomComputationParameters[] = []

  function generate(axisIndex: number, current: Partial<CustomComputationParameters>) {
    if (axisIndex >= axes.length) {
      paramsList.push({
        customConstellation: request.customConstellation,
        SNR: expanded.SNR.compute[0],
        R: expanded.R.compute[0],
        N: expanded.N.compute[0],
        n: expanded.n.compute[0],
        threshold: expanded.threshold.compute[0],
        ...current
      } as CustomComputationParameters)
      return
    }

    const axis = axes[axisIndex]
    for (const v of axis.computeValues) {
      generate(axisIndex + 1, { ...current, [axis.name]: v })
    }
  }

  generate(0, {})

  return { axes, paramsList, totalPoints, fixedParams }
}

/**
 * Format results as flat array
 */
export function formatResultsFlat(
  results: ComputationResult[],
  axes: InternalAxisInfo[],
  requestedMetrics: OutputMetric[]
): ResultPoint[] {
  return results.map((r, idx) => {
    // Reconstruct params from flat index
    const params: Record<string, number> = {}
    let remaining = idx

    // Traverse axes in reverse order to get correct indices
    for (let i = axes.length - 1; i >= 0; i--) {
      const axis = axes[i]
      const axisIndex = remaining % axis.displayValues.length
      params[axis.name] = axis.displayValues[axisIndex]
      remaining = Math.floor(remaining / axis.displayValues.length)
    }

    // Extract requested metrics
    const metrics: Partial<Record<OutputMetric, number>> = {}
    for (const m of requestedMetrics) {
      if (m in r) {
        metrics[m] = r[m as keyof ComputationResult] as number
      }
    }

    return {
      params,
      metrics,
      cached: r.cached,
      computation_time_ms: r.computation_time_ms
    }
  })
}

/**
 * Format results as N-dimensional matrix
 */
export function formatResultsMatrix(
  results: ComputationResult[],
  axes: InternalAxisInfo[],
  requestedMetrics: OutputMetric[]
): NestedMetricArray {
  if (axes.length === 0) {
    // Single point - return metrics directly
    const r = results[0]
    const metrics: Partial<Record<OutputMetric, number>> = {}
    for (const m of requestedMetrics) {
      if (m in r) {
        metrics[m] = r[m as keyof ComputationResult] as number
      }
    }
    return metrics
  }

  if (axes.length === 1) {
    // 1D array
    return results.map(r => {
      const metrics: Partial<Record<OutputMetric, number>> = {}
      for (const m of requestedMetrics) {
        if (m in r) {
          metrics[m] = r[m as keyof ComputationResult] as number
        }
      }
      return metrics
    })
  }

  if (axes.length === 2) {
    // 2D matrix
    const rows = axes[0].displayValues.length
    const cols = axes[1].displayValues.length
    const matrix: NestedMetricArray[] = []

    for (let i = 0; i < rows; i++) {
      const row: Partial<Record<OutputMetric, number>>[] = []
      for (let j = 0; j < cols; j++) {
        const flatIdx = i * cols + j
        if (flatIdx < results.length) {
          const r = results[flatIdx]
          const metrics: Partial<Record<OutputMetric, number>> = {}
          for (const m of requestedMetrics) {
            if (m in r) {
              metrics[m] = r[m as keyof ComputationResult] as number
            }
          }
          row.push(metrics)
        }
      }
      matrix.push(row)
    }
    return matrix
  }

  // 3+ dimensions: recursively build nested arrays
  // For simplicity, fall back to flat format for 3+ dimensions
  // (uncommon use case)
  return formatResultsFlat(results, axes, requestedMetrics) as unknown as NestedMetricArray
}

// =============================================================================
// MAIN COMPUTATION FUNCTION
// =============================================================================

/**
 * Execute unified computation for standard modulation
 */
export async function computeUnifiedStandard(
  request: UnifiedComputeStandardRequest,
  sessionId?: string,
  ipAddress?: string,
  cancellationToken?: CancellationToken,
  logger?: FastifyBaseLogger
): Promise<UnifiedComputeResponse> {
  const startTime = Date.now()

  // Early cancellation check
  if (cancellationToken?.isCancelled) {
    return {
      format: request.format ?? 'flat',
      axes: [],
      results: [],
      meta: {
        total_points: 0,
        cached_points: 0,
        total_computation_time_ms: 0,
        incomplete: true,
        requested_points: 0
      }
    }
  }

  // Generate Cartesian product
  const { axes, paramsList, totalPoints } = generateCartesianProduct(request, logger)

  // Get computation service
  const computationService = ComputationService.getInstance()

  // Execute batch computation (reuses existing caching, parallelism, cancellation)
  const batchResult = await computationService.computeBatch(
    paramsList,
    sessionId,
    ipAddress,
    cancellationToken
  )

  // Format results
  const requestedMetrics = request.metrics ?? DEFAULT_METRICS
  const format = request.format ?? 'flat'

  const meta = {
    total_points: batchResult.results.length,
    cached_points: batchResult.results.filter(r => r.cached).length,
    total_computation_time_ms: Date.now() - startTime,
    incomplete: batchResult.cancelled,
    requested_points: totalPoints
  }

  const axesInfo = axes.map(a => ({
    name: a.name,
    values: a.displayValues,
    unit: a.name === 'SNR' && request.snrUnit === 'dB' ? 'dB' : undefined
  }))

  if (format === 'matrix') {
    return {
      format: 'matrix',
      axes: axesInfo,
      results: formatResultsMatrix(batchResult.results, axes, requestedMetrics),
      meta
    } satisfies UnifiedComputeResponseMatrix
  }

  return {
    format: 'flat',
    axes: axesInfo,
    results: formatResultsFlat(batchResult.results, axes, requestedMetrics),
    meta
  } satisfies UnifiedComputeResponseFlat
}

/**
 * Execute unified computation for custom constellation
 */
export async function computeUnifiedCustom(
  request: UnifiedComputeCustomRequest,
  sessionId?: string,
  ipAddress?: string,
  cancellationToken?: CancellationToken,
  logger?: FastifyBaseLogger
): Promise<UnifiedComputeResponse> {
  const startTime = Date.now()

  // Validate constellation
  const points = request.customConstellation.points
  if (points.length < 2) {
    throw new Error('Custom constellation must have at least 2 points')
  }
  if (points.length > 256) {
    throw new Error('Custom constellation cannot exceed 256 points')
  }

  // Validate probabilities sum to 1
  const probSum = points.reduce((sum, p) => sum + p.prob, 0)
  if (Math.abs(probSum - 1.0) > 0.001) {
    throw new Error(`Constellation probabilities must sum to 1.0 (got ${probSum.toFixed(4)})`)
  }

  // Early cancellation check
  if (cancellationToken?.isCancelled) {
    return {
      format: request.format ?? 'flat',
      axes: [],
      results: [],
      meta: {
        total_points: 0,
        cached_points: 0,
        total_computation_time_ms: 0,
        incomplete: true,
        requested_points: 0
      }
    }
  }

  // Generate Cartesian product
  const { axes, paramsList, totalPoints } = generateCartesianProductCustom(request, logger)

  // Get computation service
  const computationService = ComputationService.getInstance()

  // Execute batch computation
  const batchResult = await computationService.computeBatch(
    paramsList,
    sessionId,
    ipAddress,
    cancellationToken
  )

  // Format results
  const requestedMetrics = request.metrics ?? DEFAULT_METRICS
  const format = request.format ?? 'flat'

  const meta = {
    total_points: batchResult.results.length,
    cached_points: batchResult.results.filter(r => r.cached).length,
    total_computation_time_ms: Date.now() - startTime,
    incomplete: batchResult.cancelled,
    requested_points: totalPoints
  }

  const axesInfo = axes.map(a => ({
    name: a.name,
    values: a.displayValues,
    unit: a.name === 'SNR' && request.snrUnit === 'dB' ? 'dB' : undefined
  }))

  if (format === 'matrix') {
    return {
      format: 'matrix',
      axes: axesInfo,
      results: formatResultsMatrix(batchResult.results, axes, requestedMetrics),
      meta
    } satisfies UnifiedComputeResponseMatrix
  }

  return {
    format: 'flat',
    axes: axesInfo,
    results: formatResultsFlat(batchResult.results, axes, requestedMetrics),
    meta
  } satisfies UnifiedComputeResponseFlat
}
