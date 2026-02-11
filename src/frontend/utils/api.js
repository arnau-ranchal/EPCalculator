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

// =============================================================================
// UNIFIED API FUNCTIONS
// =============================================================================
// The new unified API uses polymorphic parameters:
// - Single value: `SNR: 10`
// - List: `SNR: [5, 10, 15]`
// - Range with step: `SNR: { min: 0, max: 20, step: 2 }`
// - Range with points: `SNR: { min: 0, max: 20, points: 11 }`

/**
 * Execute computation using unified API
 * Handles both single-point and multi-point (range/sweep) computations
 */
export async function computeUnified(params, abortSignal = null) {
  const isCustom = params.customConstellation &&
                   params.customConstellation.points &&
                   params.customConstellation.points.length > 0;
  const endpoint = isCustom ? '/compute/custom' : '/compute/standard';

  const options = {
    method: 'POST',
    body: JSON.stringify(params)
  };

  if (abortSignal) {
    options.signal = abortSignal;
  }

  return apiRequest(endpoint, options);
}

/**
 * Single-point computation (simulation panel)
 * Wraps unified API and extracts the single result point
 */
export async function computeExponents(params) {
  // Determine endpoint based on whether custom constellation is used
  const isCustom = params.customConstellation && params.customConstellation.points && params.customConstellation.points.length > 0;
  const endpoint = isCustom ? '/compute/custom' : '/compute/standard';

  // For single computation, all params are single values
  // Request all standard metrics
  const unifiedParams = {
    ...params,
    metrics: ['error_probability', 'error_exponent', 'optimal_rho'],
    format: 'flat'
  };

  const response = await apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(unifiedParams)
  });

  // Extract single result from unified response
  if (response.results && response.results.length > 0) {
    const result = response.results[0];
    return {
      error_probability: result.metrics.error_probability,
      error_exponent: result.metrics.error_exponent,
      optimal_rho: result.metrics.optimal_rho,
      computation_time_ms: result.computation_time_ms,
      cached: result.cached
    };
  }

  throw new Error('No results returned from computation');
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

// =============================================================================
// PLOTTING API FUNCTIONS (using unified API)
// =============================================================================

/**
 * Get plot data (line plot) using unified API
 * Converts old params format to unified polymorphic format
 */
export async function getPlotData(params, abortSignal = null) {
  const isCustom = params.customConstellation &&
                   params.customConstellation.points &&
                   params.customConstellation.points.length > 0;
  const endpoint = isCustom ? '/compute/custom' : '/compute/standard';

  // Convert old format to unified format with polymorphic x-axis parameter
  const unifiedParams = convertToUnifiedPlotParams(params);

  const options = {
    method: 'POST',
    body: JSON.stringify(unifiedParams)
  };

  if (abortSignal) {
    options.signal = abortSignal;
  }

  const response = await apiRequest(endpoint, options);

  // Convert unified response back to old format for compatibility
  return convertFromUnifiedPlotResponse(response, params);
}

/**
 * Get contour/surface plot data using unified API
 * Converts old params format to unified polymorphic format with 2 axes
 */
export async function getContourData(params, abortSignal = null) {
  const isCustom = params.customConstellation &&
                   params.customConstellation.points &&
                   params.customConstellation.points.length > 0;
  const endpoint = isCustom ? '/compute/custom' : '/compute/standard';

  // Convert old format to unified format with 2 polymorphic axes
  const unifiedParams = convertToUnifiedContourParams(params);

  const options = {
    method: 'POST',
    body: JSON.stringify(unifiedParams)
  };

  if (abortSignal) {
    options.signal = abortSignal;
  }

  const response = await apiRequest(endpoint, options);

  // Convert unified response back to old contour format
  return convertFromUnifiedContourResponse(response, params);
}

/**
 * Get table data with all metrics using unified API
 */
export async function getRangeAllData(params, abortSignal = null) {
  const isCustom = params.customConstellation &&
                   params.customConstellation.points &&
                   params.customConstellation.points.length > 0;
  const endpoint = isCustom ? '/compute/custom' : '/compute/standard';

  // Convert to unified format requesting all metrics
  const unifiedParams = convertToUnifiedPlotParams(params, true); // true = all metrics

  const options = {
    method: 'POST',
    body: JSON.stringify(unifiedParams)
  };

  if (abortSignal) {
    options.signal = abortSignal;
  }

  const response = await apiRequest(endpoint, options);

  // Convert unified response to table format
  return convertFromUnifiedTableResponse(response, params);
}

// =============================================================================
// UNIFIED API CONVERSION HELPERS
// =============================================================================

/**
 * Convert old plot params to unified polymorphic format
 */
function convertToUnifiedPlotParams(params, allMetrics = false) {
  const xVar = params.x;
  const [xMin, xMax] = params.x_range;
  const points = params.points;

  // Build base params with single values for non-x-axis parameters
  const baseParams = {
    M: params.M,
    typeModulation: params.typeModulation,
    SNR: params.SNR,
    R: params.R,
    N: params.N,
    n: params.n,
    threshold: params.threshold,
    snrUnit: params.snrUnit || 'dB',
    format: 'flat'
  };

  // Override the x-axis parameter with a range
  baseParams[xVar] = { min: xMin, max: xMax, points: points };

  // Set metrics based on requested y variable or all
  if (allMetrics) {
    baseParams.metrics = [
      'error_probability',
      'error_exponent',
      'optimal_rho',
      'mutual_information',
      'cutoff_rate',
      'critical_rate'
    ];
  } else {
    // Map y variable to metric name
    const yVar = params.y;
    const metricMap = {
      'error_probability': 'error_probability',
      'error_exponent': 'error_exponent',
      'optimal_rho': 'optimal_rho',
      'rho': 'optimal_rho',
      'mutual_information': 'mutual_information',
      'cutoff_rate': 'cutoff_rate',
      'critical_rate': 'critical_rate'
    };
    baseParams.metrics = [metricMap[yVar] || yVar];
  }

  // Handle custom constellation
  if (params.customConstellation && params.customConstellation.points && params.customConstellation.points.length > 0) {
    baseParams.customConstellation = params.customConstellation;
    // Remove M and typeModulation for custom
    delete baseParams.M;
    delete baseParams.typeModulation;
  }

  return baseParams;
}

/**
 * Convert old contour params to unified polymorphic format with 2 axes
 */
function convertToUnifiedContourParams(params) {
  const x1Var = params.x1;
  const x2Var = params.x2;
  const [x1Min, x1Max] = params.x1_range;
  const [x2Min, x2Max] = params.x2_range;
  const points1 = params.points1;
  const points2 = params.points2;

  // Build base params with single values
  const baseParams = {
    M: params.M,
    typeModulation: params.typeModulation,
    SNR: params.SNR,
    R: params.R,
    N: params.N,
    n: params.n,
    threshold: params.threshold,
    snrUnit: params.snrUnit || 'dB',
    format: 'matrix' // Use matrix format for contour data
  };

  // Override the two axis parameters with ranges
  baseParams[x1Var] = { min: x1Min, max: x1Max, points: points1 };
  baseParams[x2Var] = { min: x2Min, max: x2Max, points: points2 };

  // Map y variable to metric
  const yVar = params.y;
  const metricMap = {
    'error_probability': 'error_probability',
    'error_exponent': 'error_exponent',
    'optimal_rho': 'optimal_rho',
    'rho': 'optimal_rho',
    'mutual_information': 'mutual_information',
    'cutoff_rate': 'cutoff_rate',
    'critical_rate': 'critical_rate'
  };
  baseParams.metrics = [metricMap[yVar] || yVar];

  // Handle custom constellation
  if (params.customConstellation && params.customConstellation.points && params.customConstellation.points.length > 0) {
    baseParams.customConstellation = params.customConstellation;
    delete baseParams.M;
    delete baseParams.typeModulation;
  }

  return baseParams;
}

/**
 * Convert unified response back to old plot format
 */
function convertFromUnifiedPlotResponse(response, originalParams) {
  const xVar = originalParams.x;
  const yMetric = originalParams.y;

  // Find the x-axis in response
  const xAxis = response.axes.find(a => a.name === xVar);
  const xValues = xAxis ? xAxis.values : [];

  // Extract y values from results
  const metricKey = yMetric === 'rho' ? 'optimal_rho' : yMetric;
  const yValues = response.results.map(r => r.metrics[metricKey]);

  return {
    x_values: xValues,
    y_values: yValues,
    computation_time_ms: response.meta.total_computation_time_ms,
    cached: response.meta.cached_points === response.meta.total_points
  };
}

/**
 * Convert unified response back to old contour format
 */
function convertFromUnifiedContourResponse(response, originalParams) {
  const x1Var = originalParams.x1;
  const x2Var = originalParams.x2;
  const yMetric = originalParams.y;

  // Find axes in response
  const x1Axis = response.axes.find(a => a.name === x1Var);
  const x2Axis = response.axes.find(a => a.name === x2Var);

  const x1Values = x1Axis ? x1Axis.values : [];
  const x2Values = x2Axis ? x2Axis.values : [];

  // Extract z matrix from results (matrix format)
  const metricKey = yMetric === 'rho' ? 'optimal_rho' : yMetric;

  // For matrix format, results is a 2D array of metric objects
  let zMatrix;
  if (response.format === 'matrix' && Array.isArray(response.results)) {
    zMatrix = response.results.map(row =>
      Array.isArray(row)
        ? row.map(cell => cell[metricKey])
        : [row[metricKey]] // Single row case
    );
  } else {
    // Fall back to flat format - reconstruct matrix
    const rows = x1Values.length;
    const cols = x2Values.length;
    zMatrix = [];
    for (let i = 0; i < rows; i++) {
      const row = [];
      for (let j = 0; j < cols; j++) {
        const flatIdx = i * cols + j;
        if (flatIdx < response.results.length) {
          row.push(response.results[flatIdx].metrics[metricKey]);
        }
      }
      zMatrix.push(row);
    }
  }

  return {
    x1_values: x1Values,
    x2_values: x2Values,
    z_matrix: zMatrix,
    computation_time_ms: response.meta.total_computation_time_ms
  };
}

/**
 * Convert unified response to table format (all metrics)
 */
function convertFromUnifiedTableResponse(response, originalParams) {
  const xVar = originalParams.x;
  const xAxis = response.axes.find(a => a.name === xVar);
  const xValues = xAxis ? xAxis.values : [];

  // Build results array with all metrics per point
  const results = response.results.map(r => ({
    error_probability: r.metrics.error_probability,
    error_exponent: r.metrics.error_exponent,
    optimal_rho: r.metrics.optimal_rho,
    mutual_information: r.metrics.mutual_information,
    cutoff_rate: r.metrics.cutoff_rate,
    critical_rate: r.metrics.critical_rate
  }));

  return {
    x_values: xValues,
    results: results,
    computation_time_ms: response.meta.total_computation_time_ms
  };
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

// =============================================================================
// PARAMETER MAPPING FOR API COMPATIBILITY
// =============================================================================

/**
 * Map simulation parameters for unified API
 * NOTE: The unified API now handles SNR unit conversion internally via snrUnit parameter
 */
export function mapSimulationParams(params, customConstellation = null) {
  // Base parameters - SNR stays in its original unit (dB or linear)
  // The backend handles conversion based on snrUnit
  const baseParams = {
    SNR: params.SNR,
    R: params.R,
    N: params.N,
    n: params.n,
    threshold: params.threshold,
    snrUnit: params.SNRUnit || 'dB'  // Pass the unit so backend can convert
  };

  // If custom constellation is provided, use /compute/custom endpoint format
  if (customConstellation && customConstellation.points && customConstellation.points.length > 0) {
    return {
      ...baseParams,
      customConstellation: {
        points: customConstellation.points
      }
    };
  }

  // Otherwise, use /compute/standard endpoint format
  return {
    ...baseParams,
    M: params.M,
    typeModulation: params.typeModulation
  };
}

/**
 * Map plot parameters for unified API
 * Creates the intermediate format expected by getPlotData/getContourData
 * which then gets converted to unified polymorphic format internally
 */
export function mapPlotParams(plotParams, simulationParams, customConstellation = null) {
  let xVar = plotParams.xVar;
  let xVar2 = plotParams.xVar2;

  // Ensure code length (n) range values are integers when n is on an axis
  let xRange = plotParams.xRange;
  let xRange2 = plotParams.xRange2;

  if (xVar === 'n') {
    xRange = [Math.round(plotParams.xRange[0]), Math.round(plotParams.xRange[1])];
  }
  if (xVar2 === 'n') {
    xRange2 = [Math.round(plotParams.xRange2[0]), Math.round(plotParams.xRange2[1])];
  }

  // Build params in intermediate format that convertToUnifiedPlotParams expects
  // NOTE: SNR is now passed in its display unit - backend converts via snrUnit
  const baseParams = {
    y: plotParams.yVar,
    x: xVar,
    x_range: xRange,
    points: plotParams.points,
    snrUnit: plotParams.snrUnit || 'dB',

    // Fixed parameters from simulation
    M: simulationParams.M,
    typeModulation: simulationParams.typeModulation,
    SNR: simulationParams.SNR,  // Keep in display unit (dB or linear)
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
    x1: data.x1_values || data.x1,
    x2: data.x2_values || data.x2,
    z: data.z_matrix || data.z,
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