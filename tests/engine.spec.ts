import os from 'os';
import { beforeAll, describe, expect, it } from 'vitest';
import * as wasm from '../pkg/node/sci_math_wasm.js';

const { SciEngine, initThreadPool, get_wasm_memory } = wasm as any;

beforeAll(async () => {
    const maybeInit = (wasm as any).default;
    if (typeof maybeInit === 'function') {
        await maybeInit();
    }
    const threads = Math.max(2, Math.min(8, os.cpus()?.length ?? 4));
    if (typeof initThreadPool === 'function') {
        try {
            await initThreadPool(threads);
        } catch (err) {
            console.warn('Threads not supported in this environment');
        }
    }
});

describe('SciEngine', () => {
    it('should manage vectors correctly', () => {
        const engine = new SciEngine();
        const id1 = engine.create_vector(100);
        const id2 = engine.create_vector(200);
        expect(id1).toBe(0);
        expect(id2).toBe(1);
        
        const ptr = engine.get_ptr(id1);
        expect(ptr).toBeDefined();
    });

    it('should perform signal processing', () => {
        const engine = new SciEngine();
        const n = 100;
        const idIn = engine.create_vector(n);
        const idOut = engine.create_vector(n);
        const idX = engine.create_vector(n);
        
        const data = new Float64Array(100).fill(0).map((_, i) => Math.sin(i * 0.1) + Math.random() * 0.1);
        const x = new Float64Array(100).fill(0).map((_, i) => i * 0.1);
        
        // Use wasm.memory to write data
        const viewIn = new Float64Array(get_wasm_memory().buffer, engine.get_ptr(idIn), n);
        const viewX = new Float64Array(get_wasm_memory().buffer, engine.get_ptr(idX), n);
        viewIn.set(data);
        viewX.set(x);

        engine.smooth_sg(idIn, idOut, 5, 2);
        const smoothed = new Float64Array(get_wasm_memory().buffer, engine.get_ptr(idOut), n);
        expect(smoothed[25]).not.toBe(0);

        // Iterative baseline
        engine.remove_baseline(idIn, idX, 3, idOut, 5);
        const baselineRemoved = new Float64Array(get_wasm_memory().buffer, engine.get_ptr(idOut), n);
        expect(baselineRemoved[50]).toBeDefined();

        // Peak detection with prominence
        const peaks = engine.detect_peaks(idOut, 0.1, 0.05);
        expect(peaks.length).toBeDefined();
    });

    it('should perform data fitting', () => {
        const engine = new SciEngine();
        const n = 10;
        const idX = engine.create_vector(n);
        const idY = engine.create_vector(n);
        
        const x = new Float64Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        const y = new Float64Array([1, 3, 5, 7, 9, 11, 13, 15, 17, 19]); // y = 2x + 1

        new Float64Array(get_wasm_memory().buffer, engine.get_ptr(idX), n).set(x);
        new Float64Array(get_wasm_memory().buffer, engine.get_ptr(idY), n).set(y);

        const linear = engine.fit_linear(idX, idY);
        expect(linear[0]).toBeCloseTo(2); // slope (unnormalized)
        expect(linear[1]).toBeCloseTo(1); // intercept (unnormalized)

        // fit_poly normalizes X to [0, 1] internally for stability
        // y = 2x + 1 -> with x' = x/9 -> y = 18x' + 1
        const poly = engine.fit_poly(idX, idY, 1);
        expect(poly[1]).toBeCloseTo(18); // slope for normalized x
        expect(poly[0]).toBeCloseTo(1);  // intercept

        const expo = engine.fit_exponential(idX, idY);
        expect(expo.length).toBe(2);

        const loga = engine.fit_logarithmic(idX, idY);
        expect(loga.length).toBe(2);

        // Multi-Gaussian Fit (1 Gaussian)
        const initial = new Float64Array([10, 5, 1]); // amp, mu, sigma
        const gauss = engine.fit_gaussians(idX, idY, initial);
        expect(gauss.length).toBe(3);
    });

    it('should perform calculus and FFT', () => {
        const engine = new SciEngine();
        const n = 16;
        const idRe = engine.create_vector(n);
        const idIm = engine.create_vector(n);
        const idOut = engine.create_vector(n);

        const data = new Float64Array(n).fill(1);
        new Float64Array(get_wasm_memory().buffer, engine.get_ptr(idRe), n).set(data);

        engine.fft(idRe, idIm, false);
        const re = new Float64Array(get_wasm_memory().buffer, engine.get_ptr(idRe), n);
        expect(re[0]).toBeCloseTo(n);

        engine.diff(idRe, idOut, 0.1);
        engine.integrate(idRe, 0.1);
    });
});
