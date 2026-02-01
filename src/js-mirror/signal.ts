export function fftRadix2(re: Float64Array, im: Float64Array, inverse = false): void {
    const n = re.length;
    let j = 0;
    for (let i = 0; i < n - 1; i++) {
        if (i < j) {
            [re[i], re[j]] = [re[j], re[i]];
            [im[i], im[j]] = [im[j], im[i]];
        }
        let k = n >> 1;
        while (k <= j) { j -= k; k >>= 1; }
        j += k;
    }

    const sign = inverse ? -1 : 1;
    for (let step = 1; step < n; step <<= 1) {
        const jump = step << 1;
        const angle = sign * Math.PI / step;
        const wpr = Math.cos(angle);
        const wpi = Math.sin(angle);
        for (let group = 0; group < n; group += jump) {
            let wr = 1, wi = 0;
            for (let i = 0; i < step; i++) {
                const idxJ = group + i;
                const idxK = idxJ + step;
                const tr = wr * re[idxK] - wi * im[idxK];
                const ti = wr * im[idxK] + wi * re[idxK];
                re[idxK] = re[idxJ] - tr;
                im[idxK] = im[idxJ] - ti;
                re[idxJ] += tr;
                im[idxJ] += ti;
                const tmp = wr;
                wr = wr * wpr - wi * wpi;
                wi = tmp * wpi + wi * wpr;
            }
        }
    }
    if (inverse) {
        for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
    }
}

export function rfftRadix2(data: Float64Array | number[], reOut: Float64Array, imOut: Float64Array): void {
    const n = data.length;
    const halfN = n / 2;
    for (let i = 0; i < halfN; i++) {
        reOut[i] = data[2 * i];
        imOut[i] = data[2 * i + 1];
    }
    fftRadix2(reOut.subarray(0, halfN), imOut.subarray(0, halfN), false);
}

export function fft(input: Float64Array | number[]): Float64Array {
    const n = input.length;
    const re = new Float64Array(input);
    const im = new Float64Array(n);
    fftRadix2(re, im, false);
    const out = new Float64Array(n * 2);
    for (let i = 0; i < n; i++) { out[2 * i] = re[i]; out[2 * i + 1] = im[i]; }
    return out;
}

export function magnitude(complexData: Float64Array | number[]): Float64Array {
    const n = complexData.length / 2;
    const out = new Float64Array(n);
    for (let i = 0; i < n; i++) {
        const re = complexData[2 * i];
        const im = complexData[2 * i + 1];
        out[i] = Math.sqrt(re * re + im * im);
    }
    return out;
}

export function movingAverage(data: Float64Array | number[], window: number): Float64Array {
    const n = data.length;
    const out = new Float64Array(n);
    const half = Math.floor(window / 2);
    let sum = 0, count = 0;
    for (let i = 0; i < n; i++) {
        if (i === 0) {
            for (let j = 0; j <= Math.min(half, n - 1); j++) { sum += data[j]; count++; }
        } else {
            const ce = i + half, cs = i - half;
            if (ce < n) { sum += data[ce]; count++; }
            if (cs > 0) { sum -= data[cs - 1]; count--; }
        }
        out[i] = sum / count;
    }
    return out;
}

export function findPeaks(data: Float64Array | number[], threshold: number): number[] {
    const peaks: number[] = [];
    for (let i = 1; i < data.length - 1; i++) {
        if (data[i] > data[i - 1] && data[i] > data[i + 1] && data[i] >= threshold) peaks.push(i);
    }
    return peaks;
}

export function deconvolveRL(data: Float64Array | number[], kernel: Float64Array | number[], iterations: number): Float64Array {
    const n = data.length, kn = kernel.length, kh = Math.floor(kn / 2);
    let current = new Float64Array(n).fill(1.0);
    const kFlipped = new Float64Array(kernel).reverse();
    for (let iter = 0; iter < iterations; iter++) {
        const est = new Float64Array(n);
        for (let i = 0; i < n; i++) {
            let s = 0;
            for (let j = 0; j < kn; j++) {
                const idx = i + j - kh;
                if (idx >= 0 && idx < n) s += current[idx] * kernel[j];
            }
            est[i] = s;
        }
        const rel = new Float64Array(n);
        for (let i = 0; i < n; i++) rel[i] = est[i] > 1e-12 ? data[i] / est[i] : 0;
        const next = new Float64Array(n);
        for (let i = 0; i < n; i++) {
            let c = 0;
            for (let j = 0; j < kn; j++) {
                const idx = i + j - kh;
                if (idx >= 0 && idx < n) c += rel[idx] * kFlipped[j];
            }
            next[i] = current[i] * c;
        }
        current = next;
    }
    return current;
}

export function butterworthLowpass(data: Float64Array | number[], cutoff: number, fs: number): Float64Array {
    const n = data.length, ff = cutoff / fs, ita = Math.tan(Math.PI * ff), q = Math.sqrt(2);
    const b0 = (ita * ita) / (1.0 + q * ita + (ita * ita));
    const b1 = 2.0 * b0, b2 = b0;
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
