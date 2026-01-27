// API utility functions for EPCalculator
// Use relative URL so it works in both development and production
// In production (Docker/Rancher), this will call the same server serving the frontend
// In development with Vite, the proxy in vite.config.ts will forward to localhost:8000
const API_BASE = '/api/v1';

// Session management for cancellation support
let sessionId = null;
let currentAbortController = null;

function getSessionId() {
  if (!sessionId) {
    // Generate a unique session ID
    sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  return sessionId;
}

// Get current AbortController for cancellation
export function getCurrentAbortController() {
  return currentAbortController;
}

// Create new AbortController for a request
export function createAbortController() {
  currentAbortController = new AbortController();
  return currentAbortController;
}

// Clear the abort controller after request completes
export function clearAbortController() {
  currentAbortController = null;
}

// Error handling
class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.cancelled = status === 499 || (data && data.error === 'Request Cancelled');
  }
}

// Generic fetch wrapper with error handling and cancellation support
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'x-session-id': getSessionId(),
    },
  };

  // Merge options, including AbortController signal if provided
  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {}),
    },
  };

  try {
    const response = await fetch(url, finalOptions);

    // Update session ID from response if provided
    const responseSessionId = response.headers.get('x-session-id');
    if (responseSessionId) {
      sessionId = responseSessionId;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new ApiError(
        errorData?.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Handle abort/cancellation
    if (error.name === 'AbortError') {
      throw new ApiError('Request was cancelled', 499, { cancelled: true });
    }

    // Network or other errors
    throw new ApiError(
      `Network error: ${error.message}`,
      0,
      { originalError: error }
    );
  }
}

// Simulation API functions
export async function computeExponents(params) {
  // Determine endpoint based on whether custom constellation is used
  const isCustom = params.customConstellation && params.customConstellation.points && params.customConstellation.points.length > 0;
  const endpoint = isCustom ? '/compute/single/custom' : '/compute/single/standard';

  return apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(params)
  });
}

export async function computeExponentsLegacy(params) {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      queryParams.append(key, value.toString());
    }
  });

  return apiRequest(`/exponents?${queryParams.toString()}`);
}

// Plotting API functions with cancellation support
export async function getPlotData(params, abortSignal = null) {
  // Determine endpoint based on whether custom constellation is used
  const isCustom = params.customConstellation && params.customConstellation.points && params.customConstellation.points.length > 0;
  const endpoint = isCustom ? '/compute/range/custom' : '/compute/range/standard';

  const options = {
    method: 'POST',
    body: JSON.stringify(params)
  };

  // Add abort signal if provided
  if (abortSignal) {
    options.signal = abortSignal;
  }

  return apiRequest(endpoint, options);
}

export async function getContourData(params, abortSignal = null) {
  // Determine endpoint based on whether custom constellation is used
  const isCustom = params.customConstellation && params.customConstellation.points && params.customConstellation.points.length > 0;
  const endpoint = isCustom ? '/compute/contour/custom' : '/compute/contour/standard';

  const options = {
    method: 'POST',
    body: JSON.stringify(params)
  };

  // Add abort signal if provided
  if (abortSignal) {
    options.signal = abortSignal;
  }

  return apiRequest(endpoint, options);
}

// Health check
export async function getHealth() {
  return apiRequest('/health');
}

// Cancel all active requests for this session
export async function cancelSession() {
  // First, abort any in-flight HTTP request
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }

  // Then tell the backend to cancel any running computations
  try {
    const result = await apiRequest('/session/cancel', {
      method: 'POST',
      body: JSON.stringify({}),  // Fastify requires a body when Content-Type is application/json
    });
    console.log('[API] Session cancelled:', result);
    return result;
  } catch (error) {
    // Even if the backend call fails, we've already aborted the fetch
    console.warn('[API] Backend cancel call failed (fetch already aborted):', error.message);
    return { status: 'aborted_locally', message: 'Request aborted' };
  }
}

// Parameter mapping for API compatibility
export function mapSimulationParams(params, customConstellation = null) {
  const baseParams = {
    SNR: params.SNR,
    R: params.R,
    N: params.N,
    n: params.n,
    threshold: params.threshold
  };

  // If custom constellation is provided, include it
  if (customConstellation && customConstellation.points) {
    return {
      ...baseParams,
      customConstellation: {
        points: customConstellation.points
      }
    };
  }

  // Otherwise, include standard modulation parameters
  return {
    ...baseParams,
    M: params.M,
    typeModulation: params.typeModulation,
    distribution: params.distribution || 'uniform',
    shaping_param: params.shaping_param || 0
  };
}

export function mapPlotParams(plotParams, simulationParams, customConstellation = null) {
  let xVar = plotParams.xVar;
  let xVar2 = plotParams.xVar2;

  // Convert SNR to linear for backend (always send it even if on an axis)
  // Backend will override it for the varying axis parameter, but we need it as a default
  // Backend always expects linear SNR values
  let snrValue = undefined;
  if (simulationParams.SNR !== undefined) {
    if (simulationParams.SNRUnit === 'dB') {
      // Convert dB to linear: linear = 10^(dB/10)
      snrValue = Math.pow(10, simulationParams.SNR / 10);
    } else {
      // Already linear
      snrValue = simulationParams.SNR;
    }
  }

  // Ensure code length (n) range values are integers when n is on an axis
  let xRange = plotParams.xRange;
  let xRange2 = plotParams.xRange2;

  if (xVar === 'n') {
    xRange = [Math.round(plotParams.xRange[0]), Math.round(plotParams.xRange[1])];
  }
  if (xVar2 === 'n') {
    xRange2 = [Math.round(plotParams.xRange2[0]), Math.round(plotParams.xRange2[1])];
  }

  const baseParams = {
    y: plotParams.yVar,
    x: xVar,
    x_range: xRange,
    points: plotParams.points,
    snrUnit: plotParams.snrUnit || 'dB',  // Pass SNR unit to backend

    // Fixed parameters from simulation (SNR is sent even if on axis - backend will override it)
    M: simulationParams.M,
    typeModulation: simulationParams.typeModulation,
    SNR: snrValue,
    R: simulationParams.R,
    N: simulationParams.N,
    n: simulationParams.n,
    threshold: simulationParams.threshold
  };

  // Include custom constellation data if provided
  if (customConstellation && customConstellation.points && customConstellation.points.length > 0) {
    baseParams.customConstellation = {
      points: customConstellation.points
    };
  }

  // Add contour/surface-specific parameters
  if (plotParams.plotType === 'contour' || plotParams.plotType === 'surface') {
    return {
      ...baseParams,
      x1: xVar,
      x2: xVar2,
      x1_range: xRange,
      x2_range: xRange2,
      points1: plotParams.points,
      points2: plotParams.points2
    };
  }

  return baseParams;
}

// Response data formatters
export function formatSimulationResponse(data) {
  // Handle both new and legacy response formats
  if (data.error_probability !== undefined) {
    return {
      errorProbability: data.error_probability,
      errorExponent: data.error_exponent,
      optimalRho: data.optimal_rho,
      computationTime: data.computation_time_ms || 0,
      cached: data.cached || false
    };
  }

  // Legacy format
  if (data['Probabilidad de error'] !== undefined) {
    return {
      errorProbability: data['Probabilidad de error'],
      errorExponent: data['error_exponent'],
      optimalRho: data['rho óptima'],
      computationTime: 0,
      cached: false
    };
  }

  throw new Error('Invalid simulation response format');
}

export function formatPlotResponse(data, metadata) {
  return {
    x: data.x_values || data.x,
    y: data.y_values || data.y,
    metadata: {
      xVar: metadata.xVar,
      yVar: metadata.yVar,
      xLabel: metadata.xLabel,
      yLabel: metadata.yLabel,
      lineColor: metadata.lineColor || 'steelblue',
      lineType: metadata.lineType || 'solid'
    }
  };
}

export function formatContourResponse(data, metadata) {
  return {
    x1: data.x1,
    x2: data.x2,
    z: data.z,
    metadata: {
      x1Var: metadata.x1Var,
      x2Var: metadata.x2Var,
      yVar: metadata.yVar,
      x1Label: metadata.x1Label,
      x2Label: metadata.x2Label,
      zLabel: metadata.zLabel
    }
  };
}

// Utility for handling API errors in components
export function handleApiError(error, fallbackMessage = 'An error occurred') {
  console.error('API Error:', error);

  if (error instanceof ApiError) {
    return {
      message: error.message,
      status: error.status,
      details: error.data
    };
  }

  return {
    message: fallbackMessage,
    status: 0,
    details: null
  };
}