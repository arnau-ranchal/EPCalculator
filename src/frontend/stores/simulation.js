// Simulation state management
import { writable, derived } from 'svelte/store';

// Simulation parameters
export const simulationParams = writable({
  M: 16,
  typeModulation: 'PAM',
  SNR: 7,
  SNRUnit: 'linear', // 'linear' or 'dB'
  R: 0.5,
  n: 100,
  // Advanced parameters
  N: 20,
  threshold: 1e-6
});

// Simulation results
export const simulationResults = writable(null);

// Loading states
export const isComputing = writable(false);

// UI state
export const showAdvancedParams = writable(false);

// Custom constellation state
export const useCustomConstellation = writable(false);
export const customConstellation = writable({
  points: [
    { real: 1, imag: 0, prob: 0.25 },
    { real: 0, imag: 1, prob: 0.25 },
    { real: -1, imag: 0, prob: 0.25 },
    { real: 0, imag: -1, prob: 0.25 }
  ],
  isValid: true
});

// Parameter validation
export const paramValidation = derived(
  [simulationParams, useCustomConstellation, customConstellation],
  ([$params, $useCustom, $customConst]) => {
    const errors = {};

    // Skip M and typeModulation validation if using custom constellation
    if (!$useCustom) {
      // Validate M (Modulation) - must be power of 2
      const validMValues = [2, 4, 8, 16, 32, 64, 128, 256, 512];
      if (!validMValues.includes($params.M)) {
        errors.M = 'Modulation must be a power of 2 between 2 and 512';
      }

      // Additional validation for QAM - M must be a perfect square (4, 16, 64, 256)
      if ($params.typeModulation === 'QAM') {
        const sqrt = Math.sqrt($params.M);
        if (sqrt !== Math.floor(sqrt)) {
          errors.M = 'QAM requires M to be a perfect square (4, 16, 64, 256)';
        }
      }
    } else {
      // Validate custom constellation
      if (!$customConst.isValid) {
        errors.customConstellation = 'Custom constellation is not valid (check probability sum and energy)';
      }
      // For custom constellation, M must match point count and be >= 2
      if ($params.M < 2) {
        errors.M = 'Custom constellation requires at least 2 points';
      }
    }

    // Validate SNR
    if ($params.SNR < 0 || $params.SNR > 1e20) {
      errors.SNR = 'SNR must be between 0 and 1e20';
    }

    // Validate R (Rate)
    if ($params.R < 0 || $params.R > 1e20) {
      errors.R = 'Rate must be between 0 and 1e20';
    }

    // Validate n (Code Length)
    if ($params.n < 1 || $params.n > 1000000) {
      errors.n = 'Code length must be between 1 and 1000000';
    }

    // Validate N (Quadrature)
    if ($params.N < 2 || $params.N > 40) {
      errors.N = 'Quadrature must be between 2 and 40';
    }

    // Validate threshold
    if ($params.threshold < 1e-15 || $params.threshold > 0.1) {
      errors.threshold = 'Threshold must be between 1e-15 and 0.1';
    }

    return {
      errors,
      isValid: Object.keys(errors).length === 0
    };
  }
);

// Helper functions
export function updateParam(key, value) {
  simulationParams.update(params => ({
    ...params,
    [key]: value
  }));
}

export function resetParams() {
  simulationParams.set({
    M: 16,
    typeModulation: 'PAM',
    SNR: 7,
    SNRUnit: 'linear',
    R: 0.5,
    n: 100,
    N: 20,
    threshold: 1e-6
  });
}

export function fillDefaults() {
  simulationParams.update(params => ({
    M: params.M || 16,
    typeModulation: params.typeModulation || 'PAM',
    SNR: params.SNR || 7,
    SNRUnit: params.SNRUnit || 'linear',
    R: params.R || 0.5,
    n: params.n || 100,
    N: params.N || 20,
    threshold: params.threshold || 1e-6
  }));
}

// SNR conversion utilities
export function linearToDb(linear) {
  return 10 * Math.log10(linear);
}

export function dbToLinear(db) {
  return Math.pow(10, db / 10);
}

// Get SNR in linear form (for backend)
export function getSNRLinear(params) {
  if (params.SNRUnit === 'dB') {
    return dbToLinear(params.SNR);
  }
  return params.SNR;
}