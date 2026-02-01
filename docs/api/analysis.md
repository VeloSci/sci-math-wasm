# Data Analysis

Advanced signal analysis and processing algorithms.

## API Reference

### `smooth_savitzky_golay`
Applies a Savitzky-Golay smoothing filter to the data. Preserves features better than moving averages.

**Signature:**
```typescript
function smooth_savitzky_golay(data: Float64Array, window: number): Float64Array
```
**Arguments:**
- `window`: Window size (must be odd, e.g., 5, 7, 9, 11).

### `remove_baseline`
Removes a polynomial baseline from the signal.

**Signature:**
```typescript
function remove_baseline(data: Float64Array, x: Float64Array, order: number): Float64Array
```

### `deconvolve_rl`
Performs Richardson-Lucy deconvolution to recover a signal blurred by a known kernel (PSF).

**Signature:**
```typescript
function deconvolve_rl(data: Float64Array, kernel: Float64Array, iterations: number): Float64Array
```

### `butterworth_lowpass`
Applies a digital 2nd-order Butterworth low-pass filter.

**Signature:**
```typescript
function butterworth_lowpass(data: Float64Array, cutoff: number, fs: number): Float64Array
```
**Arguments:**
- `cutoff`: Cutoff frequency (Hz).
- `fs`: Sampling frequency (Hz).

### `estimate_snr`
Estimates the Signal-to-Noise Ratio (SNR) using a robust difference-based method.

**Signature:**
```typescript
function estimate_snr(data: Float64Array): number
```
**Returns:** SNR in decibels (dB).
