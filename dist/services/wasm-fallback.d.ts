export class EPCalculatorJS {
    hermiteRoots: Map<any, any>;
    hermiteWeights: Map<any, any>;
    initializeHermiteData(): void;
    generateConstellation(M: any, modType: any): any;
    abs2(complex: any): number;
    subtract(a: any, b: any): {
        real: number;
        imag: number;
    };
    multiply(a: any, b: any): {
        real: number;
        imag: number;
    };
    computeErrorExponent(M: any, modType: any, SNR: any, R: any, N?: number, iterations?: number, threshold?: number): {
        errorExponent: number;
        optimalRho: number;
    };
    compute(M: any, modType: any, SNR: any, R: any, N: any, n: any, threshold: any): {
        error_probability: number;
        error_exponent: number;
        optimal_rho: number;
    };
}
export const epCalculator: EPCalculatorJS;
