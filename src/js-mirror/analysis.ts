import { fitPolynomial } from './fitting';

export function smoothSavitzkyGolay(data: Float64Array | number[], window: number): Float64Array {
    const n = data.length;
    if (n < window) return new Float64Array(data); // Or empty? Rust returns if n < window, essentially doing nothing to out buffer which is init to 0? No, Rust implementation copies edges and does inner. But if n < window it returns.
    // Rust: matches window constant 5, 7, 9, 11
    
    const out = new Float64Array(n);
    const half = Math.floor(window / 2);
    
    // Edges copy
    for (let i = 0; i < half; i++) {
        out[i] = data[i];
        out[n - 1 - i] = data[n - 1 - i];
    }
    
    for (let i = half; i < n - half; i++) {
        let sum = 0;
        let inv = 0;
        // Coefficients based on window size (simplistic implementation matching Rust's hardcoded values)
        if (window === 5) {
             inv = 35.0;
             sum = -3.0 * data[i-2] + 12.0 * data[i-1] + 17.0 * data[i] + 12.0 * data[i+1] - 3.0 * data[i+2];
        } else if (window === 7) {
             inv = 21.0;
             sum = -2.0 * data[i-3] + 3.0 * data[i-2] + 6.0 * data[i-1] + 7.0 * data[i] + 6.0 * data[i+1] + 3.0 * data[i+2] - 2.0 * data[i+3];
        } else if (window === 9) {
             inv = 231.0;
             sum = -21.0 * data[i-4] + 14.0 * data[i-3] + 39.0 * data[i-2] + 54.0 * data[i-1] + 59.0 * data[i] + 54.0 * data[i+1] + 39.0 * data[i+2] + 14.0 * data[i+3] - 21.0 * data[i+4];
        } else if (window === 11) {
             inv = 429.0;
             sum = -36.0 * data[i-5] + 9.0 * data[i-4] + 44.0 * data[i-3] + 69.0 * data[i-2] + 84.0 * data[i-1] + 89.0 * data[i] + 84.0 * data[i+1] + 69.0 * data[i+2] + 44.0 * data[i+3] + 9.0 * data[i+4] - 36.0 * data[i+5];
        } else {
            // Fallback or identity
            out[i] = data[i];
            continue;
        }
        out[i] = sum / inv;
    }
    return out;
}

export function findPeaks(data: Float64Array | number[], threshold: number): Uint32Array {
    const peaks: number[] = [];
    for (let i = 1; i < data.length - 1; i++) {
        if (data[i] > data[i - 1] && data[i] > data[i + 1] && data[i] > threshold) {
            peaks.push(i);
        }
    }
    return new Uint32Array(peaks);
}

export function removeBaseline(data: Float64Array | number[], x: Float64Array | number[], order: number): Float64Array {
    const coeffs = fitPolynomial(x, data, order);
    const out = new Float64Array(data.length);
    if (!coeffs) {
        out.set(data);
        return out;
    }
    
    for (let i = 0; i < data.length; i++) {
        let b = 0;
        let p = 1;
        for (let j = 0; j < coeffs.length; j++) {
            b += coeffs[j] * p;
            p *= x[i];
        }
        out[i] = data[i] - b;
    }
    return out;
}

export function deconvolveRL(data: Float64Array | number[], kernel: Float64Array | number[], iterations: number): Float64Array {
    const n = data.length;
    const kn = kernel.length;
    const kh = Math.floor(kn / 2);
    let current = new Float64Array(n).fill(1.0);
    const kFlipped = new Float64Array(kernel).reverse();
    
    for (let iter = 0; iter < iterations; iter++) {
        const est = new Float64Array(n);
        // Convolution: current * kernel
        for (let i = 0; i < n; i++) {
            let sum = 0;
            const iStart = i >= kh ? 0 : kh - i;
            const iEnd = i + kh < n ? kn : n - i + kh;
             for (let j = iStart; j < iEnd; j++) {
                sum += current[i + j - kh] * kernel[j];
            }
            est[i] = sum;
        }
        
        const rel = new Float64Array(n);
        for (let i = 0; i < n; i++) {
            rel[i] = est[i] > 1e-12 ? data[i] / est[i] : 0;
        }
        
        const temp = new Float64Array(n);
        // Correlation: rel * kFlipped
        for (let i = 0; i < n; i++) {
            let corr = 0;
             const iStart = i >= kh ? 0 : kh - i;
            const iEnd = i + kh < n ? kn : n - i + kh;
            for (let j = iStart; j < iEnd; j++) {
                 corr += rel[i + j - kh] * kFlipped[j];
            }
            temp[i] = current[i] * corr;
        }
        current = temp;
    }
    return current;
}

export function butterworthLowpass(data: Float64Array | number[], cutoff: number, fs: number): Float64Array {
    const n = data.length;
    const ff = cutoff / fs;
    const ita = Math.tan(Math.PI * ff);
    const q = Math.sqrt(2);
    
    const b0 = (ita * ita) / (1.0 + q * ita + (ita * ita));
    const b1 = 2.0 * b0;
    const b2 = b0;
    const a1 = 2.0 * (ita * ita - 1.0) / (1.0 + q * ita + (ita * ita));
    const a2 = (1.0 - q * ita + (ita * ita)) / (1.0 + q * ita + (ita * ita));

    const out = new Float64Array(n);
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    
    for (let i = 0; i < n; i++) {
        const x0 = data[i];
        const y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
        out[i] = y0;
        x2 = x1; x1 = x0; y2 = y1; y1 = y0;
    }
    return out;
}

export function estimateSNR(data: Float64Array | number[]): number {
    const n = data.length;
    if (n < 2) return 0.0;
    
    // Mean
    let sum = 0;
    for(let i=0; i<n; i++) sum += data[i];
    const mean = sum / n;
    
    // Variance
    let ssTot = 0;
    for(let i=0; i<n; i++) ssTot += Math.pow(data[i] - mean, 2);
    const svar = ssTot / n;
    
    // Noise estimation via differences
    const diffs = new Float64Array(n - 1);
    for(let i=0; i<n-1; i++) diffs[i] = Math.abs(data[i+1] - data[i]);
    
    diffs.sort();
    const ns = diffs[Math.floor(diffs.length / 2)] / 0.6745;
    const nvar = ns * ns;
    
    if (nvar < 1e-18) return 100.0;
    return 10.0 * Math.log10(svar / nvar);
}
