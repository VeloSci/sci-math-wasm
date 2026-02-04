# Statistics

Basic and advanced statistical analysis for data series via `SciMathJS`.

## Usage

```typescript
import { SciMathJS } from '@velo-sci/sci-math-wasm';

const data = new Float64Array([1, 2, 3, 4, 100]);
const avg = SciMathJS.mean(data);
const std = SciMathJS.standardDeviation(data);
```

## API Reference

### `mean`
Calculates the arithmetic average.

**Formula:**
$$ \mu = \frac{1}{n} \sum_{i=1}^n x_i $$

**Signature:**
```typescript
function mean(data: Float64Array | number[]): number
```

---

### `variance`
Calculates the sample variance ($n-1$ denominator).

**Formula:**
$$ s^2 = \frac{1}{n-1} \sum_{i=1}^n (x_i - \mu)^2 $$

**Signature:**
```typescript
function variance(data: Float64Array | number[]): number
```

---

### `standardDeviation`
Calculates the standard deviation (square root of variance).

**Signature:**
```typescript
function standardDeviation(data: Float64Array | number[]): number
```

---

### `median`
Calculates the median (50th percentile). High-performance implementation using partial sorting (quickselect) in WASM.

**Signature:**
function median(data: Float64Array | number[]): number
```

---

### `mode`
Calculates the mode (most frequent value) of the dataset.

**Signature:**
```typescript
function mode(data: Float64Array | number[]): number
```

---

### `skewness`
Calculates the skewness, a measure of the asymmetry of the probability distribution of a real-valued random variable.

**Signature:**
```typescript
function skewness(data: Float64Array | number[]): number
```

---

### `kurtosis`
Calculates the kurtosis, a measure of the "tailedness" of the probability distribution.

**Signature:**
```typescript
function kurtosis(data: Float64Array | number[]): number
```
