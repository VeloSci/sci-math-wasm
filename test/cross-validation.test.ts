import { describe, it, expect, beforeAll } from 'vitest';
import * as wasm from '../pkg/node/sci_math_wasm.js';
import { SciMathJS } from '../src/sci-math';
import { Worker } from 'node:worker_threads';

// Polyfill Worker for wasm-bindgen-rayon in Node.js
if (typeof globalThis.Worker === 'undefined') {
    (globalThis as any).Worker = Worker;
}

describe('Cross-Validation: WASM vs JS', () => {
    let engine: wasm.SciEngine;

    beforeAll(async () => {
        // initThreadPool handles Rayon setup in Node
        await wasm.initThreadPool(2);
        engine = new wasm.SciEngine();
    });

    const assertNear = (actual: number | Float64Array | number[], expected: number | Float64Array | number[], epsilon = 1e-10) => {
        if (typeof actual === 'number' && typeof expected === 'number') {
            expect(Math.abs(actual - expected)).toBeLessThan(epsilon);
        } else if (actual instanceof Float64Array || Array.isArray(actual)) {
            const exp = expected as any;
            expect(actual.length).toBe(exp.length);
            for (let i = 0; i < actual.length; i++) {
                expect(Math.abs(actual[i] - exp[i])).toBeLessThan(epsilon);
            }
        }
    };

    it('should match Stats: Mean, Variance, Median', () => {
        const data = new Float64Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        assertNear(SciMathJS.mean(data), wasm.mean(data));
        assertNear(SciMathJS.variance(data), wasm.variance(data));
        assertNear(SciMathJS.median(data), wasm.median(data));
    });

    it('should match Linear Algebra: Dot Product & Normalize', () => {
        const a = new Float64Array([1, 2, 3]);
        const b = new Float64Array([4, 5, 6]);
        assertNear(SciMathJS.dotProduct(a, b), wasm.dot_product(a, b));
        assertNear(SciMathJS.normalize(a), wasm.normalize(a));
    });

    it('should match Signal: Moving Average & SNR', () => {
        const data = new Float64Array([1, 2, 1, 2, 1, 10, 1, 2, 1]);
        assertNear(SciMathJS.movingAverage(data, 3), wasm.moving_average(data, 3));
        
        // SNR is currently engine-only, we can add it to top-level if needed or skip for now
    });

    it('should match FFT', () => {
        const data = new Float64Array([1, 0, 0, 0, 1, 0, 0, 0]);
        const wasmFFT = wasm.fft(data);
        
        const re = new Float64Array(data.length);
        const im = new Float64Array(data.length);
        re.set(data);
        SciMathJS.fftRadix2(re, im);
        
        for (let i = 0; i < data.length; i++) {
            assertNear(re[i], wasmFFT[2 * i]);
            assertNear(im[i], wasmFFT[2 * i + 1]);
        }
    });

    it('should match Linear Regression', () => {
        const x = new Float64Array([0, 1, 2, 3]);
        const y = new Float64Array([1, 2, 3, 4]);
        const wasmRes = wasm.linear_regression(x, y);
        const jsRes = SciMathJS.fitLinear(x, y);
        assertNear(jsRes[0], wasmRes.slope);
        assertNear(jsRes[1], wasmRes.intercept);
    });
});
