import { getWasmProvider } from './wasm-provider';

export function mean(data: Float64Array | number[]): number {
    const wasm = getWasmProvider();
    if (wasm && wasm.mean) return wasm.mean(data);
    
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i];
    return sum / data.length;
}

export function variance(data: Float64Array | number[]): number {
    const wasm = getWasmProvider();
    if (wasm && wasm.variance) return wasm.variance(data);
    
    const m = mean(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += Math.pow(data[i] - m, 2);
    return sum / (data.length - 1);
}

export function standardDeviation(data: Float64Array | number[]): number {
    const wasm = getWasmProvider();
    if (wasm && wasm.standardDeviation) return wasm.standardDeviation(data);
    return Math.sqrt(variance(data));
}

export function median(data: Float64Array | number[]): number {
    const wasm = getWasmProvider();
    if (wasm && wasm.median) return wasm.median(data);
    
    const sorted = new Float64Array(data).sort();
    const half = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) return (sorted[half - 1] + sorted[half]) / 2.0;
    return sorted[half];
}
