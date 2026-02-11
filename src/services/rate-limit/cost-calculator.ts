/**
 * Cost Calculator
 *
 * Calculates the computational "cost" of API requests for usage tracking.
 * This is used for future billing - costs are tracked but NOT enforced.
 *
 * Cost is based on computational complexity:
 * - N (block length): Exponential impact O(2^N)
 * - M (constellation size): Polynomial impact O(sqrt(M))
 * - Points: Linear multiplier for batch/range/contour operations
 * - Custom constellation: Small overhead for serialization
 */

export interface CostCalculationParams {
  N?: number
  M?: number
  points?: number       // For range plots
  points1?: number      // For contour plots
  points2?: number      // For contour plots
  batchSize?: number    // For batch requests
  isCustomConstellation?: boolean
}

export type RequestType = 'single' | 'batch' | 'range' | 'contour'

/**
 * Calculate the computational cost of a request.
 *
 * Cost formula:
 *   cost = BASE * nCost * mCost * pointsMultiplier * customPenalty
 *
 * Where:
 *   - nCost = 2^((N - 2) / 8)  -- exponential, normalized to ~1-100 range
 *   - mCost = sqrt(M / 2)      -- polynomial, ~1-6 range
 *   - pointsMultiplier = number of computations (1 for single, points for range, etc.)
 *   - customPenalty = 1.2 for custom constellations (serialization overhead)
 *
 * @param params - Computation parameters
 * @param requestType - Type of request (single, batch, range, contour)
 * @returns Cost in "credits" (integer, capped at 10000)
 */
export function calculateRequestCost(
  params: CostCalculationParams,
  requestType: RequestType
): number {
  const BASE_COST = 1

  // N complexity: exponential scaling, normalized to 1-100 range
  // N=2 -> ~1, N=10 -> ~2, N=20 -> ~8, N=30 -> ~32, N=40 -> ~100
  const N = params.N ?? 20 // Default to typical value
  const nCost = Math.pow(2, (N - 2) / 8)

  // M complexity: square root scaling
  // M=2 -> 1, M=4 -> 1.4, M=16 -> 2.8, M=64 -> 5.7
  const M = params.M ?? 4 // Default to typical value
  const mCost = Math.pow(M / 2, 0.5)

  // Points multiplier based on request type
  let pointsMultiplier = 1
  switch (requestType) {
    case 'single':
      pointsMultiplier = 1
      break
    case 'batch':
      pointsMultiplier = params.batchSize ?? 1
      break
    case 'range':
      pointsMultiplier = params.points ?? 50
      break
    case 'contour':
      const p1 = params.points1 ?? 20
      const p2 = params.points2 ?? 20
      pointsMultiplier = p1 * p2
      break
  }

  // Custom constellation adds ~20% overhead (serialization, no built-in optimizations)
  const customPenalty = params.isCustomConstellation ? 1.2 : 1.0

  // Calculate total cost
  const totalCost = BASE_COST * nCost * mCost * pointsMultiplier * customPenalty

  // Cap at 10000 credits and round to integer
  return Math.min(Math.ceil(totalCost), 10000)
}

/**
 * Extract cost calculation parameters from a request body.
 * Works with both standard and custom constellation requests.
 */
export function extractCostParams(body: unknown): CostCalculationParams {
  const params = body as Record<string, unknown>

  return {
    N: typeof params.N === 'number' ? params.N : undefined,
    M: typeof params.M === 'number' ? params.M : undefined,
    points: typeof params.points === 'number' ? params.points : undefined,
    points1: typeof params.points1 === 'number' ? params.points1 : undefined,
    points2: typeof params.points2 === 'number' ? params.points2 : undefined,
    batchSize: Array.isArray(params.parameters) ? params.parameters.length : undefined,
    isCustomConstellation: params.customConstellation !== undefined ||
                           params.typeModulation === 'Custom'
  }
}

/**
 * Determine the request type from the URL path.
 */
export function getRequestTypeFromPath(path: string): RequestType {
  if (path.includes('/single/')) {
    return 'single'
  }
  if (path.includes('/batch/')) {
    return 'batch'
  }
  if (path.includes('/range/')) {
    return 'range'
  }
  if (path.includes('/contour/')) {
    return 'contour'
  }
  // Default to single for unknown paths
  return 'single'
}
