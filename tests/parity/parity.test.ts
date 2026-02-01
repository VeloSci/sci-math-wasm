import { describe, beforeAll } from 'vitest';
import * as wasm from '../../pkg/node/sci_math_wasm.js';
import { SciMathJS } from '../../src/sci-math';
import { runParityTests, ISciMath } from './shared';

describe('API Parity Verification', () => {
    // Adapter for WASM to match ISciMath (JS naming convention)
    const SciMathWASM: ISciMath = {
        mean: wasm.mean,
        variance: wasm.variance,
        standardDeviation: wasm.standardDeviation,
        median: wasm.median,
        dotProduct: wasm.dotProduct,
        normalize: wasm.normalize,
        transpose: wasm.transpose,
        matrixMultiply: wasm.matrixMultiply,
        solveLinearSystem: wasm.solveLinearSystem,
        fft: wasm.fft,
        ifft: (re, im) => Array.from(wasm.ifft(new Float64Array(re), new Float64Array(im))),
        rfft: (input) => Array.from(wasm.rfft(new Float64Array(input))),
        smoothSG: wasm.smoothSG,
        findPeaks: (data, threshold) => Array.from(wasm.findPeaks(new Float64Array(data), threshold)),
        estimateSNR: wasm.estimateSNR,
        diff5Pt: wasm.diff5Pt,
        integrateSimpson: wasm.integrateSimpson
    };

    beforeAll(async () => {
        // Handle optional thread initialization for Rayon
        if ((wasm as any).initThreadPool) {
            await (wasm as any).initThreadPool(2);
        }
    });

    runParityTests(SciMathJS as any, 'JS Implementation');
    runParityTests(SciMathWASM, 'WASM Implementation');
});
