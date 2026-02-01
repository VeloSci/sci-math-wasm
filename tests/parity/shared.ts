import { describe, it, expect } from 'vitest';

export interface ISciMath {
    fitLinear(x: Float64Array | number[], y: Float64Array | number[]): { slope: number, intercept: number, r2: number };
    fitPolynomial(x: Float64Array | number[], y: Float64Array | number[], order: number): Float64Array | number[] | null;
    fitExponential(x: Float64Array | number[], y: Float64Array | number[]): Float64Array | number[] | null | undefined;
    fitLogarithmic(x: Float64Array | number[], y: Float64Array | number[]): Float64Array | number[] | null | undefined;
    smoothSavitzkyGolay(data: Float64Array | number[], window: number): Float64Array | number[];
    findPeaks(data: Float64Array | number[], threshold: number): Uint32Array | number[];
}

export function runParityTests(name: string, impl: any) {
    describe(`${name} Parity Tests`, () => {
        describe('Fitting', () => {
            it('should fit linear data correctly', () => {
                const x = [1, 2, 3, 4, 5];
                const y = [2, 4, 6, 8, 10];
                const res = impl.fitLinear(x, y);
                expect(res.slope).toBeCloseTo(2.0);
                expect(res.intercept).toBeCloseTo(0.0);
                expect(res.r2).toBeCloseTo(1.0);
            });

            it('should fit polynomial data', () => {
                const x = [0, 1, 2, 3];
                const y = [0, 1, 4, 9]; // x^2
                const res = impl.fitPolynomial(x, y, 2);
                expect(res).toBeDefined();
                if (res) {
                    expect(res[0]).toBeCloseTo(0.0); // a0
                    expect(res[1]).toBeCloseTo(0.0); // a1
                    expect(res[2]).toBeCloseTo(1.0); // a2
                }
            });
             // Add more tests
        });

        describe('Analysis', () => {
             it('should smooth data with SG filter', () => {
                const data = [10, 10, 10, 100, 10, 10, 10]; // Impulse
                const smoothed = impl.smoothSavitzkyGolay(data, 5);
                expect(smoothed.length).toBe(data.length);
                // Middle point should be lower than 100
                expect(smoothed[3]).toBeLessThan(100);
            });
            
            it('should find peaks', () => {
                const data = [1, 2, 5, 2, 1, 6, 1];
                const peaks = impl.findPeaks(data, 3);
                const p = Array.from(peaks);
                expect(p).toContain(2); // Index of 5
                expect(p).toContain(5); // Index of 6
            });
        });
    });
}
