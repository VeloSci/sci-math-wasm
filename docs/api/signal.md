# Signal Processing

Advanced tools for signal analysis, transforms, and filtering. These functions are available via `SciMathJS` and are automatically optimized using WASM when a provider is configured.

## Usage

```typescript
import { SciMathJS } from '@velo-sci/sci-math-wasm';

const data = new Float64Array([1, 0, -1, 0, 1, 0, -1, 0]);
const spectrum = SciMathJS.fft(data);
```

## API Reference

### `fft`
Fast Fourier Transform (Cooley-Tukey algorithm).

**Formula:**
$$ X_k = \sum_{n=0}^{N-1} x_n e^{-\frac{2\pi i}{N} kn} $$

**Signature:**
```typescript
function fft(input: Float64Array | number[]): Float64Array
```

---

### `ifft`
Inverse Fast Fourier Transform.

**Signature:**
```typescript
function ifft(re: Float64Array, im: Float64Array): Float64Array
```

---

### `rfft`
Real-valued Fast Fourier Transform. Returns only the non-redundant positive frequencies.

**Signature:**
```typescript
function rfft(input: Float64Array | number[]): Float64Array
```

---

### `magnitude`
Computes the magnitude of a complex FFT result.

**Formula:**
$$ ||X_k|| = \sqrt{Re(X_k)^2 + Im(X_k)^2} $$

**Signature:**
```typescript
function magnitude(complexData: Float64Array | number[]): Float64Array
```

---

### `movingAverage`
Smoothes a signal using a sliding window.

**Signature:**
```typescript
function movingAverage(data: Float64Array | number[], window: number): Float64Array
```

---

### `findPeaks`
Detects peaks (local maxima) using a dual-stage algorithm:
1. Identifying local maxima above a `threshold`.
2. Filtering by `prominence` (minimum vertical descent required to reach a higher peak).

High-performance implementation that is parallelized in WASM.

**Signature:**
```typescript
function findPeaks(data: Float64Array | number[], threshold: number, prominence: number): Uint32Array
```

---

### `smoothSG`
Smooths a signal using a Generalized Savitzky-Golay filter. Unlike a simple moving average, this filter preserves the higher moments of the signal (like peak height and width) better.

**Signature:**
```typescript
function smoothSG(data: Float64Array | number[], window: number, degree: number): Float64Array
```

*   `window`: The size of the smoothing window (must be an odd integer).
*   `degree`: The degree of the polynomial to fit (usually 2 or 4).

---

### `removeBaseline` / `removeBaselineIterative`
Removes the baseline (background) from a signal using polynomial fitting.

**Signature:**
```typescript
function removeBaseline(data: Float64Array, x: Float64Array, order: number): Float64Array;
function removeBaselineIterative(data: Float64Array, x: Float64Array, order: number, iters: number): Float64Array;
```

*   `order`: Polynomial degree for the baseline fit.
*   `iters`: (For iterative) Number of refinement steps. If `> 1`, the algorithm ignores peaks to find the "true" background.

---

### `butterworthFilter` / `butterworthLowpass`
Applies a digital Butterworth lowpass filter.

**Signature:**
```typescript
function butterworthFilter(data: Float64Array | number[], cutoff: number, fs: number): Float64Array
```

---

### `estimateSNR`
Estimates the Signal-to-Noise Ratio (SNR) of a signal using median absolute deviation of differences.

**Signature:**
```typescript
function estimateSNR(data: Float64Array | number[]): number
```

---

### `deconvolveRL`
Performs Richardson-Lucy deconvolution for iterative image or signal restoration.

**Signature:**
```typescript
function deconvolveRL(data: Float64Array | number[], kernel: Float64Array | number[], iterations: number): Float64Array
```

---

### `decimate`
Downsamples the signal by keeping every `n`-th sample.

**Signature:**
```typescript
function decimate(data: Float64Array | number[], factor: number): Float64Array
```

---

### `resample_linear`
Resamples the signal to a new length using linear interpolation.

**Signature:**
```typescript
function resample_linear(data: Float64Array | number[], new_len: number): Float64Array
```
