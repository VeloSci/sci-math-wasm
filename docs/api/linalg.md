# Linear Algebra

Core operations for vector and matrix calculations via `SciMathJS`.

## Usage

```typescript
import { SciMathJS } from '@velo-sci/sci-math-wasm';

const a = new Float64Array([1, 2, 3]);
const b = new Float64Array([4, 5, 6]);
const dot = SciMathJS.dotProduct(a, b);
```

## API Reference

### `dotProduct`
Calculates the dot product of two equal-length vectors.

**Formula:**
$$ A \cdot B = \sum_{i=1}^{n} a_i b_i $$

**Signature:**
```typescript
function dotProduct(a: Float64Array | number[], b: Float64Array | number[]): number
```

---

### `normalize`
Normalizes a vector to unit length (L2 norm).

**Formula:**
$$ \hat{V} = \frac{V}{||V||} $$

**Signature:**
```typescript
function normalize(data: Float64Array | number[]): Float64Array
```

---

### `matrixMultiply`
Multiplies two matrices represented as flat arrays.

**Signature:**
```typescript
function matrixMultiply(
  a: Float64Array | number[], rowsA: number, colsA: number,
  b: Float64Array | number[], rowsB: number, colsB: number
): Float64Array
```

---

### `transpose`
Transposes a matrix (flips it over its diagonal).

**Signature:**
```typescript
function transpose(data: Float64Array | number[], rows: number, cols: number): Float64Array
```

---

### `solveLinearSystem`
Solves a linear system $Ax = B$ using Gaussian elimination with partial pivoting. High-performance implementation that uses WASM parallel recursion when possible.

**Signature:**
```typescript
function solveLinearSystem(a: Float64Array | number[], b: Float64Array | number[], n: number): Float64Array
```

---

### `invert2x2` / `invert3x3`
Inverts small matrices directly for high performance.

**Signature:**
```typescript
function invert2x2(m: Float64Array | number[]): Float64Array
function invert3x3(m: Float64Array | number[]): Float64Array
```
