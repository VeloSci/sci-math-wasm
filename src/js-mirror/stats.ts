export function mean(data: Float64Array | number[]): number {
    if (data.length === 0) return NaN;
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i];
    return sum / data.length;
}

export function variance(data: Float64Array | number[]): number {
    if (data.length < 2) return 0;
    const m = mean(data);
    let ssTot = 0;
    for (let i = 0; i < data.length; i++) ssTot += Math.pow(data[i] - m, 2);
    return ssTot / (data.length - 1);
}

export function standardDeviation(data: Float64Array | number[]): number {
    return Math.sqrt(variance(data));
}

export function median(data: Float64Array | number[]): number {
    if (data.length === 0) return NaN;
    const sorted = [...data].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function estimateSNR(data: Float64Array | number[]): number {
    const n = data.length;
    if (n < 2) return 0;
    const m = mean(data);
    let ssTot = 0;
    for (let i = 0; i < n; i++) ssTot += Math.pow(data[i] - m, 2);
    const svar = ssTot / n;
    
    const diffs = new Float64Array(n - 1);
    for (let i = 0; i < n - 1; i++) diffs[i] = Math.abs(data[i+1] - data[i]);
    diffs.sort();
    const ns = diffs[Math.floor(diffs.length / 2)] / 0.6745;
    const nvar = ns * ns;
    
    return nvar < 1e-18 ? 100 : 10 * Math.log10(svar / nvar);
}
