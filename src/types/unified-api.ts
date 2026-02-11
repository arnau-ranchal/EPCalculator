/**
 * Unified API Type Definitions
 *
 * Types for the unified computation API that supports polymorphic parameter values:
 * - Single values: `SNR: 10`
 * - Explicit lists: `SNR: [5, 10, 15]`
 * - Range (step): `SNR: { min: 0, max: 20, step: 2 }`
 * - Range (points): `SNR: { min: 0, max: 20, points: 11 }`
 */

// =============================================================================
// POLYMORPHIC PARAMETER VALUE TYPES
// =============================================================================

/** Single numeric value */
export type SingleValue = number

/** Array of numeric values */
export type ListValue = number[]

/** Range with step-based generation (like numpy.arange) */
export interface RangeStep {
  min: number
  max: number
  step: number
}

/** Range with points-based generation (like numpy.linspace) */
export interface RangePoints {
  min: number
  max: number
  points: number
}

/** Range value - either step-based or points-based */
export type RangeValue = RangeStep | RangePoints

/** A parameter value can be single, list, or range */
export type ParameterValue = SingleValue | ListValue | RangeValue

// =============================================================================
// TYPE GUARDS
// =============================================================================

/** Check if value is a range object (has 'min' property) */
export function isRangeValue(value: ParameterValue): value is RangeValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && 'min' in value
}

/** Check if range is step-based */
export function isStepRange(value: RangeValue): value is RangeStep {
  return 'step' in value
}

/** Check if range is points-based */
export function isPointsRange(value: RangeValue): value is RangePoints {
  return 'points' in value
}

/** Check if value is an array */
export function isArrayValue(value: ParameterValue): value is ListValue {
  return Array.isArray(value)
}

// =============================================================================
// OUTPUT METRICS
// =============================================================================

/** Available output metrics */
export type OutputMetric =
  | 'error_probability'
  | 'error_exponent'
  | 'optimal_rho'
  | 'mutual_information'
  | 'cutoff_rate'
  | 'critical_rate'

/** All available metrics */
export const ALL_METRICS: OutputMetric[] = [
  'error_probability',
  'error_exponent',
  'optimal_rho',
  'mutual_information',
  'cutoff_rate',
  'critical_rate'
]

/** Default metrics if not specified */
export const DEFAULT_METRICS: OutputMetric[] = [
  'error_probability',
  'error_exponent',
  'optimal_rho'
]

// =============================================================================
// REQUEST TYPES
// =============================================================================

/** SNR unit specification */
export type SNRUnit = 'dB' | 'linear'

/** Response format */
export type ResponseFormat = 'flat' | 'matrix'

/** Modulation type */
export type ModulationType = 'PAM' | 'PSK' | 'QAM'

/**
 * Unified compute request for standard modulation
 * POST /api/v1/compute/standard
 */
export interface UnifiedComputeStandardRequest {
  // Core parameters (all support polymorphic values)
  M: ParameterValue
  typeModulation: ModulationType
  SNR: ParameterValue
  R: ParameterValue
  N: ParameterValue
  n: ParameterValue
  threshold: ParameterValue

  // Options
  snrUnit?: SNRUnit
  metrics?: OutputMetric[]
  format?: ResponseFormat
}

/**
 * Constellation point for custom constellations
 */
export interface ConstellationPoint {
  real: number
  imag: number
  prob: number
}

/**
 * Unified compute request for custom constellation
 * POST /api/v1/compute/custom
 */
export interface UnifiedComputeCustomRequest {
  // Custom constellation (fixed per request)
  customConstellation: {
    points: ConstellationPoint[]
  }

  // Sweepable parameters
  SNR: ParameterValue
  R: ParameterValue
  N: ParameterValue
  n: ParameterValue
  threshold: ParameterValue

  // Options
  snrUnit?: SNRUnit
  metrics?: OutputMetric[]
  format?: ResponseFormat
}

// =============================================================================
// RESPONSE TYPES
// =============================================================================

/** Axis information for multi-parameter sweeps */
export interface AxisInfo {
  name: string
  values: number[]
  unit?: string
}

/** Single result point with metrics */
export interface ResultPoint {
  params: Record<string, number>
  metrics: Partial<Record<OutputMetric, number>>
  cached: boolean
  computation_time_ms: number
}

/** Metadata for computation response */
export interface ComputeMeta {
  total_points: number
  cached_points: number
  total_computation_time_ms: number
  incomplete?: boolean
  requested_points?: number
}

/** Flat response format */
export interface UnifiedComputeResponseFlat {
  format: 'flat'
  axes: AxisInfo[]
  results: ResultPoint[]
  meta: ComputeMeta
}

/** Nested array type for matrix format */
export type NestedMetricArray =
  | Partial<Record<OutputMetric, number>>
  | NestedMetricArray[]

/** Matrix response format */
export interface UnifiedComputeResponseMatrix {
  format: 'matrix'
  axes: AxisInfo[]
  results: NestedMetricArray
  meta: ComputeMeta
}

/** Union of response types */
export type UnifiedComputeResponse = UnifiedComputeResponseFlat | UnifiedComputeResponseMatrix

// =============================================================================
// INTERNAL TYPES (for implementation)
// =============================================================================

/** Internal axis info with both display and compute values */
export interface InternalAxisInfo {
  name: string
  displayValues: number[]
  computeValues: number[]
}

/** Expanded parameters result */
export interface ExpandedParameters {
  axes: InternalAxisInfo[]
  totalPoints: number
  fixedParams: Record<string, number | string>
}

// =============================================================================
// PARAMETER CONSTRAINTS
// =============================================================================

export const PARAMETER_CONSTRAINTS = {
  M: { min: 2, max: 64 },
  SNR_linear: { min: 0, max: 1e20 },
  SNR_dB: { min: -30, max: 200 },
  R: { min: 0, max: 1e20 },
  N: { min: 2, max: 40 },
  n: { min: 1, max: 1_000_000 },
  threshold: { min: 1e-15, max: 0.1 }
} as const

/** Maximum total points in Cartesian product */
export const MAX_TOTAL_POINTS = 10_000

/** Maximum values per axis */
export const MAX_VALUES_PER_AXIS = 1_000
