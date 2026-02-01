import { expect, describe, it } from 'vitest';

export interface ISciMath {
    mean(data: Float64Array | number[]): number;
    variance(data: Float64Array | number[]): number;
    standardDeviation(data: Float64Array | number[]): number;
    median(data: Float64Array | number[]): number;
    dotProduct(a: Float64Array | number[], b: Float64Array | number[]): number;
    normalize(v: Float64Array | number[]): Float64Array;
    transpose(data: Float64Array | number[], rows: number, cols: number): Float64Array;
    matrixMultiply(a: Float64Array | number[], r1: number, c1: number, b: Float64Array | number[], r2: number, c2: number): Float64Array;
    solveLinearSystem(a: Float64Array | number[], b: Float64Array | number[], n: number): Float64Array | null;
    fft(input: Float64Array | number[]): Float64Array;
    ifft(re: number[], im: number[]): number[];
    rfft(input: Float64Array | number[]): number[];
    smoothSG(data: Float64Array | number[], window: number): Float64Array;
    findPeaks(data: Float64Array | number[], threshold: number): number[];
    estimateSNR(data: Float64Array | number[]): number;
    diff5Pt(data: Float64Array | number[], h: number): Float64Array;
    integrateSimpson(data: Float64Array | number[], h: number): number;
}

export function runParityTests(impl: ISciMath, name: string) {
    describe(`Parity Tests: ${name}`, () => {
        it('should calculate mean correctly', () => {
            const data = [1, 2, 3, 4, 5];
            expect(impl.mean(data)).toBeCloseTo(3, 10);
        });

        it('should calculate variance correctly', () => {
            const data = [1, 2, 3, 4, 5];
            expect(impl.variance(data)).toBeCloseTo(2.5, 10);
        });

        it('should perform matrix multiplication', () => {
            const a = [1, 2, 3, 4]; // 2x2
            const b = [5, 6, 7, 8]; // 2x2
            const res = impl.matrixMultiply(a, 2, 2, b, 2, 2);
            expect(Array.from(res)).toEqual([19, 22, 43, 50]);
        });

        it('should solve linear system', () => {
            const a = [2, 1, 1, 3]; // 2x2: 2x + y = 5, x + 3y = 10 -> x=1, y=3
            const b = [5, 10];
            const x = impl.solveLinearSystem(a, b, 2);
            expect(x).not.toBeNull();
            expect(x![0]).toBeCloseTo(1, 10);
            expect(x![1]).toBeCloseTo(3, 10);
        });

        it('should perform FFT and match magnitude', () => {
            const data = new Float64Array(8).fill(0);
            data[0] = 1; data[1] = 1;
            const res = impl.fft(data);
            expect(res.length).toBe(16);
            // Magnitude of DC component should be 2 (1+1)
            const mag0 = Math.sqrt(res[0]**2 + res[1]**2);
            expect(mag0).toBeCloseTo(2, 5);
        });

        it('should perform Savitzky-Golay smoothing', () => {
            const data = new Float64Array(10).fill(10);
            data[5] = 20; // spike
            const smoothed = impl.smoothSG(data, 5);
            expect(smoothed[5]).toBeLessThan(20);
            expect(smoothed[5]).toBeGreaterThan(10);
        });
    });
}
