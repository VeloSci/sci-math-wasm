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
Fast Fourier Transform.

**Algorithm:**
Uses the **Cooley-Tukey algorithm** for power-of-two lengths and falling back to Bluestein's algorithm for arbitrary lengths. Implemented in Rust using the `rustfft` crate or custom SIMD-optimized kernels for common sizes.

**Formula:**
$$ X_k = \sum_{n=0}^{N-1} x_n e^{-\frac{2\pi i}{N} kn} $$

**Signature:**
```typescript
function fft(input: Float64Array | number[]): Float64Array
```

<Playground title="FFT Lab">

```javascript
// 1. Generate a complex signal (100Hz + 250Hz)
const Fs = 1000;
const T = 1 / Fs;
const L = 1024;
const x = new Float64Array(L).map((_, i) => {
  const t = i * T;
  return Math.sin(2 * Math.PI * 100 * t) + 0.5 * Math.sin(2 * Math.PI * 250 * t);
});

// 2. Compute FFT (DX Layer uses async)
const spectrum = await SciMathJS.fft(x);

// 3. Compute Magnitude
const mags = await SciMathJS.magnitude(spectrum);

console.log('Signal length:', x.length);
console.log('Spectrum length:', spectrum.length);

// Return first 10 bins
return mags.slice(0, 10);
```

</Playground>

---

### `ifft`
Inverse Fast Fourier Transform.

**Algorithm:**
Applies the FFT algorithm on the conjugate of the input and scales the result by $1/N$.

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

**Formula:**
$$ y[i] = \frac{1}{M} \sum_{j=0}^{M-1} x[i+j] $$

**Signature:**
```typescript
function movingAverage(data: Float64Array | number[], window: number): Float64Array
```

---

### `findPeaks`
Detects peaks (local maxima) in a signal.

**Algorithm:**
Uses a dual-stage algorithm:
1. **Identification**: Identifying local maxima above a specified `threshold`.
2. **Refinement**: Filtering peaks based on **Prominence**. Prominence Measures how much a peak stands out from the surrounding baseline. A peak's prominence is the least drop in height necessary to reach a higher terrain.

**Signature:**
```typescript
function findPeaks(data: Float64Array | number[], threshold: number, prominence: number): Uint32Array
```

---

### `smoothSG`
Smooths a signal using a **Generalized Savitzky-Golay filter**.

**Background:**
The Savitzky-Golay filter works by fitting a low-degree polynomial to a window of adjacent data points using the method of linear least squares. This is superior to a moving average because it preserves features like peak height and width while removing high-frequency noise.

**Signature:**
```typescript
function smoothSG(data: Float64Array | number[], window: number, degree: number): Float64Array
```

*   `window`: The size of the smoothing window (must be an odd integer).
*   `degree`: The degree of the polynomial to fit (usually 2 or 4).

---

### `removeBaseline` / `removeBaselineIterative`
Removes the baseline (background) from a signal.

**Algorithm:**
Uses **Modified Poly-fit**. In the iterative version, the algorithm performs a polynomial fit, then "clips" the data points that are above the fit (peaks) and re-fits. After several iterations, the fit converges to the "true" background of the signal, ignoring the analytical peaks.

**Signature:**
```typescript
function removeBaseline(data: Float64Array, x: Float64Array, order: number): Float64Array;
function removeBaselineIterative(data: Float64Array, x: Float64Array, order: number, iters: number): Float64Array;
```

---

### `butterworthFilter` / `butterworthLowpass`
Applies a digital Butterworth lowpass filter.

**Background:**
The Butterworth filter is designed to have a frequency response as flat as possible in the passband. It's often called a "maximally flat magnitude" filter.

**Signature:**
```typescript
function butterworthFilter(data: Float64Array | number[], cutoff: number, fs: number): Float64Array
```

---

### `estimateSNR`
Estimates the Signal-to-Noise Ratio (SNR) of a signal.

**Algorithm:**
Uses the **Median Absolute Deviation (MAD)** of the first-order differences of the signal to estimate the noise level $\sigma$.
$$ \text{SNR} = 10 \log_{10} \left( \frac{\text{SignalPower}}{\sigma^2} \right) $$

**Signature:**
```typescript
function estimateSNR(data: Float64Array | number[]): number
```

---

### `deconvolveRL`
Performs **Richardson-Lucy deconvolution**.

**Algorithm:**
An iterative method for restoring a signal that has been blurred by a known point spread function (PSF) or kernel.
$$ \hat{c}_{t+1} = \hat{c}_t \left( \frac{d}{k * \hat{c}_t} * \hat{k} \right) $$
Where $d$ is the observed data and $k$ is the kernel.

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
