export function dotProduct(a: Float64Array | number[], b: Float64Array | number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
    return sum;
}

export function normalize(v: Float64Array | number[]): Float64Array {
    const n = v.length;
    let sumSq = 0;
    for (let i = 0; i < n; i++) sumSq += v[i] * v[i];
    const mag = Math.sqrt(sumSq);
    const res = new Float64Array(n);
    if (mag > 0) {
        for (let i = 0; i < n; i++) res[i] = v[i] / mag;
    }
    return res;
}

export function transpose(data: Float64Array | number[], rows: number, cols: number): Float64Array {
    const res = new Float64Array(rows * cols);
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            res[j * rows + i] = data[i * cols + j];
        }
    }
    return res;
}

export function matrixMultiply(a: Float64Array | number[], rowsA: number, colsA: number, b: Float64Array | number[], rowsB: number, colsB: number): Float64Array {
    if (colsA !== rowsB) throw new Error("Incompatible dimensions");
    const res = new Float64Array(rowsA * colsB);
    for (let i = 0; i < rowsA; i++) {
        for (let k = 0; k < colsA; k++) {
            const aik = a[i * colsA + k];
            for (let j = 0; j < colsB; j++) {
                res[i * colsB + j] += aik * b[k * colsB + j];
            }
        }
    }
    return res;
}

export function solveLinearSystem(a: Float64Array | number[], b: Float64Array | number[], n: number): Float64Array | null {
    const aCopy = new Float64Array(a);
    const bCopy = new Float64Array(b);
    for (let i = 0; i < n; i++) {
        let maxRow = i;
        let maxVal = Math.abs(aCopy[i * n + i]);
        for (let k = i + 1; k < n; k++) {
            if (Math.abs(aCopy[k * n + i]) > maxVal) {
                maxVal = Math.abs(aCopy[k * n + i]);
                maxRow = k;
            }
        }
        if (maxVal < 1e-12) return null;
        for (let k = i; k < n; k++) [aCopy[i * n + k], aCopy[maxRow * n + k]] = [aCopy[maxRow * n + k], aCopy[i * n + k]];
        [bCopy[i], bCopy[maxRow]] = [bCopy[maxRow], bCopy[i]];
        const pivot = aCopy[i * n + i];
        for (let k = i; k < n; k++) aCopy[i * n + k] /= pivot;
        bCopy[i] /= pivot;
        for (let k = 0; k < n; k++) {
            if (k !== i) {
                const factor = aCopy[k * n + i];
                for (let j = i; j < n; j++) aCopy[k * n + j] -= factor * aCopy[i * n + j];
                bCopy[k] -= factor * bCopy[i];
            }
        }
    }
    return bCopy;
}

export function invert2x2(m: Float64Array | number[]): Float64Array | null {
    const det = m[0] * m[3] - m[1] * m[2];
    if (Math.abs(det) < 1e-12) return null;
    return new Float64Array([m[3]/det, -m[1]/det, -m[2]/det, m[0]/det]);
}

export function invert3x3(m: Float64Array | number[]): Float64Array | null {
    const det = m[0] * (m[4]*m[8] - m[5]*m[7]) - m[1] * (m[3]*m[8] - m[5]*m[6]) + m[2] * (m[3]*m[7] - m[4]*m[6]);
    if (Math.abs(det) < 1e-12) return null;
    const inv = new Float64Array(9);
    inv[0] = (m[4]*m[8] - m[5]*m[7]) / det;
    inv[1] = (m[2]*m[7] - m[1]*m[8]) / det;
    inv[2] = (m[1]*m[5] - m[2]*m[4]) / det;
    inv[3] = (m[5]*m[6] - m[3]*m[8]) / det;
    inv[4] = (m[0]*m[8] - m[2]*m[6]) / det;
    inv[5] = (m[2]*m[3] - m[0]*m[5]) / det;
    inv[6] = (m[3]*m[7] - m[4]*m[6]) / det;
    inv[7] = (m[1]*m[6] - m[0]*m[7]) / det;
    inv[8] = (m[0]*m[4] - m[1]*m[3]) / det;
    return inv;
}

export function fastMatmulPtr(a: Float64Array | number[], b: Float64Array | number[], out: Float64Array, size: number): void {
    out.fill(0);
    for (let i = 0; i < size; i++) {
        for (let k = 0; k < size; k++) {
            const aik = a[i * size + k];
            for (let j = 0; j < size; j++) {
                out[i * size + j] += aik * b[k * size + j];
            }
        }
    }
}
