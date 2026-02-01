import { getWasmProvider } from './wasm-provider';

export function diff5Pt(data: Float64Array | number[], h: number): Float64Array {
    const wasm = getWasmProvider();
    if (wasm && wasm.diff5Pt) return wasm.diff5Pt(data, h);
    
    // JS Implementation
    const n = data.length;
    const out = new Float64Array(n);
    if (n < 5) return out;
    const inv12h = 1.0 / (12.0 * h);
    for (let i = 2; i < n - 2; i++) {
        out[i] = (data[i - 2] - 8 * data[i - 1] + 8 * data[i + 1] - data[i + 2]) * inv12h;
    }
    out[0] = (data[1] - data[0]) / h;
    out[1] = (data[2] - data[0]) / (2 * h);
    out[n - 2] = (data[n - 1] - data[n - 3]) / (2 * h);
    out[n - 1] = (data[n - 1] - data[n - 2]) / h;
    return out;
}

export function integrateSimpson(data: Float64Array | number[], h: number): number {
    const wasm = getWasmProvider();
    if (wasm && wasm.integrateSimpson) return wasm.integrateSimpson(data, h);
    
    // JS Implementation
    const n = data.length;
    if (n < 3) return 0;
    let sum = data[0] + data[n - 1];
    for (let i = 1; i < n - 1; i++) {
        sum += (i % 2 === 0 ? 2 : 4) * data[i];
    }
    return (h / 3.0) * sum;
}

export function smoothSG(data: Float64Array | number[], window: number): Float64Array {
    const wasm = getWasmProvider();
    if (wasm && wasm.smoothSG) return wasm.smoothSG(data, window);
    
    // JS Implementation
    const n = data.length, out = new Float64Array(data);
    if (n < window) return out;
    const half = Math.floor(window / 2);
    const coeffs: Record<number, { inv: number, vals: number[] }> = {
        5: { inv: 1/35, vals: [-3, 12, 17, 12, -3] },
        7: { inv: 1/21, vals: [-2, 3, 6, 7, 6, 3, -2] },
        9: { inv: 1/231, vals: [-21, 14, 39, 54, 59, 54, 39, 14, -21] },
        11: { inv: 1/429, vals: [-36, 9, 44, 69, 84, 89, 84, 69, 44, 9, -36] }
    };
    const config = coeffs[window];
    if (!config) return out;
    for (let i = half; i < n - half; i++) {
        let s = 0;
        for (let j = 0; j < window; j++) s += data[i + j - half] * config.vals[j];
        out[i] = s * config.inv;
    }
    return out;
}
