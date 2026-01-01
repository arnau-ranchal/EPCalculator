import type { FastifyBaseLogger } from 'fastify';
export interface ComputationParameters {
    M: number;
    typeModulation: 'PAM' | 'PSK' | 'QAM';
    SNR: number;
    R: number;
    N: number;
    n: number;
    threshold: number;
}
export interface ComputationResult {
    error_probability: number;
    error_exponent: number;
    optimal_rho: number;
    computation_time_ms: number;
    cached: boolean;
}
export interface PlotParameters extends ComputationParameters {
    y: 'error_probability' | 'error_exponent' | 'optimal_rho';
    x: 'M' | 'SNR' | 'R' | 'N' | 'n' | 'threshold';
    x_range: [number, number];
    points: number;
    snrUnit?: 'dB' | 'linear';
}
export interface PlotResult {
    x_values: number[];
    y_values: number[];
    computation_time_ms: number;
}
export interface ContourParameters extends ComputationParameters {
    y: 'error_probability' | 'error_exponent' | 'optimal_rho';
    x1: 'M' | 'SNR' | 'R' | 'N' | 'n' | 'threshold';
    x2: 'M' | 'SNR' | 'R' | 'N' | 'n' | 'threshold';
    x1_range: [number, number];
    x2_range: [number, number];
    points1: number;
    points2: number;
    snrUnit?: 'dB' | 'linear';
}
export interface ContourResult {
    x1_values: number[];
    x2_values: number[];
    z_matrix: number[][];
    computation_time_ms: number;
}
export declare class ComputationService {
    private static instance;
    private workers;
    private activeComputations;
    private isInitialized;
    private logger?;
    private constructor();
    /**
     * Generate linearly spaced values, handling the special case of points=1
     */
    private linspace;
    static getInstance(): ComputationService;
    initialize(logger?: FastifyBaseLogger): Promise<void>;
    private generateParametersHash;
    private validateParameters;
    private callWasmComputation;
    computeSingle(params: ComputationParameters, sessionId?: string, ipAddress?: string): Promise<ComputationResult>;
    private performComputation;
    computeBatch(paramsList: ComputationParameters[], sessionId?: string, ipAddress?: string): Promise<ComputationResult[]>;
    generatePlot(params: PlotParameters, sessionId?: string, ipAddress?: string): Promise<PlotResult>;
    generateContour(params: ContourParameters, sessionId?: string, ipAddress?: string): Promise<ContourResult>;
    getComputationStats(): Promise<{
        activeComputations: number;
        totalComputationsToday: number;
        averageComputationTime: number;
    }>;
    cleanup(): Promise<void>;
}
