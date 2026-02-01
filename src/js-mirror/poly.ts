import { getWasmProvider } from './wasm-provider';

export function polyEval(coeffs: Float64Array | number[], x: number): number {
    const wasm = getWasmProvider();
    if (wasm && wasm.polyEval) return wasm.polyEval(coeffs, x);
    
    let res = 0;
    for (let i = coeffs.length - 1; i >= 0; i--) res = res * x + coeffs[i];
    return res;
}

export function polyDerive(coeffs: Float64Array | number[]): Float64Array {
    const wasm = getWasmProvider();
    if (wasm && wasm.polyDerive) return wasm.polyDerive(coeffs);
    
    if (coeffs.length <= 1) return new Float64Array([0]);
    const out = new Float64Array(coeffs.length - 1);
    for (let i = 1; i < coeffs.length; i++) out[i - 1] = coeffs[i] * i;
    return out;
}

export function polyIntegrate(coeffs: Float64Array | number[], c: number): Float64Array {
    const wasm = getWasmProvider();
    if (wasm && wasm.polyIntegrate) return wasm.polyIntegrate(coeffs, c);
    
    const out = new Float64Array(coeffs.length + 1);
    out[0] = c;
    for (let i = 0; i < coeffs.length; i++) out[i + 1] = coeffs[i] / (i + 1);
    return out;
}
