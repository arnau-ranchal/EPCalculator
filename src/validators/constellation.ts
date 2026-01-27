/**
 * Custom constellation validation utilities
 * Ported from server/simple-server-working.js
 */

export interface ConstellationPoint {
  real: number;
  imag: number;
  prob: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate custom constellation points
 * Checks that:
 * - Points is a non-empty array
 * - Each point has real, imag, prob fields (all numbers, not NaN)
 * - No negative probabilities
 * - Probabilities sum to approximately 1.0 (within 1% tolerance)
 */
export function validateCustomConstellation(points: ConstellationPoint[]): ValidationResult {
  if (!points || !Array.isArray(points)) {
    return { valid: false, error: 'Custom constellation points must be an array' };
  }

  if (points.length === 0) {
    return { valid: false, error: 'Custom constellation must have at least one point' };
  }

  for (let i = 0; i < points.length; i++) {
    const p = points[i];

    if (typeof p.real !== 'number' || typeof p.imag !== 'number' || typeof p.prob !== 'number') {
      return { valid: false, error: `Point ${i} is missing required fields (real, imag, prob)` };
    }

    if (isNaN(p.real) || isNaN(p.imag) || isNaN(p.prob)) {
      return { valid: false, error: `Point ${i} has NaN values` };
    }

    if (p.prob < 0) {
      return { valid: false, error: `Point ${i} has negative probability` };
    }
  }

  // Check total probability sums to approximately 1
  const totalProb = points.reduce((sum, p) => sum + p.prob, 0);
  if (Math.abs(totalProb - 1.0) > 0.01) {
    return { valid: false, error: `Probabilities sum to ${totalProb.toFixed(4)}, should be 1.0` };
  }

  return { valid: true };
}
