# Linear Algebra

Core operations for vector and matrix calculations via `SciMathJS`. High-performance implementations utilize BLAS-like routines optimized for WASM.

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

**Background:**
The dot product represents the projection of one vector onto another. In WASM, this is implemented using SIMD instructions (FMA - Fused Multiply-Add) for maximum throughput.

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
Where $||V|| = \sqrt{\sum v_i^2}$

**Signature:**
```typescript
function normalize(data: Float64Array | number[]): Float64Array
```

---

### `matrixMultiply`
Multiplies two matrices represented as flat arrays.

**Algorithm:**
Uses a Cache-Oblivious Tiled Matrix Multiplication algorithm. This reduces cache misses by breaking the matrices into smaller blocks that fit into the L1/L2 cache. For large matrices, it utilizes multi-threaded execution via Rayon.

**Formula:**
$$ C_{ij} = \sum_{k=1}^{n} A_{ik} B_{kj} $$

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
Solves a linear system $Ax = B$.

**Algorithm:**
Uses **Gaussian elimination with partial pivoting** to ensure numerical stability.
1. **Decomposition**: Matrix $A$ is converted to upper triangular form.
2. **Back-substitution**: Variable $x_n$ is solved first, then $x_{n-1}$ and so on.

**Signature:**
```typescript
function solveLinearSystem(a: Float64Array | number[], b: Float64Array | number[], n: number): Float64Array
```

---

### `invert2x2` / `invert3x3`
Inverts small matrices directly for high performance using Cramer's rule.

**Signature:**
```typescript
function invert2x2(m: Float64Array | number[]): Float64Array
function invert3x3(m: Float64Array | number[]): Float64Array
```

---

### `trace`
Calculates the trace of a square matrix (sum of diagonal elements).

**Signature:**
```typescript
function trace(matrix: Float64Array | number[], n: number): number
```

---

### `detLU`
Calculates the determinant of a square matrix using LU decomposition.

**Algorithm:**
Performs Lower-Upper (LU) decomposition such that $PA = LU$. The determinant is then:
$$ \det(A) = (-1)^s \prod_{i=1}^n L_{ii} U_{ii} $$
where $s$ is the number of row swaps.

**Signature:**
```typescript
function detLU(matrix: Float64Array | number[], n: number): number
```
