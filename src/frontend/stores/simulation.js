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
  isValid: true,
  name: null, // User-defined name for custom constellations (null = not named)
  id: null // Unique ID if saved to the collection
});

// Counter for generating unique default constellation names
export const customConstellationCounter = writable(0);

// Collection of all saved custom constellations
// Each entry: { id: string, name: string, points: array, createdAt: timestamp }
export const savedCustomConstellations = writable([]);

// Helper to generate unique ID
function generateConstellationId() {
  return `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Save a custom constellation to the collection
export function saveCustomConstellation(name, points) {
  const id = generateConstellationId();
  const constellation = {
    id,
    name,
    points: JSON.parse(JSON.stringify(points)), // Deep copy
    createdAt: Date.now()
  };

  savedCustomConstellations.update(list => [...list, constellation]);
  return id;
}

// Load a saved constellation by ID
export function loadSavedConstellation(id) {
  let found = null;
  savedCustomConstellations.subscribe(list => {
    found = list.find(c => c.id === id);
  })();

  if (found) {
    customConstellation.set({
      points: JSON.parse(JSON.stringify(found.points)),
      isValid: true,
      name: found.name,
      id: found.id
    });
    useCustomConstellation.set(true);
    return true;
  }
  return false;
}

// Delete a saved constellation
export function deleteSavedConstellation(id) {
  savedCustomConstellations.update(list => list.filter(c => c.id !== id));
}

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

// Generate standard constellation points
export function generateStandardConstellation(M, type) {
  const points = [];
  const prob = 1 / M;

  if (type === 'PAM') {
    // PAM: M points on real axis, centered at 0
    for (let i = 0; i < M; i++) {
      const real = (2 * i - M + 1);
      points.push({ real, imag: 0, prob });
    }
  } else if (type === 'PSK') {
    // PSK: M points on unit circle
    for (let i = 0; i < M; i++) {
      const angle = (2 * Math.PI * i) / M;
      points.push({
        real: Math.cos(angle),
        imag: Math.sin(angle),
        prob
      });
    }
  } else if (type === 'QAM') {
    // QAM: Square grid
    const side = Math.sqrt(M);
    if (side !== Math.floor(side)) {
      // Fallback to PSK if M is not a perfect square
      return generateStandardConstellation(M, 'PSK');
    }
    for (let i = 0; i < side; i++) {
      for (let j = 0; j < side; j++) {
        const real = (2 * i - side + 1);
        const imag = (2 * j - side + 1);
        points.push({ real, imag, prob });
      }
    }
  }

  // Normalize energy to 1
  const totalEnergy = points.reduce((sum, p) => sum + p.prob * (p.real * p.real + p.imag * p.imag), 0);
  const scale = totalEnergy > 0 ? Math.sqrt(1 / totalEnergy) : 1;

  return points.map(p => ({
    real: Math.round(p.real * scale * 1000) / 1000,
    imag: Math.round(p.imag * scale * 1000) / 1000,
    prob: p.prob
  }));
}