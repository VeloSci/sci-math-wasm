import * as stats from './stats';
import * as linalg from './linalg';
import * as signal from './signal';
import * as fitting from './fitting';
import * as calculus from './calculus';

export class SciEngineJS {
    private vectors = new Map<number, Float64Array>();
    private vectorsF32 = new Map<number, Float32Array>();
    private nextId = 0;

    create_vector(size: number): number {
        const id = this.nextId++;
        this.vectors.set(id, new Float64Array(size));
        return id;
    }

    create_vector_f32(size: number): number {
        const id = this.nextId++;
        this.vectorsF32.set(id, new Float32Array(size));
        return id;
    }

    get_vector(id: number): Float64Array | undefined { return this.vectors.get(id); }
    get_vector_f32(id: number): Float32Array | undefined { return this.vectorsF32.get(id); }

    fft(reId: number, imId: number, inverse: boolean): void {
        const re = this.vectors.get(reId);
        const im = this.vectors.get(imId);
        if (re && im) signal.fftRadix2(re, im, inverse);
    }

    rfft(id: number, reId: number, imId: number): void {
        const data = this.vectors.get(id);
        const re = this.vectors.get(reId);
        const im = this.vectors.get(imId);
        if (data && re && im) signal.rfftRadix2(data, re, im);
    }

    diff(inId: number, outId: number, h: number): void {
        const input = this.vectors.get(inId);
        if (input) {
            const res = calculus.diff5Pt(input, h);
            this.vectors.get(outId)?.set(res);
        }
    }

    integrate(id: number, h: number): number {
        const data = this.vectors.get(id);
        return data ? calculus.integrateSimpson(data, h) : 0;
    }

    smooth_sg(id: number, outId: number, window: number): void {
        const input = this.vectors.get(id);
        if (input) {
            const res = calculus.smoothSG(input, window);
            this.vectors.get(outId)?.set(res);
        }
    }

    detect_peaks(id: number, threshold: number): number[] {
        const data = this.vectors.get(id);
        return data ? signal.findPeaks(data, threshold) : [];
    }

    fit_poly(xId: number, yId: number, order: number): Float64Array {
        const x = this.vectors.get(xId);
        const y = this.vectors.get(yId);
        return (x && y) ? fitting.fitPolynomial(x, y, order) || new Float64Array(order + 1) : new Float64Array(order + 1);
    }

    fit_gaussians(xId: number, yId: number, a: number, mu: number, sigma: number): number[] {
        const x = this.vectors.get(xId);
        const y = this.vectors.get(yId);
        return (x && y) ? fitting.fitGaussians(x, y, [a, mu, sigma]) : [0, 0, 0];
    }

    snr(id: number): number {
        const data = this.vectors.get(id);
        return data ? stats.estimateSNR(data) : 0;
    }

    transpose(id: number, rows: number, cols: number): number {
        const data = this.vectors.get(id);
        if (!data) return -1;
        const res = linalg.transpose(data, rows, cols);
        const rid = this.nextId++;
        this.vectors.set(rid, res);
        return rid;
    }

    deconvolve(id: number, kernelId: number, outId: number, iterations: number): void {
        const data = this.vectors.get(id);
        const kernel = this.vectors.get(kernelId);
        if (data && kernel) {
            const res = signal.deconvolveRL(data, kernel, iterations);
            this.vectors.get(outId)?.set(res);
        }
    }

    filter_butterworth(id: number, outId: number, cutoff: number, fs: number): void {
        const data = this.vectors.get(id);
        if (data) {
            const res = signal.butterworthLowpass(data, cutoff, fs);
            this.vectors.get(outId)?.set(res);
        }
    }

    matmul_unrolled(aId: number, bId: number, outId: number, size: number): void {
        const a = this.vectors.get(aId);
        const b = this.vectors.get(bId);
        const out = this.vectors.get(outId);
        if (a && b && out) linalg.fastMatmulPtr(a, b, out, size);
    }
}
