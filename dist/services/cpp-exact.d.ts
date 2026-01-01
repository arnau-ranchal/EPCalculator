export class EPCalculatorCPP {
    isAvailable: boolean;
    /**
     * Compute error exponents using exact C++ implementation
     * @param {number} M - Constellation size
     * @param {string} typeModulation - Modulation type (PAM, PSK, QAM)
     * @param {number} SNR - Signal-to-noise ratio
     * @param {number} R - Code rate
     * @param {number} N - Block length parameter
     * @param {number} n - Channel uses
     * @param {number} threshold - Convergence threshold
     * @param {string} distribution - Distribution type (uniform, maxwell-boltzmann)
     * @param {number} shaping_param - Shaping parameter (beta for Maxwell-Boltzmann)
     * @returns {Object} Computation results
     */
    compute(M: number, typeModulation: string, SNR: number, R: number, N: number, n: number, threshold: number, distribution?: string, shaping_param?: number): any;
    /**
     * Compute error exponents using custom constellation
     * @param {Array} points - Array of constellation points {real, imag, prob}
     * @param {number} SNR - Signal-to-noise ratio
     * @param {number} R - Code rate
     * @param {number} N - Block length parameter
     * @param {number} n - Channel uses
     * @param {number} threshold - Convergence threshold
     * @returns {Object} Computation results
     */
    computeCustom(points: any[], SNR: number, R: number, N: number, n: number, threshold: number): any;
    /**
     * Check if the C++ library is available
     * @returns {boolean} True if library is loaded and ready
     */
    isReady(): boolean;
    /**
     * Get library status information
     * @returns {Object} Status information
     */
    getStatus(): any;
}
export const cppCalculator: EPCalculatorCPP;
