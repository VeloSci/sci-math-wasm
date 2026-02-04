# sci-math-wasm Development Roadmap 🚀

> **Vision:** Transform sci-math-wasm into the definitive scientific computing library for the web platform, combining the raw power of Rust/WebAssembly with exceptional developer experience.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Phase 1: Foundation & DX](#phase-1-foundation--dx-q1-2026)
3. [Phase 2: Performance & Features](#phase-2-performance--features-q2-2026)
4. [Phase 3: Ecosystem & Integrations](#phase-3-ecosystem--integrations-q3-2026)
5. [Phase 4: Advanced Features](#phase-4-advanced-features-q4-2026)
6. [Technical Debt & Improvements](#technical-debt--improvements)
7. [Architecture Decisions](#architecture-decisions)

---

## Executive Summary

### Current State Analysis

**Strengths:**
- Solid mathematical foundation (stats, linalg, signal, fitting, analysis)
- Parallel processing with Rayon (multi-threaded WASM)
- Flexible file I/O (CSV, Excel, scientific formats)
- Pure JS fallback via `SciMathJS` with WASM delegation
- Good performance for heavy computations (FFT, MatMul)

**Areas for Improvement:**
- Initialization flow is cumbersome (manual `init()` + `initThreadPool()`)
- TypeScript types could be more ergonomic
- No framework-specific integrations (React hooks, Vue composables)
- Missing higher-level abstractions (DataFrame-like structures)
- Limited error handling and debugging tools
- No CDN/UMD distribution for quick prototyping

---

## Phase 1: Foundation & DX (Q1 2026) [COMPLETED]

### 1.1 Zero-Config Initialization ⚡
- [x] Create `AutoInit` wrapper that lazily initializes WASM (scripts/wrap-wasm.cjs)
- [x] Detect `SharedArrayBuffer` support and auto-configure threads (scripts/wrap-wasm.cjs)
- [x] Provide `configure()` API for advanced users (scripts/wrap-wasm.cjs)
- [x] Add synchronous initialization tracking (scripts/wrap-wasm.cjs)

### 1.2 TypeScript Ergonomics
- [x] Generic typed arrays support (scripts/wrap-wasm.cjs)
- [x] Overloaded function signatures (scripts/wrap-wasm.cjs)
- [x] Better error types with discriminated unions (scripts/wrap-wasm.cjs)
- [x] JSDoc with LaTeX in IDE tooltips (scripts/wrap-wasm.cjs)

### 1.3 Debugging & Profiling Tools
- [x] Add `debug` mode with detailed logging (scripts/wrap-wasm.cjs)
- [x] Performance profiler for identifying bottlenecks (scripts/wrap-wasm.cjs)
- [x] Memory usage tracker (scripts/wrap-wasm.cjs)
- [x] WASM vs JS execution path indicator (scripts/wrap-wasm.cjs)

### 1.4 Error Handling Improvements
- [x] Wrap all WASM panics in proper JS errors (scripts/wrap-wasm.cjs)
- [x] Add custom error classes with context (scripts/wrap-wasm.cjs)
- [x] Validation layer with helpful messages (scripts/wrap-wasm.cjs)

---

## Phase 2: Performance & Features (Q2 2026) [COMPLETED]

### 2.1 SIMD Optimization
- [x] SIMD-accelerated dot product (src/linalg/mod.rs)
- [x] SIMD matrix operations (src/linalg/mod.rs)
- [x] SIMD FFT butterfly operations (src/fft/mod.rs)
- [x] Feature detection and fallback (src/linalg/mod.rs)

### 2.2 Memory Pool System
- [x] Implement memory block allocation in `SciEngine` (src/engine_core/memory.rs)
- [x] JS-side creation and reuse (scripts/wrap-wasm.cjs)
- [x] Arena allocator for batch operations (src/engine_core/memory.rs)

### 2.3 DataFrame API (High-Level Abstraction)
- [x] Create `DataFrame` class foundation (scripts/wrap-wasm.cjs)
- [x] WASM-backed storage and column naming (src/engine_core/memory.rs)
- [x] Fluent API structure (scripts/wrap-wasm.cjs)
- [x] `fromCSV` with auto-detection (scripts/wrap-wasm.cjs)

### 2.4 Extended Mathematical Functions
- [x] `mean`, `variance`, `standardDeviation`, `median` (Parallel)
- [x] `covariance(x, y)` and `correlation(x, y)` (Parallel)
- [x] `integrate` (Simpson's 1/3) and `diff` (5-point stencil)
- [x] `dotProduct` (SIMD) and `normalize` (Parallel)
- [x] Matrix Multiplication (SIMD/Parallel)

### 2.4 Extended Mathematical Functions

**Statistics:**
- [x] `mean(data)` - Arithmetic mean (src/stats/mod.rs)
- [x] `variance(data)` - Sample variance (src/stats/mod.rs)
- [x] `standardDeviation(data)` - Standard deviation (src/stats/mod.rs)
- [x] `median(data)` - Median value (src/stats/mod.rs)
- [x] `percentile(data, p)` - Arbitrary percentile calculation (src/stats/mod.rs)
- [x] `mode(data)` - Most frequent value (src/stats/mod.rs)
- [x] `skewness(data)` - Asymmetry measure (src/stats/mod.rs)
- [x] `kurtosis(data)` - Tail heaviness (src/stats/mod.rs)
- [x] `covariance(x, y)` - Covariance matrix (src/stats/mod.rs)
- [x] `correlation(x, y)` - Pearson correlation (src/stats/mod.rs)
- [x] `histogram(data, bins)` - Binned frequency counts (src/stats/mod.rs)

**Linear Algebra:**
- [x] `dotProduct(a, b)` - Vector dot product (src/linalg/mod.rs)
- [x] `normalize(v)` - Vector normalization (src/linalg/mod.rs)
- [x] `matrixMultiply(A, B)` - Matrix multiplication (src/linalg/mod.rs)
- [x] `transpose(M)` - Matrix transposition (src/linalg/mod.rs)
- [x] `solveLinearSystem(A, b)` - Linear system solver (src/linalg/mod.rs)
- [x] `eigenvalues(matrix)` - Eigenvalue decomposition (src/linalg/mod.rs)
- [x] `svd(matrix)` - Singular Value Decomposition (src/linalg/mod.rs)
- [x] `lu(matrix)` - LU factorization (src/linalg/mod.rs)
- [x] `qr(matrix)` - QR decomposition (src/linalg/mod.rs)
- [x] `cholesky(matrix)` - Cholesky factorization (src/linalg/mod.rs)
- [x] `determinant(matrix)` - Matrix determinant (src/linalg/mod.rs)
- [x] `rank(matrix)` - Matrix rank (src/linalg/mod.rs)
- [x] `pseudoInverse(matrix)` - Moore-Penrose inverse (src/linalg/mod.rs)

**Signal Processing:**
- [x] `fft(data)` - Fast Fourier Transform (src/fft/mod.rs)
- [x] `movingAverage(data, window)` - Smoothing filter (src/signal/mod.rs)
- [x] `smoothSG(data, window, degree)` - Generalized Savitzky-Golay (src/analysis/smooth_sg.rs)
- [x] `findPeaks(data, threshold, prominence)` - Advanced peak detection (src/analysis/peak_detection.rs)
- [x] `butterworthFilter(data, cutoff, fs)` - Lowpass IIR filter (src/analysis/filters.rs)
- [x] `removeBaseline(data, x, order)` - Baseline removal (src/analysis/baseline.rs)
- [x] `deconvolveRL(data, kernel, iters)` - Richardson-Lucy deconvolution (src/analysis/deconvolve.rs)
- [x] `estimateSNR(data)` - Signal-to-Noise Ratio (src/analysis/snr.rs)
- [x] `stft(data, window, hop)` - Short-Time Fourier Transform (src/signal/mod.rs)
- [x] `istft(spectrum)` - Inverse STFT (src/signal/mod.rs)
- [x] `spectrogram(data)` - Time-frequency representation (src/signal/mod.rs)
- [x] `resample(data, rate)` - Signal resampling (src/signal/mod.rs)
- [x] `crossCorrelation(a, b)` - Cross-correlation (src/signal/mod.rs)
- [x] `autoCorrelation(data)` - Auto-correlation (src/signal/mod.rs)
- [x] `hilbert(data)` - Hilbert transform (src/signal/mod.rs)

**Calculus:**
- [x] `diff(data, h)` - Numerical derivative (src/calculus/mod.rs)
- [x] `integrate(data, h)` - Numerical integration (src/calculus/mod.rs)
- [x] `gradient(f, x)` - Numerical gradient (src/calculus/mod.rs)
- [x] `hessian(f, x)` - Hessian matrix (src/calculus/mod.rs)
- [x] `ode45(f, y0, t)` - ODE solver (src/calculus/mod.rs)
- [x] `interpolate(x, y, method)` - Spline interpolation (src/calculus/mod.rs)
- [x] `roots(f, bracket)` - Root finding (src/calculus/mod.rs)

**Optimization & Fitting:**
- [x] `fitLinear(x, y)` - Simple linear regression (src/fitting/mod.rs)
- [x] `fitPolynomial(x, y, order)` - Polynomial regression (src/fitting/mod.rs)
- [x] `fitExponential(x, y)` - Exponential decay/growth (src/fitting/mod.rs)
- [x] `fitLogarithmic(x, y)` - Logarithmic fitting (src/fitting/mod.rs)
- [x] `fitGaussians(x, y, initial)` - Multi-Gaussian fitting (src/fitting/mod.rs)
- [x] `minimize(f, x0, method)` - Function minimization (src/optimization/mod.rs)
- [x] `leastSquares(A, b)` - Least squares solver (src/optimization/mod.rs)
- [x] `constrainedOptimize(f, constraints)` - Constrained optimization (src/optimization/mod.rs)

---

## Phase 3: Ecosystem & Integrations (Q3 2026)

### 3.1 React Integration (packages/react/index.js)
- [x] `useMath` hook for async computations
- [x] `useSciEngine` for memory-persistent operations
- [x] Suspense support foundation

```typescript
// @sci-math/react
import { useMath, useSciEngine, useDataFrame } from '@sci-math/react';

function SignalViewer({ data }) {
  const { result, loading, error } = useMath(
    () => fft(data),
    [data]
  );
  
  if (loading) return <Spinner />;
  if (error) return <Error message={error.message} />;
  
  return <SpectrumChart data={result} />;
}

// With Suspense support
function Analysis() {
  const engine = useSciEngine();
  const spectrum = engine.fft(data); // Suspends until ready
  return <Chart data={spectrum} />;
}
```

### 3.2 Vue Integration (packages/vue/index.js)
- [x] `useMath` composable
- [x] Reactive dependency tracking
- [x] SSR-safe initialization

```typescript
// @sci-math/vue
import { useMath, useSciEngine } from '@sci-math/vue';

// Composition API
const { data, loading, error, execute } = useMath();

const result = computed(() => {
  if (!data.value) return null;
  return mean(data.value);
});

// Async component helper
const AsyncStats = defineSciMathComponent({
  props: ['data'],
  async setup(props) {
    const stats = await computeStats(props.data);
    return { stats };
  }
});
```

### 3.3 Node.js Improvements

- [x] Native WASI support (no browser polyfills) (packages/node/index.js)
- [x] Worker threads integration (packages/node/index.js)
- [x] Stream processing for large files (packages/node/streams.js)
- [x] Buffer zero-copy optimizations (via SharedArrayBuffer)

```typescript
// Node.js optimized path
import { createSciMath } from '@sci-math/node';

const sci = await createSciMath({
  workers: 4,
  memoryLimit: '1gb'
});

// Stream processing
import { pipeline } from 'stream/promises';
import { createFFTStream } from '@sci-math/node/streams';

await pipeline(
  fs.createReadStream('large-data.bin'),
  createFFTStream({ windowSize: 4096, overlap: 0.5 }),
  fs.createWriteStream('spectrum.bin')
);
```

### 3.4 CDN Distribution
- [x] UMD bundle generation (scripts/wrap-wasm.cjs)
- [x] ES Module support for CDNs
- [x] Automatic initialization in UMD

```html
<!-- UMD bundle for quick prototyping -->
<script src="https://cdn.jsdelivr.net/npm/sci-math-wasm@latest/dist/sci-math.umd.js"></script>
<script>
  SciMath.init().then(() => {
    const avg = SciMath.mean([1, 2, 3, 4, 5]);
    console.log('Mean:', avg);
  });
</script>

<!-- ES Module from CDN -->
<script type="module">
  import { mean, fft } from 'https://esm.sh/sci-math-wasm';
  const avg = await mean([1, 2, 3, 4, 5]);
</script>
```

### 3.5 Web Worker Bundle
- [x] Dedicated worker bundle with zero-copy (scripts/wrap-wasm.cjs)
- [x] Message-passing API with Promises
- [x] Batch operation support

```typescript
// Dedicated worker bundle for heavy computations
import { createWorkerMath } from 'sci-math-wasm/worker';

const worker = await createWorkerMath();

// Non-blocking heavy computations
const result = await worker.run('fft', largeData);

// Batch operations in worker
const results = await worker.batch([
  { op: 'mean', args: [data1] },
  { op: 'variance', args: [data2] },
  { op: 'fft', args: [data3] }
]);

// Transfer ownership (zero-copy)
const spectrum = await worker.run('fft', data, { transfer: true });
```

---

## Phase 4: Advanced Features (Q4 2026)

### 4.1 GPU Acceleration (WebGPU) (src/gpu/mod.rs)
- [x] WebGPU context management
- [x] Compute shader bridge for MatMul
- [x] Detection and fallback to WASM

```typescript
import { enableGPU, gpuMatMul } from 'sci-math-wasm/gpu';

await enableGPU(); // Auto-detect WebGPU support

// GPU-accelerated matrix multiplication
const result = await gpuMatMul(largeMatrixA, largeMatrixB);

// Hybrid execution strategy
configure({
  execution: {
    matmul: { threshold: 256, prefer: 'gpu' },  // Use GPU for matrices > 256x256
    fft: { threshold: 8192, prefer: 'gpu' },    // Use GPU for FFT > 8192 points
    stats: { prefer: 'wasm' }                    // Always use WASM for stats
  }
});
```

### 4.2 Machine Learning Primitives

```typescript
import { 
  linearLayer, sigmoid, relu, softmax,
  batchNorm, dropout, conv2d
} from 'sci-math-wasm/ml';

// Neural network building blocks
// [x] sigmoid, relu, softmax (src/ml/mod.rs)
// [x] linearLayer (src/ml/mod.rs)
// [x] batchNorm, dropout, conv2d (src/ml/mod.rs)
```

// Automatic differentiation (future)
import { autograd } from 'sci-math-wasm/autograd';

const loss = autograd((x, y) => {
  const pred = model(x);
  return mse(pred, y);
});

const gradients = loss.backward(input, target);
```

### 4.3 Scientific File Formats
- [x] HDF5/NetCDF detection (src/io/sniffers.rs)
- [x] MATLAB .mat files foundation (src/io/matlab.rs)
- [x] Numpy .npy/.npz files (src/io/npy.rs)
- [x] Excel files (src/io/binary.rs)
- [x] Parquet/Arrow detection (src/io/sniffers.rs)

```typescript
import { readHDF5, readNetCDF, readNPY } from 'sci-math-wasm/io';

const h5 = await readHDF5(file);
const dataset = h5.get('/measurements/voltage');

const nc = await readNetCDF(file);
const temperature = nc.variable('temp').slice([0, 0], [100, 100]);

const array = await readNPY(file); // Returns Float64Array
```

### 4.4 Symbolic Mathematics (src/symbolic/mod.rs)
- [x] `simplify` - Basic expression simplification
- [x] `diff` - Symbolic differentiation
- [x] `integrate` - Symbolic integration
- [x] `compile` - Compile to high-performance JS functions
- [x] `eval` - Numerical evaluation

```typescript
import { symbolic as S } from 'sci-math-wasm/symbolic';

const x = S.symbol('x');
const expr = S.sin(x) ** 2 + S.cos(x) ** 2;

console.log(S.simplify(expr)); // "1"
console.log(S.diff(S.sin(x), x)); // "cos(x)"
console.log(S.integrate(S.exp(x), x)); // "exp(x)"

// [x] simplify, diff, integrate, eval (src/symbolic/mod.rs)
// [x] to_js_string (src/symbolic/mod.rs)
```

---

## Technical Debt & Improvements

### Code Quality

- [ ] **Consistent Error Handling:** Replace `unwrap()` with proper `Result` types
- [ ] **Remove `unsafe` where possible:** Audit all unsafe blocks
- [ ] **Better naming conventions:** Align Rust and JS names
- [x] **Module organization:** Split large files (src/analysis/mod.rs, src/engine_core/mod.rs)

### Testing
- [x] Property-based testing foundation (tests/accuracy.rs)
- [x] Cross-browser testing (Playwright ready)
- [x] Performance regression tests (benchmarks/)
- [x] Numerical accuracy tests (tests/accuracy.rs)

### Build System
- [x] Optimize WASM size (wasm-opt integration)
- [x] Tree-shaking support
- [x] Multi-target builds (Web, Node, Worker)

### Documentation

- [ ] **Interactive examples:** Runnable code in docs
- [ ] **Algorithm explanations:** Add mathematical background
- [ ] **Migration guide:** From NumPy/SciPy patterns
- [ ] **Performance guide:** When to use WASM vs JS
- [ ] **Video tutorials:** Getting started, common patterns

---

## Architecture Decisions

### Decision 1: Hybrid Execution Strategy

**Context:** Some operations are faster in pure JS due to WASM boundary overhead.

**Decision:** Implement automatic selection based on input size and operation type.

```typescript
// Internal dispatcher
function dispatchMean(data: NumericArray): number {
  if (data.length < 1000) {
    return jsMean(data); // JS is faster for small arrays
  }
  return wasmMean(data); // WASM wins for large arrays
}
```

### Decision 2: Memory Management

**Context:** Frequent allocations hurt performance.

**Decision:** Use memory pools with configurable lifetime.

- **Short-lived:** Auto-release after operation
- **Session-lived:** Release on `dispose()`
- **Manual:** User controls lifetime

### Decision 3: Thread Pool

**Context:** SharedArrayBuffer requires COOP/COEP headers.

**Decision:** Auto-detect and gracefully degrade.

```typescript
// Detection flow
async function initThreads() {
  if (!crossOriginIsolated) {
    console.warn('sci-math-wasm: Cross-origin isolation not enabled. Running single-threaded.');
    return 1;
  }
  return navigator.hardwareConcurrency ?? 4;
}
```

### Decision 4: Bundling Strategy

**Context:** Different environments have different needs.

**Decision:** Multiple entry points:

```
sci-math-wasm/
├── index.js          # Auto-detecting entry
├── web.js            # Browser-optimized
├── node.js           # Node-optimized
├── worker.js         # Web Worker bundle
└── lite.js           # Core functions only (~50KB)
```

---

## Milestones & Success Metrics

### Q1 2026
- [ ] Zero-config initialization working
- [ ] 90% TypeScript type coverage
- [ ] < 100ms cold start time
- [ ] 50+ stars on GitHub

### Q2 2026
- [ ] SIMD optimization for top 5 functions
- [ ] DataFrame API beta
- [ ] Memory pool system
- [ ] < 50KB core bundle size

### Q3 2026
- [ ] React & Vue packages published
- [ ] Node.js performance parity with native
- [ ] CDN distribution
- [ ] 500+ weekly npm downloads

### Q4 2026
- [ ] GPU acceleration beta
- [ ] HDF5/NetCDF support
- [ ] ML primitives
- [ ] 1000+ weekly npm downloads

---

## Contributing

We welcome contributions! Priority areas:

1. **High Impact:** SIMD optimizations, DataFrame API
2. **Medium Impact:** Framework integrations, file format support
3. **Good First Issues:** TypeScript improvements, documentation

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## References

- [WebAssembly SIMD](https://v8.dev/features/simd)
- [wasm-bindgen-rayon](https://github.com/RReverser/wasm-bindgen-rayon)
- [Polars](https://github.com/pola-rs/polars) (DataFrame inspiration)
- [NumPy](https://numpy.org/) (API inspiration)
- [SciPy](https://scipy.org/) (Algorithm reference)

---

*Last Updated: February 2026*
*Version: 1.0.0*
