import { describe, it, expect, beforeAll } from 'vitest';
import { runParityTests } from './shared';
import { SciMathJS } from '../../src/sci-math';
import * as WasmModule from '../../pkg/node/sci_math_wasm';

// Adapter to make WASM module match ISciMath interface (camelCase)
const WasmAdapter = {
    fitLinear: (x: Float64Array | number[], y: Float64Array | number[]) => {
        const res = WasmModule.fit_linear(new Float64Array(x), new Float64Array(y));
        return { slope: res.slope, intercept: res.intercept, r2: res.r2 };
    },
    fitPolynomial: (x: Float64Array | number[], y: Float64Array | number[], order: number) => {
        const res = WasmModule.fit_polynomial(new Float64Array(x), new Float64Array(y), order);
        return res ? new Float64Array(res) : null;
    },
    fitExponential: (x: Float64Array | number[], y: Float64Array | number[]) => {
        const res = WasmModule.fit_exponential(new Float64Array(x), new Float64Array(y));
        return res ? new Float64Array(res) : null;
    },
    fitLogarithmic: (x: Float64Array | number[], y: Float64Array | number[]) => {
        const res = WasmModule.fit_logarithmic(new Float64Array(x), new Float64Array(y));
        return res ? new Float64Array(res) : null;
    },
    smoothSavitzkyGolay: (data: Float64Array | number[], window: number) => {
        const res = WasmModule.smooth_savitzky_golay(new Float64Array(data), window);
        return new Float64Array(res);
    },
    findPeaks: (data: Float64Array | number[], threshold: number) => {
        const res = WasmModule.find_peaks(new Float64Array(data), threshold);
        return new Uint32Array(res);
    }
};

describe('SciMath Parity', () => {
    beforeAll(async () => {
        // Init wasm if necessary (for node target usually not needed if using --target nodejs, but let's be safe)
    });

    // Run tests for JS implementation
    runParityTests('JS', SciMathJS);

    // Run tests for WASM implementation
    runParityTests('WASM', WasmAdapter);
});
