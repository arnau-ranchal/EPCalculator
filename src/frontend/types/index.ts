// Core computation types
export interface ComputationParameters {
  M: number
  typeModulation: 'PAM' | 'PSK' | 'QAM'
  SNR: number
  R: number
  N: number
  n: number
  threshold: number
  distribution?: 'uniform' | 'maxwell-boltzmann'
  shaping_param?: number
}

export interface ComputationResult {
  error_probability: number
  error_exponent: number
  optimal_rho: number
  computation_time_ms: number
  cached: boolean
}

// Plot types
export interface PlotParameters extends ComputationParameters {
  y: 'error_probability' | 'error_exponent' | 'optimal_rho'
  x: 'M' | 'SNR' | 'R' | 'N' | 'n' | 'threshold'
  x_range: [number, number]
  points: number
}

export interface PlotResult {
  x_values: number[]
  y_values: number[]
  computation_time_ms: number
}

export interface ContourParameters extends ComputationParameters {
  y: 'error_probability' | 'error_exponent' | 'optimal_rho'
  x1: 'M' | 'SNR' | 'R' | 'N' | 'n' | 'threshold'
  x2: 'M' | 'SNR' | 'R' | 'N' | 'n' | 'threshold'
  x1_range: [number, number]
  x2_range: [number, number]
  points1: number
  points2: number
}

export interface ContourResult {
  x1_values: number[]
  x2_values: number[]
  z_matrix: number[][]
  computation_time_ms: number
}

// UI state types
export interface UIState {
  isComputing: boolean
  isPlotting: boolean
  showAdvancedParams: boolean
  showAdditionalParams: boolean
  plotType: 'line' | 'contour'
  plotScale: 'linear' | 'logX' | 'logY' | 'logLog'
}

// Session and analytics types
export interface SessionData {
  sessionId: string
  startTime: number
  computationCount: number
  lastActivity: number
}

export interface AnalyticsData {
  computations: {
    total: number
    today: number
    averageTime: number
    active: number
  }
  users: {
    total: number
    active: number
    activeLastHour: number
  }
  performance: {
    databaseSize: number
    memoryUsage: number
    uptime: number
  }
}

// WebAssembly types
export interface WasmModule {
  EPCalculator: {
    compute: (params: ComputationParameters) => WasmComputationResult
    computeBatch: (paramsList: ComputationParameters[]) => WasmComputationResult[]
  }
}

export interface WasmComputationResult {
  error_probability: number
  error_exponent: number
  optimal_rho: number
  success: boolean
  error_message: string
}

// Error types
export interface ApiError {
  error: string
  message: string
  statusCode: number
}

// Form validation types
export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

// Parameter constraints
export const PARAMETER_CONSTRAINTS = {
  M: { min: 2, max: 64, step: 1 },
  SNR: { min: 0, max: 1e20, step: 0.1 },
  R: { min: 0, max: 1e20, step: 0.01 },
  N: { min: 2, max: 40, step: 1 },
  n: { min: 1, max: 1000000, step: 1 },
  threshold: { min: 1e-15, max: 0.1, step: 1e-6 }
} as const

// Default values
export const DEFAULT_PARAMETERS: ComputationParameters = {
  M: 2,
  typeModulation: 'PAM',
  SNR: 5.0,
  R: 0.5,
  N: 20,
  n: 128,
  threshold: 1e-6,
  distribution: 'uniform',
  shaping_param: 0
}

export const DEFAULT_PLOT_PARAMETERS: Omit<PlotParameters, keyof ComputationParameters> = {
  y: 'error_probability',
  x: 'SNR',
  x_range: [0, 20],
  points: 5
}

export const DEFAULT_CONTOUR_PARAMETERS: Omit<ContourParameters, keyof ComputationParameters> = {
  y: 'error_probability',
  x1: 'SNR',
  x2: 'R',
  x1_range: [0, 20],
  x2_range: [0.1, 0.9],
  points1: 5,
  points2: 5
}

// University configuration
export interface UniversityConfig {
  name: string
  maxUsers: number
  branding: {
    primaryColor: string
    secondaryColor: string
    logoUrl: string
  }
}

export const UNIVERSITY_CONFIG: UniversityConfig = {
  name: 'UPF',
  maxUsers: 50,
  branding: {
    primaryColor: '#C8102E',
    secondaryColor: '#000000',
    logoUrl: 'https://www.upf.edu/favicon.ico'
  }
}
