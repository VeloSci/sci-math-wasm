# Signal Processing

Advanced tools for signal analysis, transforms, and filtering.

## API Reference

### `fft`
Fast Fourier Transform (Cooley-Tukey algorithm).

**Formula:**
$$ X_k = \sum_{n=0}^{N-1} x_n e^{-\frac{2\pi i}{N} kn} $$

**Input:** Real signal of power-of-two length.
**Output:** Alternating real and imaginary parts `[re0, im0, re1, im1, ...]`.

**Signature:**
```typescript
function fft(input: Float64Array): Float64Array
```

---

### `magnitude`
Computes the magnitude of a complex FFT result.

**Formula:**
$$ |X_k| = \sqrt{Re(X_k)^2 + Im(X_k)^2} $$

**Signature:**
```typescript
function magnitude(complexData: Float64Array): Float64Array
```

---

### `moving_average`
Smoothes a signal using a sliding window.

**Signature:**
```typescript
function moving_average(data: Float64Array, windowSize: number): Float64Array
```

---

### `find_peaks`
Detects peaks (local maxima) above a certain threshold.

**Signature:**
```typescript
function find_peaks(data: Float64Array, threshold: number): Uint32Array
```
