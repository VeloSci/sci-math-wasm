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
Detects peaks (local maxima) above a certain threshold. High-performance implementation that is parallelized in WASM.

**Signature:**
```typescript
function findPeaks(data: Float64Array | number[], threshold: number): Uint32Array
```

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
