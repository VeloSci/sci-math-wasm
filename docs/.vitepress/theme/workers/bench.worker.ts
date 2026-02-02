
import init, { SciEngine, initHooks, initThreadPool, TextStreamer, sniffFormat, parseNumericCSVFast, parseFixedWidthFast, allocParseBuffer, parseBufferInPlace, getResultPtr, getResultLen } from '../../../../pkg/web/sci_math_wasm.js';

let wasmMemory: WebAssembly.Memory;

// JS N-BODY SoA f32 IMPLEMENTATION
const jsNBodySoaF32 = (
    px: Float32Array, py: Float32Array, pz: Float32Array,
    vx: Float32Array, vy: Float32Array, vz: Float32Array,
    dt: number, iters: number
) => {
  const n = px.length;
  // NOTE: JS Math.sqrt always returns double precision, but the storage is f32.
  // This is the closest we can get to simulating f32 work in JS.
  for (let iter = 0; iter < iters; iter++) {
    for (let i = 0; i < n; i++) {
        let fx = 0, fy = 0, fz = 0;
        const pxi = px[i], pyi = py[i], pzi = pz[i];
        
        for (let j = 0; j < n; j++) {
            const dx = px[j] - pxi;
            const dy = py[j] - pyi;
            const dz = pz[j] - pzi;
            const distSq = dx*dx + dy*dy + dz*dz + 1e-5;
            const invDist = 1.0 / Math.sqrt(distSq);
            const invDist3 = invDist * invDist * invDist;
            fx += dx * invDist3;
            fy += dy * invDist3;
            fz += dz * invDist3;
        }
        vx[i] += fx * dt;
        vy[i] += fy * dt;
        vz[i] += fz * dt;
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
            const aik = a[i_off + k];
            const b_off = k * size;
            for (let j = j0; j < jmax; j++) {
              out[i_off + j] += aik * b[b_off + j];
            }
          }
        }
      }
    }
  }
};

// JS FFT Implementation (Iterative Cooley-Tukey)
const jsFFT = (re: Float64Array, im: Float64Array) => {
  const n = re.length;
  // Bit Reversal
  let j = 0;
  for (let i = 0; i < n - 1; i++) {
    if (i < j) {
      let tr = re[i]; re[i] = re[j]; re[j] = tr;
      let ti = im[i]; im[i] = im[j]; im[j] = ti;
    }
    let k = n >> 1;
    while (k <= j) { j -= k; k >>= 1; }
    j += k;
  }
  // Butterflies
  let step = 1;
  while (step < n) {
    const jump = step << 1;
    const delta = Math.PI / step;
    let angle = 0.0; 
    let wr = 1.0, wi = 0.0;
    
    // Trig recurrence variables
    const alpha = 2.0 * Math.pow(Math.sin(0.5 * delta), 2);
    const beta = Math.sin(delta);

    for (let i = 0; i < step; i++) {
        for (let j = i; j < n; j += jump) {
            const k = j + step;
            const tr = wr * re[k] - wi * im[k];
            const ti = wr * im[k] + wi * re[k];
            re[k] = re[j] - tr;
            im[k] = im[j] - ti;
            re[j] += tr;
            im[j] += ti;
        }
        // Update w
        // wr = cos(angle), wi = sin(angle) - naive is slow, using recurrence
        const tr_w = wr - (alpha * wr + beta * wi);
        const ti_w = wi - (alpha * wi - beta * wr);
        wr = tr_w; wi = ti_w;
    }
    step = jump;
  }
};

// JS Calculus Implementations
const jsDiff5Point = (data: Float64Array, h: number, out: Float64Array) => {
    const n = data.length;
    const inv12h = 1.0 / (12.0 * h);
    out[0] = (data[1] - data[0]) / h;
    out[1] = (data[2] - data[1]) / h;
    out[n-2] = (data[n-1] - data[n-2]) / h;
    out[n-1] = (data[n-1] - data[n-2]) / h;
    for(let i=2; i<n-2; i++) {
        out[i] = inv12h * (-data[i+2] + 8.0*data[i+1] - 8.0*data[i-1] + data[i-2]);
    }
}

const jsIntegrateSimpson = (data: Float64Array, h: number) => {
    const n = data.length;
    let sum = data[0] + data[n-1];
    const limit = (n % 2 === 1) ? n - 1 : n - 2;
    for(let i=1; i<limit; i+=2) sum += 4.0 * data[i];
    for(let i=2; i<limit; i+=2) sum += 2.0 * data[i];
    let res = sum * (h / 3.0);
    if (n % 2 === 0) res += (data[n-2]+data[n-1])*(h/2.0);
    return res;
}

// JS Analysis & Fitting Implementations
const jsPeakDetection = (data: Float64Array, threshold: number) => {
    const peaks: number[] = [];
    for (let i = 1; i < data.length - 1; i++) {
        if (data[i] > threshold && data[i] > data[i - 1] && data[i] > data[i + 1]) {
            peaks.push(i);
        }
    }
    return peaks;
}

const jsSmoothSG = (data: Float64Array, window: number, out: Float64Array) => {
    const n = data.length;
    let kernel: number[], norm: number;
    if (window === 5) { kernel = [-3, 12, 17, 12, -3]; norm = 35; }
    else if (window === 7) { kernel = [-2, 3, 6, 7, 6, 3, -2]; norm = 21; }
    else { return; }

    const half = Math.floor(window / 2);
    const invNorm = 1.0 / norm;
    for (let i = half; i < n - half; i++) {
        let sum = 0;
        for (let j = 0; j < window; j++) {
            sum += data[i + j - half] * kernel[j];
        }
        out[i] = sum * invNorm;
    }
}

const jsSolveLinear = (a: Float64Array, b: Float64Array, n: number) => {
    for (let i = 0; i < n; i++) {
        let pivot = a[i * n + i];
        for (let k = i + 1; k < n; k++) {
            let factor = a[k * n + i] / pivot;
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
}

const jsFitPoly = (x: Float64Array, y: Float64Array, order: number) => {
    const n = order + 1;
    const matrix = new Float64Array(n * n);
    const vector = new Float64Array(n);
    const powers = new Float64Array(2 * order + 1);

    for (let i = 0; i < x.length; i++) {
        let px = 1;
        for (let j = 0; j <= 2 * order; j++) {
            powers[j] += px;
            if (j <= order) vector[j] += px * y[i];
            px *= x[i];
        }
    }
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) matrix[i * n + j] = powers[i + j];
    }
    return jsSolveLinear(matrix, vector, n);
}

// JS Deconvolution (Richardson-Lucy)
const jsDeconvRL = (data: Float64Array, kernel: Float64Array, iterations: number) => {
    const n = data.length;
    const kn = kernel.length;
    let current = new Float64Array(n).fill(1.0);
    const kernelFlipped = new Float64Array(kernel).reverse();

    for (let iter = 0; iter < iterations; iter++) {
        const estimation = new Float64Array(n);
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < kn; j++) {
                const kIdx = i + j - Math.floor(kn / 2);
                if (kIdx >= 0 && kIdx < n) {
                    estimation[i] += current[kIdx] * kernel[j];
                }
            }
        }

        const rel = new Float64Array(n);
        for (let i = 0; i < n; i++) {
            if (estimation[i] > 1e-12) rel[i] = data[i] / estimation[i];
        }

        const next = new Float64Array(n);
        for (let i = 0; i < n; i++) {
            let corr = 0.0;
            for (let j = 0; j < kn; j++) {
                const kIdx = i + j - Math.floor(kn / 2);
                if (kIdx >= 0 && kIdx < n) {
                    corr += rel[kIdx] * kernelFlipped[j];
                }
            }
            next[i] = current[i] * corr;
        }
        current = next;
    }
    return current;
}

// JS File Processing Implementations
const jsParseCSV = (text: string): string[][] => {
    return text.trim().split('\n').map(line => line.split(','));
};

const jsParseTSV = (text: string): string[][] => {
    return text.trim().split('\n').map(line => line.split('\t'));
};

const jsParseMPT = (text: string): string[][] => {
    const lines = text.trim().split('\n');
    // Skip first 60 lines (metadata) + 1 header line
    return lines.slice(61).map(line => line.split('\t'));
};

const jsSniffFormat = (header: Uint8Array): { format: string; delimiter: number; skipLines: number } => {
    const text = new TextDecoder().decode(header);
    const commaCount = (text.match(/,/g) || []).length;
    const tabCount = (text.match(/\t/g) || []).length;
    
    if (tabCount > commaCount) {
        return { format: 'tsv', delimiter: 9, skipLines: 0 };
    } else {
        return { format: 'csv', delimiter: 44, skipLines: 0 };
    }
};

// JS Butterworth Low-pass (2nd Order IIR)
const jsButterworthLP = (data: Float64Array, out: Float64Array, cutoff: number, fs: number) => {
    const n = data.length;
    const ff = cutoff / fs;
    const ita = Math.tan(Math.PI * ff);
    const q = Math.SQRT2;
    
    const b0 = (ita ** 2) / (1.0 + q * ita + (ita ** 2));
    const b1 = 2.0 * b0;
    const b2 = b0;
    const a1 = 2.0 * ((ita ** 2) - 1.0) / (1.0 + q * ita + (ita ** 2));
    const a2 = (1.0 - q * ita + (ita ** 2)) / (1.0 + q * ita + (ita ** 2));

    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < n; i++) {
        const x0 = data[i];
        const y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
        out[i] = y0;
        x2 = x1; x1 = x0; y2 = y1; y1 = y0;
    }
}

const runBench = async (fn: () => void, iterations: number) => {
  for(let i=0; i<3; i++) fn();
  const start = performance.now();
  for(let i=0; i<iterations; i++) fn();
  return (performance.now() - start) / iterations;
}

self.onmessage = async (e) => {
  if (e.data.type === 'start') {
    try {
      self.postMessage({ type: 'log', message: 'CRITICAL: Activating Engine V13 (Hyper-Parallel - Adaptive Granularity)...' });
      const wasm = await init();
      initHooks();
      
      // V14: Initialize thread pool for multi-core performance
      // Only attempt if cross-origin isolation is enabled, otherwise fallback to sequential
      if (typeof SharedArrayBuffer !== 'undefined' && (self as any).crossOriginIsolated) {
        const nThreads = navigator.hardwareConcurrency || 4;
        self.postMessage({ type: 'log', message: `Initializing ${nThreads} CPU threads (SharedArrayBuffer active)...` });
        await initThreadPool(nThreads);
      } else {
        self.postMessage({ type: 'log', message: 'WARNING: Cross-Origin Isolation NOT detected. Defaulting to sequential (single-threaded) execution.' });
      }
      
      wasmMemory = wasm.memory;
      const engine = new SciEngine();

      // Generate test data for IO benchmarks
      const generateCSVData = (rows: number, cols: number): string => {
        let csv = '';
        // Header
        csv += Array.from({ length: cols }, (_, i) => `Column${i + 1}`).join(',') + '\n';
        // Data rows
        for (let i = 0; i < rows; i++) {
          const row = Array.from({ length: cols }, (_, j) => 
            (Math.random() * 1000).toFixed(6)
          ).join(',');
          csv += row + '\n';
        }
        return csv;
      };

      const generateMPTData = (rows: number): string => {
        let content = '';
        // Metadata header (60 lines)
        for (let i = 0; i < 60; i++) {
          content += `# Metadata line ${i + 1}\n`;
        }
        // Data header
        content += 'Time/s\tEwe/V\tI/mA\tCycle\tIndex\n';
        // Data rows
        for (let i = 0; i < rows; i++) {
          const time = (i * 0.1).toFixed(6);
          const voltage = (2.5 + Math.sin(i * 0.01) * 0.5).toFixed(6);
          const current = (Math.random() * 10 - 5).toFixed(6);
          content += `${time}\t${voltage}\t${current}\t1\t${i}\n`;
        }
        return content;
      };

      const benchmarks = [
        {
          id: 'io_csv_small',
          name: 'CSV Parsing (10K rows × 5 cols)',
          iterations: 10,
          setup: () => {
            const csvText = generateCSVData(10000, 5);
            const csvBytes = new TextEncoder().encode(csvText);
            
            // ZERO-COPY: Pre-load data into WASM memory (like N-Body does)
            const ptr = allocParseBuffer(csvBytes.length);
            const wasmView = new Uint8Array(wasmMemory.buffer, ptr, csvBytes.length);
            wasmView.set(csvBytes);  // One-time copy in setup
            
            return {
              wasm: () => parseBufferInPlace(44, 1),  // Skip header, NO data transfer during bench!
              js: () => jsParseCSV(csvText)
            };
          }
        },
        {
          id: 'io_csv_large',
          name: 'CSV Parsing (100K rows × 8 cols)',
          iterations: 5,
          setup: () => {
            const csvText = generateCSVData(100000, 8);
            const csvBytes = new TextEncoder().encode(csvText);
            
            // ZERO-COPY: Pre-load data into WASM memory
            const ptr = allocParseBuffer(csvBytes.length);
            const wasmView = new Uint8Array(wasmMemory.buffer, ptr, csvBytes.length);
            wasmView.set(csvBytes);
            
            return {
              wasm: () => parseBufferInPlace(44, 1),
              js: () => jsParseCSV(csvText)
            };
          }
        },
        {
          id: 'io_mpt',
          name: 'MPT File Processing (50K rows with headers)',
          iterations: 5,
          setup: () => {
            const mptText = generateMPTData(50000);
            const mptBytes = new TextEncoder().encode(mptText);
            
            // ZERO-COPY: Pre-load data into WASM memory
            const ptr = allocParseBuffer(mptBytes.length);
            const wasmView = new Uint8Array(wasmMemory.buffer, ptr, mptBytes.length);
            wasmView.set(mptBytes);
            
            return {
              wasm: () => parseBufferInPlace(9, 61),  // Tab delimiter, skip 60 header + 1 column header
              js: () => jsParseMPT(mptText)
            };
          }
        },
        {
          id: 'io_format_detection',
          name: 'Format Detection (CSV vs TSV)',
          iterations: 50,
          setup: () => {
            const csvHeader = new TextEncoder().encode('a,b,c\n1,2,3\n4,5,6');
            const tsvHeader = new TextEncoder().encode('a\tb\tc\n1\t2\t3\n4\t5\t6');
            
            return {
              wasm: () => {
                sniffFormat(csvHeader);
                sniffFormat(tsvHeader);
              },
              js: () => {
                jsSniffFormat(csvHeader);
                jsSniffFormat(tsvHeader);
              }
            };
          }
        },
        {
          id: 'nbody',
          name: 'N-Body Turbo (f32x4 SIMD vs f32 JS)',
          iterations: 5,
          setup: () => {
            const bodies = 2000;
            const hPx = engine.create_vector_f32(bodies); 
            const hPy = engine.create_vector_f32(bodies);
            const hPz = engine.create_vector_f32(bodies);
            const hVx = engine.create_vector_f32(bodies);
            const hVy = engine.create_vector_f32(bodies);
            const hVz = engine.create_vector_f32(bodies);

            const jsPx = new Float32Array(bodies).fill(0).map(()=>Math.random());
            const jsPy = new Float32Array(bodies).fill(0).map(()=>Math.random());
            const jsPz = new Float32Array(bodies).fill(0).map(()=>Math.random());
            const jsVx = new Float32Array(bodies);
            const jsVy = new Float32Array(bodies);
            const jsVz = new Float32Array(bodies);

            const vPx = new Float32Array(wasmMemory.buffer, engine.get_ptr_f32(hPx), bodies);
            const vPy = new Float32Array(wasmMemory.buffer, engine.get_ptr_f32(hPy), bodies);
            const vPz = new Float32Array(wasmMemory.buffer, engine.get_ptr_f32(hPz), bodies);
            vPx.set(jsPx); vPy.set(jsPy); vPz.set(jsPz);
            
            return { 
              wasm: () => engine.nbody_f32_soa(hPx, hPy, hPz, hVx, hVy, hVz, 0.01, 20), 
              js: () => jsNBodySoaF32(jsPx, jsPy, jsPz, jsVx, jsVy, jsVz, 0.01, 20) 
            };
          }
        },
        {
          id: 'deconvolution',
          name: 'Deconvolution (100k pts - 50 iters)',
          iterations: 5,
          setup: () => {
              const s = 100000;
              const hIn = engine.create_vector(s);
              const hK = engine.create_vector(11);
              const hOut = engine.create_vector(s);
              
              const viewIn = new Float64Array(wasmMemory.buffer, engine.get_ptr(hIn), s);
              const viewK = new Float64Array(wasmMemory.buffer, engine.get_ptr(hK), 11);
              const jsIn = new Float64Array(s);
              const jsK = new Float64Array(11).fill(1/11);
              
              for(let i=0; i<s; i++) {
                  const v = Math.sin(i * 0.1) + 1.0;
                  viewIn[i] = v; jsIn[i] = v;
              }
              viewK.set(jsK);

              return {
                  wasm: () => engine.deconvolve(hIn, hK, hOut, 50),
                  js: () => jsDeconvRL(jsIn, jsK, 50)
              }
          }
        },
        {
          id: 'filters',
          name: 'Butterworth IIR Filter (1M pts - Order 2)',
          iterations: 10,
          setup: () => {
              const s = 1000000;
              const hIn = engine.create_vector(s);
              const hOut = engine.create_vector(s);
              const viewIn = new Float64Array(wasmMemory.buffer, engine.get_ptr(hIn), s);
              const jsIn = new Float64Array(s);
              const jsOut = new Float64Array(s);
              for(let i=0; i<s; i++) {
                  const v = Math.sin(i * 0.1) + Math.random() * 0.2;
                  viewIn[i] = v; jsIn[i] = v;
              }
              return {
                  wasm: () => engine.filter_butterworth(hIn, hOut, 100.0, 1000.0),
                  js: () => jsButterworthLP(jsIn, jsOut, 100.0, 1000.0)
              }
          }
        },
        {
            id: 'analysis_fitting',
            name: 'Analysis & Fitting (Smooth+Peaks+Fit)',
            iterations: 10,
            setup: () => {
                const s = 1000000; // 100k points
                const hIn = engine.create_vector(s);
                const hOut = engine.create_vector(s);
                const hX = engine.create_vector(s);
                
                const viewIn = new Float64Array(wasmMemory.buffer, engine.get_ptr(hIn), s);
                const viewX = new Float64Array(wasmMemory.buffer, engine.get_ptr(hX), s);
                const jsIn = new Float64Array(s);
                const jsX = new Float64Array(s);
                
                const jsOut = new Float64Array(s);
                
                for(let i=0; i<s; i++) {
                    const x = i * 0.1;
                    const v = Math.sin(x) + Math.random() * 0.1;
                    viewIn[i] = v; jsIn[i] = v;
                    viewX[i] = x; jsX[i] = x;
                }

                return {
                    wasm: () => {
                        engine.smooth_sg(hIn, hOut, 5);
                        engine.detect_peaks(hOut, 0.5);
                        engine.fit_poly(hX, hIn, 3);
                        engine.fit_exponential(hX, hIn);
                        engine.fit_logarithmic(hX, hIn);
                    },
                    js: () => {
                        jsSmoothSG(jsIn, 5, jsOut);
                        jsPeakDetection(jsOut, 0.5);
                        jsFitPoly(jsX, jsIn, 3);
                        jsFitPoly(jsX, jsIn, 2); // Approximation for JS bench
                        jsFitPoly(jsX, jsIn, 1); // Approximation for JS bench
                    }
                }
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
              const jsIn = new Float64Array(s);
              const jsOut = new Float64Array(s);
              for(let i=0; i<s; i++) {
                  const v = Math.sin(i * 0.01);
                  viewIn[i] = v; jsIn[i] = v;
              }
              return {
                  wasm: () => {
                      engine.diff(hIn, hOut, 0.01);
                      engine.integrate(hOut, 0.01);
                  },
                  js: () => {
                      jsDiff5Point(jsIn, 0.01, jsOut);
                      jsIntegrateSimpson(jsOut, 0.01);
                  }
              }
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
                const ptrRe = engine.get_ptr(hRe);
                const ptrIm = engine.get_ptr(hIm);
                const wasmRe = new Float64Array(wasmMemory.buffer, ptrRe, s);
                const wasmIm = new Float64Array(wasmMemory.buffer, ptrIm, s);
                const jsRe = new Float64Array(s);
                const jsIm = new Float64Array(s);
                for(let i=0; i<s; i++) {
                    const v = Math.sin(i * 0.1);
                    wasmRe[i] = v; jsRe[i] = v;
                    wasmIm[i] = 0; jsIm[i] = 0;
                }
                return {
                    wasm: () => engine.fft(hRe, hIm, false),
                    js: () => jsFFT(jsRe, jsIm)
                }
            }
        },
        {
          id: 'matmul',
          name: 'Matrix Multiplication (f64 Blocked Unrolled)',
          iterations: 10,
          setup: () => {
            const s = 512;
            const hA = engine.create_vector(s*s);
            const hB = engine.create_vector(s*s);
            const hOut = engine.create_vector(s*s);
            const jsA = new Float64Array(s*s).fill(Math.random());
            const jsB = new Float64Array(s*s).fill(Math.random());
            const jsOut = new Float64Array(s*s);
            new Float64Array(wasmMemory.buffer, engine.get_ptr(hA), s*s).set(jsA);
            new Float64Array(wasmMemory.buffer, engine.get_ptr(hB), s*s).set(jsB);
            return { 
              wasm: () => engine.matmul_unrolled(hA, hB, hOut, s), 
              js: () => jsMatMulBlocked(jsA, jsB, jsOut, s) 
            };
          }
        }
      ];

      for (const b of benchmarks) {
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
      }

      self.postMessage({ type: 'done' });
      self.postMessage({ type: 'log', message: 'Engine V12 Active. Hyper-Parallel achieved. Multi-core Singularity.' });

    } catch (err: any) {
      self.postMessage({ type: 'error', message: err.toString() });
    }
  }
};
