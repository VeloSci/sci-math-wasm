import { getWasmProvider } from './wasm-provider';

export function dotProduct(a: Float64Array | number[], b: Float64Array | number[]): number {
    const wasm = getWasmProvider();
    if (wasm && wasm.dotProduct) return wasm.dotProduct(a, b);
    
    let sum = 0;
    for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
    return sum;
}

export function normalize(data: Float64Array | number[]): Float64Array {
    const wasm = getWasmProvider();
    if (wasm && wasm.normalize) return wasm.normalize(data);
    
    const mag = Math.sqrt(dotProduct(data, data));
    const out = new Float64Array(data.length);
    if (mag === 0) return out;
    for (let i = 0; i < data.length; i++) out[i] = data[i] / mag;
    return out;
}

export function matrixMultiply(a: Float64Array | number[], rowsA: number, colsA: number, b: Float64Array | number[], rowsB: number, colsB: number): Float64Array {
    const wasm = getWasmProvider();
    if (wasm && wasm.matrixMultiply) return wasm.matrixMultiply(a, rowsA, colsA, b, rowsB, colsB);
    
    if (colsA !== rowsB) throw new Error("Matrix dimensions mismatch");
    const out = new Float64Array(rowsA * colsB);
    for (let i = 0; i < rowsA; i++) {
        for (let j = 0; j < colsB; j++) {
            let sum = 0;
            for (let k = 0; k < colsA; k++) {
                sum += a[i * colsA + k] * b[k * colsB + j];
            }
            out[i * colsB + j] = sum;
        }
    }
    return out;
}

export function transpose(data: Float64Array | number[], rows: number, cols: number): Float64Array {
    const wasm = getWasmProvider();
    if (wasm && wasm.transpose) return wasm.transpose(data, rows, cols);
    
    const out = new Float64Array(rows * cols);
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            out[j * rows + i] = data[i * cols + j];
        }
    }
    return out;
}

export function invert2x2(m: Float64Array | number[]): Float64Array {
    const wasm = getWasmProvider();
    if (wasm && wasm.invert2x2) return wasm.invert2x2(m);
    
    const det = m[0] * m[3] - m[1] * m[2];
    if (Math.abs(det) < 1e-12) throw new Error("Matrix is singular");
    const invDet = 1.0 / det;
    return new Float64Array([m[3] * invDet, -m[1] * invDet, -m[2] * invDet, m[0] * invDet]);
}

export function solveLinearSystem(a: Float64Array | number[], b: Float64Array | number[], n: number): Float64Array {
    const wasm = getWasmProvider();
    if (wasm && wasm.solveLinearSystem) return wasm.solveLinearSystem(a, b, n);
    
    // JS Implementation (Gauss-Jordan or similar)
    // For simplicity, we'll implement a basic Gaussian elimination if not in WASM
    const x = new Float64Array(b);
    const m = new Float64Array(a);
    for (let i = 0; i < n; i++) {
        let max = i;
        for (let k = i + 1; k < n; k++) if (Math.abs(m[k * n + i]) > Math.abs(m[max * n + i])) max = k;
        
        [x[i], x[max]] = [x[max], x[i]];
        for (let k = 0; k < n; k++) [m[i * n + k], m[max * n + k]] = [m[max * n + k], m[i * n + k]];

        for (let k = i + 1; k < n; k++) {
            const f = m[k * n + i] / m[i * n + i];
            x[k] -= f * x[i];
            for (let j = i; j < n; j++) m[k * n + j] -= f * m[i * n + j];
        }
    }
    for (let i = n - 1; i >= 0; i--) {
        let sum = 0;
        for (let j = i + 1; j < n; j++) sum += m[i * n + j] * x[j];
        x[i] = (x[i] - sum) / m[i * n + i];
    }
    return x;
}
