// Benchmark Worker - Uses dynamic import from public folder for VitePress compatibility
// The WASM module is served from /sci-math-wasm/wasm/

let wasmMemory: WebAssembly.Memory;
let SciEngine: any;
let TextStreamer: any;
let sniffFormat: any;
let decimate: any;
let resample_linear: any;
let genetic_algorithm: any;
let butterworthLowpass: any;

// === JS IMPLEMENTATIONS FOR COMPARISON ===
const jsNBodySoaF32 = (
    px: Float32Array, py: Float32Array, pz: Float32Array,
    vx: Float32Array, vy: Float32Array, vz: Float32Array,
    dt: number, iters: number
) => {
  const n = px.length;
  for (let iter = 0; iter < iters; iter++) {
    for (let i = 0; i < n; i++) {
        let fx = 0, fy = 0, fz = 0;
        const pxi = px[i], pyi = py[i], pzi = pz[i];
        for (let j = 0; j < n; j++) {
            const dx = px[j] - pxi, dy = py[j] - pyi, dz = pz[j] - pzi;
            const distSq = dx*dx + dy*dy + dz*dz + 1e-5;
            const invDist = 1.0 / Math.sqrt(distSq);
            const invDist3 = invDist * invDist * invDist;
            fx += dx * invDist3; fy += dy * invDist3; fz += dz * invDist3;
        }
        vx[i] += fx * dt; vy[i] += fy * dt; vz[i] += fz * dt;
    }
  }
};

const jsMatMulBlocked = (a: Float64Array, b: Float64Array, out: Float64Array, size: number) => {
  out.fill(0);
  const bsize = 64;
  for (let i0 = 0; i0 < size; i0 += bsize) {
    const imax = Math.min(i0 + bsize, size);
    for (let k0 = 0; k0 < size; k0 += bsize) {
      const kmax = Math.min(k0 + bsize, size);
      for (let j0 = 0; j0 < size; j0 += bsize) {
        const jmax = Math.min(j0 + bsize, size);
        for (let i = i0; i < imax; i++) {
          const i_off = i * size;
          for (let k = k0; k < kmax; k++) {
            const aik = a[i_off + k], b_off = k * size;
            for (let j = j0; j < jmax; j++) out[i_off + j] += aik * b[b_off + j];
          }
        }
      }
    }
  }
};

const jsFFT = (re: Float64Array, im: Float64Array) => {
  const n = re.length;
  let j = 0;
  for (let i = 0; i < n - 1; i++) {
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
    let k = n >> 1;
    while (k <= j) { j -= k; k >>= 1; }
    j += k;
  }
  let step = 1;
  while (step < n) {
    const jump = step << 1, delta = Math.PI / step;
    let wr = 1.0, wi = 0.0;
    const alpha = 2.0 * Math.pow(Math.sin(0.5 * delta), 2), beta = Math.sin(delta);
    for (let i = 0; i < step; i++) {
      for (let j = i; j < n; j += jump) {
        const k = j + step, tr = wr * re[k] - wi * im[k], ti = wr * im[k] + wi * re[k];
        re[k] = re[j] - tr; im[k] = im[j] - ti; re[j] += tr; im[j] += ti;
      }
      const tr_w = wr - (alpha * wr + beta * wi), ti_w = wi - (alpha * wi - beta * wr);
      wr = tr_w; wi = ti_w;
    }
    step = jump;
  }
};

const jsDiff5Point = (data: Float64Array, h: number, out: Float64Array) => {
    const n = data.length, inv12h = 1.0 / (12.0 * h);
    out[0] = (data[1] - data[0]) / h; out[1] = (data[2] - data[1]) / h;
    out[n-2] = (data[n-1] - data[n-2]) / h; out[n-1] = out[n-2];
    for(let i=2; i<n-2; i++) out[i] = inv12h * (-data[i+2] + 8.0*data[i+1] - 8.0*data[i-1] + data[i-2]);
};

const jsIntegrateSimpson = (data: Float64Array, h: number) => {
    const n = data.length;
    let sum = data[0] + data[n-1];
    const limit = (n % 2 === 1) ? n - 1 : n - 2;
    for(let i=1; i<limit; i+=2) sum += 4.0 * data[i];
    for(let i=2; i<limit; i+=2) sum += 2.0 * data[i];
    let res = sum * (h / 3.0);
    if (n % 2 === 0) res += (data[n-2]+data[n-1])*(h/2.0);
    return res;
};

const jsPeakDetection = (data: Float64Array, threshold: number) => {
    const peaks: number[] = [];
    for (let i = 1; i < data.length - 1; i++) {
        if (data[i] > threshold && data[i] > data[i - 1] && data[i] > data[i + 1]) peaks.push(i);
    }
    return peaks;
};

const jsSmoothSG = (data: Float64Array, window: number, out: Float64Array) => {
    const n = data.length;
    let kernel: number[], norm: number;
    if (window === 5) { kernel = [-3, 12, 17, 12, -3]; norm = 35; }
    else if (window === 7) { kernel = [-2, 3, 6, 7, 6, 3, -2]; norm = 21; }
    else return;
    const half = Math.floor(window / 2), invNorm = 1.0 / norm;
    for (let i = half; i < n - half; i++) {
        let sum = 0;
        for (let j = 0; j < window; j++) sum += data[i + j - half] * kernel[j];
        out[i] = sum * invNorm;
    }
};

const jsSolveLinear = (a: Float64Array, b: Float64Array, n: number) => {
    for (let i = 0; i < n; i++) {
        const pivot = a[i * n + i];
        for (let k = i + 1; k < n; k++) {
            const factor = a[k * n + i] / pivot;
            for (let j = i; j < n; j++) a[k * n + j] -= factor * a[i * n + j];
            b[k] -= factor * b[i];
        }
    }
    const x = new Float64Array(n);
    for (let i = n - 1; i >= 0; i--) {
        let sum = 0;
        for (let j = i + 1; j < n; j++) sum += a[i * n + j] * x[j];
        x[i] = (b[i] - sum) / a[i * n + i];
    }
    return x;
};

const jsFitPoly = (x: Float64Array, y: Float64Array, order: number) => {
    const n = order + 1, matrix = new Float64Array(n * n), vector = new Float64Array(n);
    const powers = new Float64Array(2 * order + 1);
    for (let i = 0; i < x.length; i++) {
        let px = 1;
        for (let j = 0; j <= 2 * order; j++) {
            powers[j] += px;
            if (j <= order) vector[j] += px * y[i];
            px *= x[i];
        }
    }
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) matrix[i * n + j] = powers[i + j];
    return jsSolveLinear(matrix, vector, n);
};

const jsRemoveBaseline = (data: Float64Array, x: Float64Array, order: number, out: Float64Array) => {
    const coeffs = jsFitPoly(x, data, order);
    for (let i = 0; i < data.length; i++) {
        let b = 0, p = 1;
        for (let j = 0; j < coeffs.length; j++) { b += coeffs[j] * p; p *= x[i]; }
        out[i] = data[i] - b;
    }
};

const jsParseCSV = (text: string): Float64Array => {
    const lines = text.trim().split('\n');
    const result = new Float64Array(lines.length * 5);
    let idx = 0;
    for (const line of lines) {
        for (const part of line.split(',')) result[idx++] = parseFloat(part);
    }
    return result;
};

const jsParseTSV = (text: string): Float64Array => {
    const lines = text.trim().split('\n');
    const result = new Float64Array(lines.length * 5);
    let idx = 0;
    for (const line of lines) {
        for (const part of line.split('\t')) result[idx++] = parseFloat(part);
    }
    return result;
};

const jsParseMPT = (text: string): Float64Array => {
    const lines = text.trim().split('\n');
    const result = new Float64Array((lines.length - 61) * 3);
    let idx = 0;
    for (let i = 61; i < lines.length; i++) {
        for (const part of lines[i].split('\t')) result[idx++] = parseFloat(part);
    }
    return result;
};

const jsSniffFormat = (header: Uint8Array) => {
    const text = new TextDecoder().decode(header);
    const commaCount = (text.match(/,/g) || []).length;
    const tabCount = (text.match(/\t/g) || []).length;
    return tabCount > commaCount 
        ? { format: 'tsv', delimiter: 9, skipLines: 0 }
        : { format: 'csv', delimiter: 44, skipLines: 0 };
};

const jsButterworthLP = (data: Float64Array, out: Float64Array, cutoff: number, fs: number) => {
    const n = data.length, ff = cutoff / fs;
    const ita = Math.tan(Math.PI * ff), q = Math.SQRT2;
    const b0 = (ita ** 2) / (1.0 + q * ita + (ita ** 2));
    const b1 = 2.0 * b0, b2 = b0;
    const a1 = 2.0 * ((ita ** 2) - 1.0) / (1.0 + q * ita + (ita ** 2));
    const a2 = (1.0 - q * ita + (ita ** 2)) / (1.0 + q * ita + (ita ** 2));
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < n; i++) {
        const x0 = data[i], y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
        out[i] = y0; x2 = x1; x1 = x0; y2 = y1; y1 = y0;
    }
};

const jsMode = (data: Float64Array) => {
    const counts = new Map<number, number>();
    for (const v of data) counts.set(v, (counts.get(v) || 0) + 1);
    let mode = 0, max = 0;
    for (const [k, v] of counts) if (v > max) { max = v; mode = k; }
    return mode;
};

const jsSkew = (data: Float64Array) => {
    const n = data.length; if (n < 3) return 0;
    const mean = data.reduce((a, b) => a + b, 0) / n;
    let sum2 = 0, sum3 = 0;
    for (const v of data) { const d = v - mean; sum2 += d * d; sum3 += d * d * d; }
    const sd = Math.sqrt(sum2 / (n - 1));
    return (n * sum3) / ((n - 1) * (n - 2) * sd * sd * sd);
};

const jsKurt = (data: Float64Array) => {
    const n = data.length; if (n < 4) return 0;
    const mean = data.reduce((a, b) => a + b, 0) / n;
    let sum2 = 0, sum4 = 0;
    for (const v of data) { const d = v - mean; sum2 += d * d; sum4 += d * d * d * d; }
    const var_ = sum2 / (n - 1);
    return (n * (n + 1) * sum4) / ((n - 1) * (n - 2) * (n - 3) * var_ * var_) 
         - (3 * (n - 1) * (n - 1)) / ((n - 2) * (n - 3));
};

const jsTrace = (matrix: Float64Array, n: number) => {
    let tr = 0;
    for (let i = 0; i < n; i++) tr += matrix[i * n + i];
    return tr;
};

const jsDet = (matrix: Float64Array, n: number): number => {
    // LU Decomposition O(n^3) - Fair comparison with WASM
    const a = Array.from({ length: n }, (_, i) => 
        Array.from({ length: n }, (_, j) => matrix[i * n + j])
    );
    let l = Array.from({ length: n }, () => Array(n).fill(0));
    let u = Array.from({ length: n }, () => Array(n).fill(0));
    let det = 1;

    for (let i = 0; i < n; i++) {
        for (let k = i; k < n; k++) {
            let sum = 0;
            for (let j = 0; j < i; j++) sum += (l[i][j] * u[j][k]);
            u[i][k] = a[i][k] - sum;
        }
        for (let k = i; k < n; k++) {
            if (i === k) l[i][i] = 1;
            else {
                let sum = 0;
                for (let j = 0; j < i; j++) sum += (l[k][j] * u[j][i]);
                l[k][i] = (a[k][i] - sum) / u[i][i];
            }
        }
    }
    for (let i = 0; i < n; i++) det *= u[i][i];
    return det;
};

const jsDecimate = (data: Float64Array, factor: number) => {
    const res: number[] = [];
    for (let i = 0; i < data.length; i += factor) res.push(data[i]);
    return new Float64Array(res);
};

const jsResample = (data: Float64Array, newLen: number) => {
    const res = new Float64Array(newLen), factor = (data.length - 1) / (newLen - 1);
    for (let i = 0; i < newLen; i++) {
        const pos = i * factor, idx = Math.floor(pos), frac = pos - idx;
        res[i] = idx >= data.length - 1 ? data[data.length - 1] : data[idx] * (1 - frac) + data[idx + 1] * frac;
    }
    return res;
};

const jsGA = (f: (x: number[]) => number, bounds: Float64Array, popSize: number, gens: number, mutRate: number) => {
    const dim = bounds.length / 2;
    let pop: number[][] = [];
    for (let i = 0; i < popSize; i++) {
        const ind = [];
        for (let j = 0; j < dim; j++) ind.push(bounds[j*2] + Math.random() * (bounds[j*2+1] - bounds[j*2]));
        pop.push(ind);
    }
    let bestSol = pop[0], bestScore = f(bestSol);
    for (let g = 0; g < gens; g++) {
        const scores = pop.map(ind => { const s = f(ind); if (s < bestScore) { bestScore = s; bestSol = [...ind]; } return s; });
        const nextGen: number[][] = [bestSol];
        for (let i = 1; i < popSize; i++) {
            const i1 = Math.floor(Math.random() * popSize), i2 = Math.floor(Math.random() * popSize);
            nextGen.push([...(scores[i1] < scores[i2] ? pop[i1] : pop[i2])]);
        }
        for (let i = 1; i < popSize - 1; i += 2) {
            if (Math.random() < 0.7) {
                const pt = Math.floor(Math.random() * dim);
                for (let j = pt; j < dim; j++) [nextGen[i][j], nextGen[i+1][j]] = [nextGen[i+1][j], nextGen[i][j]];
            }
        }
        for (let i = 1; i < popSize; i++) {
            if (Math.random() < mutRate) {
                const idx = Math.floor(Math.random() * dim);
                nextGen[i][idx] = bounds[idx*2] + Math.random() * (bounds[idx*2+1] - bounds[idx*2]);
            }
        }
        pop = nextGen;
    }
    return bestSol;
};

const jsDeconvRL = (data: Float64Array, kernel: Float64Array, iterations: number) => {
    const n = data.length, kn = kernel.length;
    let current = new Float64Array(n).fill(1.0);
    const kernelFlipped = new Float64Array(kernel).reverse();
    for (let iter = 0; iter < iterations; iter++) {
        const estimation = new Float64Array(n);
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < kn; j++) {
                const kIdx = i + j - Math.floor(kn / 2);
                if (kIdx >= 0 && kIdx < n) estimation[i] += current[kIdx] * kernel[j];
            }
        }
        const rel = new Float64Array(n);
        for (let i = 0; i < n; i++) if (estimation[i] > 1e-12) rel[i] = data[i] / estimation[i];
        const next = new Float64Array(n);
        for (let i = 0; i < n; i++) {
            let corr = 0.0;
            for (let j = 0; j < kn; j++) {
                const kIdx = i + j - Math.floor(kn / 2);
                if (kIdx >= 0 && kIdx < n) corr += rel[kIdx] * kernelFlipped[j];
            }
            next[i] = current[i] * corr;
        }
        current = next;
    }
    return current;
};

// === BENCHMARK RUNNER ===
const runBench = async (fn: () => void, iterations: number) => {
    for(let i=0; i<3; i++) fn(); // Warmup
    const start = performance.now();
    for(let i=0; i<iterations; i++) fn();
    return (performance.now() - start) / iterations;
};

self.onmessage = async (e) => {
    if (e.data.type === 'start') {
        try {
            self.postMessage({ type: 'log', message: 'CRITICAL: Activating Engine V15...' });
            
            // Import from pkg/web using relative path (Vite can resolve this)
            // The vitepress config has server.fs.allow: ['..'] which allows access
            self.postMessage({ type: 'log', message: 'Step 1: Importing WASM module...' });
            const wasmModule = await import('../../../../pkg/web/sci_math_wasm.js');
            
            self.postMessage({ type: 'log', message: 'Step 2: Initializing WASM...' });
            const wasm = await wasmModule.default();
            wasmMemory = wasm.memory;
            
            // Extract needed exports
            SciEngine = wasmModule.SciEngine;
            TextStreamer = wasmModule.TextStreamer;
            sniffFormat = wasmModule.sniffFormat;
            decimate = wasmModule.decimate;
            resample_linear = wasmModule.resample_linear;
            genetic_algorithm = wasmModule.genetic_algorithm;
            butterworthLowpass = wasmModule.butterworthLowpass;
            
            self.postMessage({ type: 'log', message: 'Step 3: WASM initialized, SciEngine available' });
            
            // Try to init thread pool if available
            if (typeof SharedArrayBuffer !== 'undefined' && (self as any).crossOriginIsolated) {
                const nThreads = navigator.hardwareConcurrency || 4;
                self.postMessage({ type: 'log', message: `Initializing ${nThreads} CPU threads...` });
                try {
                    if (wasmModule.initThreadPool) await wasmModule.initThreadPool(nThreads);
                } catch (e) {
                    self.postMessage({ type: 'log', message: 'Thread pool init failed, using single-threaded mode' });
                }
            } else {
                self.postMessage({ type: 'log', message: 'WARNING: Cross-Origin Isolation NOT detected. Single-threaded mode.' });
            }
            
            self.postMessage({ type: 'log', message: 'Step 4: Creating SciEngine instance...' });
            const engine = new SciEngine();
            self.postMessage({ type: 'log', message: 'Step 5: SciEngine created. Running benchmarks...' });

            // CSV/TSV generation helpers
            const generateCSVData = (rows: number, cols: number): string => {
                let csv = Array.from({ length: cols }, (_, i) => `Col${i}`).join(',') + '\n';
                for (let i = 0; i < rows; i++) {
                    csv += Array.from({ length: cols }, () => (Math.random() * 1000).toFixed(6)).join(',') + '\n';
                }
                return csv;
            };

            const generateMPTData = (rows: number): string => {
                let content = '';
                for (let i = 0; i < 60; i++) content += `# Metadata line ${i + 1}\n`;
                content += 'Time/s\tEwe/V\tI/mA\tCycle\tIndex\n';
                for (let i = 0; i < rows; i++) {
                    content += `${(i * 0.1).toFixed(6)}\t${(2.5 + Math.sin(i * 0.01) * 0.5).toFixed(6)}\t${(Math.random() * 10 - 5).toFixed(6)}\t1\t${i}\n`;
                }
                return content;
            };

            // Define benchmarks array
            const benchmarks = [
                {
                    id: 'io_csv_small',
                    name: 'CSV Parsing (10K rows × 5 cols)',
                    iterations: 10,
                    setup: () => {
                        const csvText = generateCSVData(10000, 5);
                        const csvBytes = new TextEncoder().encode(csvText);
                        const streamer = new TextStreamer().setDelimiter(44).setSkipLines(1);
                        return {
                            wasm: () => streamer.processNumericChunk(csvBytes),
                            js: () => jsParseCSV(csvText)
                        };
                    }
                },
                {
                    id: 'fft',
                    name: 'FFT (65536 Points - Radix-2)',
                    iterations: 10,
                    setup: () => {
                        const s = 65536;
                        const hRe = engine.create_vector(s);
                        const hIm = engine.create_vector(s);
                        const wasmRe = new Float64Array(wasmMemory.buffer, engine.get_ptr(hRe), s);
                        const wasmIm = new Float64Array(wasmMemory.buffer, engine.get_ptr(hIm), s);
                        const jsRe = new Float64Array(s), jsIm = new Float64Array(s);
                        for(let i=0; i<s; i++) {
                            const v = Math.sin(i * 0.1);
                            wasmRe[i] = v; jsRe[i] = v; wasmIm[i] = 0; jsIm[i] = 0;
                        }
                        return {
                            wasm: () => engine.fft(hRe, hIm, false),
                            js: () => jsFFT(jsRe, jsIm)
                        };
                    }
                },
                {
                    id: 'matmul',
                    name: 'Matrix Multiplication (512x512)',
                    iterations: 5,
                    setup: () => {
                        const s = 512;
                        const hA = engine.create_vector(s*s);
                        const hB = engine.create_vector(s*s);
                        const hOut = engine.create_vector(s*s);
                        const jsA = Float64Array.from({ length: s*s }, () => Math.random());
                        const jsB = Float64Array.from({ length: s*s }, () => Math.random());
                        const jsOut = new Float64Array(s*s);
                        new Float64Array(wasmMemory.buffer, engine.get_ptr(hA), s*s).set(jsA);
                        new Float64Array(wasmMemory.buffer, engine.get_ptr(hB), s*s).set(jsB);
                        return {
                            wasm: () => engine.matmul_unrolled(hA, hB, hOut, s),
                            js: () => jsMatMulBlocked(jsA, jsB, jsOut, s)
                        };
                    }
                },
                {
                    id: 'calculus',
                    name: 'Calculus (Diff+Integ 1M pts)',
                    iterations: 10,
                    setup: () => {
                        const s = 1000000;
                        const hIn = engine.create_vector(s);
                        const hOut = engine.create_vector(s);
                        const viewIn = new Float64Array(wasmMemory.buffer, engine.get_ptr(hIn), s);
                        const jsIn = new Float64Array(s), jsOut = new Float64Array(s);
                        for(let i=0; i<s; i++) { const v = Math.sin(i * 0.01); viewIn[i] = v; jsIn[i] = v; }
                        return {
                            wasm: () => { engine.diff(hIn, hOut, 0.01); engine.integrate(hOut, 0.01); },
                            js: () => { jsDiff5Point(jsIn, 0.01, jsOut); jsIntegrateSimpson(jsOut, 0.01); }
                        };
                    }
                },
                {
                    id: 'stats_adv',
                    name: 'Advanced Stats (Mode/Skew/Kurt - 1M pts)',
                    iterations: 10,
                    setup: () => {
                        const s = 1000000;
                        const hIn = engine.create_vector(s);
                        const jsIn = new Float64Array(s);
                        const viewIn = new Float64Array(wasmMemory.buffer, engine.get_ptr(hIn), s);
                        for(let i=0; i<s; i++) { const v = Math.floor(Math.random() * 100); viewIn[i] = v; jsIn[i] = v; }
                        return {
                            wasm: () => { engine.mode(hIn); engine.skewness(hIn); engine.kurtosis(hIn); },
                            js: () => { jsMode(jsIn); jsSkew(jsIn); jsKurt(jsIn); }
                        };
                    }
                },
                {
                    id: 'linalg_trace',
                    name: 'Matrix Trace (1024x1024)',
                    iterations: 20,
                    setup: () => {
                        const n = 1024, s = n * n;
                        const hIn = engine.create_vector(s);
                        const jsIn = Float64Array.from({ length: s }, () => Math.random());
                        new Float64Array(wasmMemory.buffer, engine.get_ptr(hIn), s).set(jsIn);
                        return { 
                          wasm: () => engine.trace(hIn, n), 
                          js: () => jsTrace(jsIn, n) 
                        };
                    }
                },
                {
                    id: 'io_csv_numeric_large',
                    name: 'CSV Parsing (100K rows × 8 cols)',
                    iterations: 5,
                    setup: () => {
                        const csvText = generateCSVData(100000, 8);
                        const csvBytes = new TextEncoder().encode(csvText);
                        const streamer = new TextStreamer().setDelimiter(44).setSkipLines(1);
                        return {
                            wasm: () => streamer.processNumericChunk(csvBytes),
                            js: () => jsParseCSV(csvText)
                        };
                    }
                },
                {
                    id: 'io_csv_columnar',
                    name: 'CSV Columnar (100K rows × 8 cols)',
                    iterations: 5,
                    setup: () => {
                        const csvText = generateCSVData(100000, 8);
                        const csvBytes = new TextEncoder().encode(csvText);
                        const streamer = new TextStreamer().setDelimiter(44).setSkipLines(1);
                        return {
                            wasm: () => streamer.processColumnarChunk(csvBytes),
                            js: () => jsParseCSV(csvText)
                        };
                    }
                },
                {
                    id: 'io_mpt',
                    name: 'MPT File Processing (50K rows)',
                    iterations: 5,
                    setup: () => {
                        const mptText = generateMPTData(50000);
                        const mptBytes = new TextEncoder().encode(mptText);
                        const streamer = new TextStreamer().setDelimiter(9).setSkipLines(61);
                        return {
                            wasm: () => streamer.processColumnarChunk(mptBytes),
                            js: () => jsParseMPT(mptText)
                        };
                    }
                },
                {
                    id: 'io_format_detection',
                    name: 'Format Detection (CSV vs TSV)',
                    iterations: 100,
                    setup: () => {
                        const csvHeader = new TextEncoder().encode('a,b,c\n1,2,3\n4,5,6');
                        const tsvHeader = new TextEncoder().encode('a\tb\tc\n1\t2\t3\n4\t5\t6');
                        return {
                            wasm: () => { sniffFormat(csvHeader); sniffFormat(tsvHeader); },
                            js: () => { jsSniffFormat(csvHeader); jsSniffFormat(tsvHeader); }
                        };
                    }
                },
                {
                    id: 'deconvolution',
                    name: 'Deconvolution (100k pts, 10 iters)',
                    iterations: 3,
                    setup: () => {
                        const s = 100000;
                        const hIn = engine.create_vector(s);
                        const hKernel = engine.create_vector(7);
                        const hOut = engine.create_vector(s);
                        
                        const kernel = new Float64Array([0.05, 0.1, 0.15, 0.4, 0.15, 0.1, 0.05]);
                        const jsIn = Float64Array.from({ length: s }, (_, i) => Math.sin(i * 0.01) + Math.random() * 0.1);
                        
                        new Float64Array(wasmMemory.buffer, engine.get_ptr(hIn), s).set(jsIn);
                        new Float64Array(wasmMemory.buffer, engine.get_ptr(hKernel), 7).set(kernel);

                        return {
                            wasm: () => engine.deconvolve_rl(hIn, hKernel, 10, hOut),
                            js: () => jsDeconvRL(jsIn, kernel, 10)
                        };
                    }
                },
                {
                    id: 'filters',
                    name: 'Butterworth Filter (1M pts)',
                    iterations: 10,
                    setup: () => {
                        const s = 1000000;
                        const hIn = engine.create_vector(s);
                        const hOut = engine.create_vector(s);
                        const jsIn = Float64Array.from({ length: s }, (_, i) => Math.sin(i * 0.01) + Math.random() * 0.1);
                        const jsOut = new Float64Array(s);
                        
                        new Float64Array(wasmMemory.buffer, engine.get_ptr(hIn), s).set(jsIn);

                        return {
                            wasm: () => engine.butterworth_lp(hIn, hOut, 0.1, 1.0),
                            js: () => jsButterworthLP(jsIn, jsOut, 0.1, 1.0)
                        };
                    }
                },
                {
                    id: 'analysis_fitting',
                    name: 'Analysis & Fitting (1M pts)',
                    iterations: 5,
                    setup: () => {
                        const s = 1000000;
                        const hIn = engine.create_vector(s);
                        const hOut = engine.create_vector(s);
                        const hX = engine.create_vector(s);
                        const viewIn = new Float64Array(wasmMemory.buffer, engine.get_ptr(hIn), s);
                        const viewX = new Float64Array(wasmMemory.buffer, engine.get_ptr(hX), s);
                        const jsIn = new Float64Array(s), jsX = new Float64Array(s), jsOut = new Float64Array(s);
                        for(let i=0; i<s; i++) {
                            const x = i * 0.1, v = Math.sin(x) + Math.random() * 0.1;
                            viewIn[i] = v; jsIn[i] = v; viewX[i] = x; jsX[i] = x;
                        }
                        return {
                            wasm: () => {
                                engine.smooth_sg(hIn, hOut, 5, 2);
                                engine.remove_baseline(hIn, hX, 3, hOut, 0);
                                engine.detect_peaks(hOut, 0.1, 0.0);
                            },
                            js: () => {
                                jsSmoothSG(jsIn, 5, jsOut);
                                jsRemoveBaseline(jsIn, jsX, 3, jsOut);
                                jsPeakDetection(jsOut, 0.5);
                            }
                        };
                    }
                },
                {
                    id: 'linalg_det',
                    name: 'Matrix Determinant (32x32)',
                    iterations: 100,
                    setup: () => {
                        const n = 32, s = n * n;
                        const hIn = engine.create_vector(s);
                        const jsIn = Float64Array.from({ length: s }, () => Math.random());
                        new Float64Array(wasmMemory.buffer, engine.get_ptr(hIn), s).set(jsIn);
                        return { 
                          wasm: () => engine.det_lu(hIn, n),
                           js: () => jsDet(jsIn, n)
                          };
                    }
                },
                {
                    id: 'signal_adv',
                    name: 'Signal Resample/Decimate (100K)',
                    iterations: 5,
                    setup: () => {
                        const s = 100000;
                        const hIn = engine.create_vector(s);
                        const hOut = engine.create_vector(s);
                        const jsIn = Float64Array.from({ length: s }, (_, i) => Math.sin(i * 0.01));
                        new Float64Array(wasmMemory.buffer, engine.get_ptr(hIn), s).set(jsIn);

                        return {
                            wasm: () => { 
                                engine.decimate(hIn, 2, hOut); 
                                engine.resample_linear(hOut, s / 2, hIn); 
                            },
                            js: () => { jsDecimate(jsIn, 2); jsResample(jsIn, s / 2); }
                        };
                    }
                },
                {
                    id: 'optimization_ga',
                    name: 'Genetic Algorithm (Sphere, 100 iter)',
                    iterations: 1,
                    setup: () => {
                        const bounds = new Float64Array([-100, 100, -100, 100]);
                        const f = (vals: number[]) => vals[0]*vals[0] + vals[1]*vals[1];
                        return {
                            wasm: () => engine.genetic_algorithm(f, bounds, 50, 100, 0.05),
                            js: () => jsGA(f, bounds, 50, 100, 0.05)
                        };
                    }
                }
            ];

            // Run benchmarks
            for (const b of benchmarks) {
                try {
                    self.postMessage({ type: 'log', message: `Benchmarking: ${b.name}` });
                    const { js, wasm: wasmFn } = b.setup();
                    self.postMessage({ type: 'status', id: b.id, status: 'running' });
                    
                    const jsTime = await runBench(js, b.iterations);
                    const wasmTime = await runBench(wasmFn, b.iterations);
                    
                    self.postMessage({ 
                        type: 'result', id: b.id, 
                        js: jsTime, wasm: wasmTime, 
                        ratio: jsTime / wasmTime 
                    });
                    self.postMessage({ type: 'log', message: `>> SPEEDUP: ${(jsTime/wasmTime).toFixed(2)}x` });
                } catch (err: any) {
                    self.postMessage({ type: 'error', message: `Benchmark ${b.id} failed: ${err.message || err}` });
                    self.postMessage({ type: 'log', message: `ERROR in ${b.name}: ${err.message || err}` });
                }
            }

            self.postMessage({ type: 'done' });
            self.postMessage({ type: 'log', message: 'All benchmarks completed. Engine V15 Active.' });

        } catch (err: any) {
            self.postMessage({ type: 'error', message: err.toString() });
            self.postMessage({ type: 'log', message: `FATAL ERROR: ${err.stack || err}` });
        }
    }
};
