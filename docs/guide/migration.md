# Migration from NumPy / SciPy

If you're coming from the Python scientific ecosystem (NumPy, SciPy), this guide will help you map your existing knowledge to `sci-math-wasm`.

## Core Concepts

In NumPy, you use `ndarray`. In `sci-math-wasm`, we primary work with standard JavaScript `Float64Array` and `Uint32Array` for maximum interoperability and performance.

### Array Creation

| NumPy | sci-math-wasm |
|-------|---------------|
| `np.array([1, 2, 3])` | `new Float64Array([1, 2, 3])` |
| `np.zeros(10)` | `new Float64Array(10)` |
| `np.ones(10)` | `new Float64Array(10).fill(1)` |
| `np.linspace(0, 1, 100)` | `SciMathJS.linspace(0, 1, 100)` |
| `np.arange(0, 10, 1)` | `SciMathJS.arange(0, 10, 1)` |

## Linear Algebra

Most linear algebra functions are located in the `linalg` module or available through `SciEngine` for stateful operations.

| NumPy / SciPy | sci-math-wasm |
|---------------|---------------|
| `np.dot(a, b)` | `SciMathJS.dot(a, b)` |
| `a @ b` (matrix mult) | `SciMathJS.matMul(a, b, rowsA, colsA, colsB)` |
| `np.linalg.inv(a)` | `SciMathJS.inverse(a, n)` |
| `np.linalg.solve(A, b)` | `SciMathJS.solve(A, b, n)` |
| `np.linalg.eig(A)` | `SciMathJS.eigenvalues(A, n)` |

## Signal Processing

Signal processing functions are highly optimized and follow similar naming conventions.

| SciPy `signal` | sci-math-wasm |
|----------------|---------------|
| `fft.fft(x)` | `SciMathJS.fft(x)` |
| `signal.savgol_filter(x, w, d)` | `SciMathJS.smoothSG(x, w, d)` |
| `signal.find_peaks(x)` | `SciMathJS.findPeaks(x, threshold, prominence)` |
| `signal.butter(n, wn)` | `SciMathJS.butterworthFilter(x, cutoff, fs)` |

## Key Differences

### 1. Memory Management
Unlike Python's automatic management, for large-scale operations you might want to use the `SciEngine` class to keep data in WASM memory and avoid the overhead of copying between JS and WASM.

```typescript
// NumPy style (implicit copies)
const result = SciMathJS.fft(data);

// Engine style (zero-copy / low overhead)
const engine = await SciEngine.create();
const buf = engine.allocate(data);
engine.fft(buf); // Operation in-place or specialized
```

### 2. Error Handling
`sci-math-wasm` uses standard JavaScript errors. Ensure you handle potential WASM initialization errors or out-of-memory states when working with extremely large datasets.

### 3. Dimensionality
While NumPy supports N-dimensional arrays natively, `sci-math-wasm` often uses flattened arrays (1D) with explicit dimension arguments for performance.

```typescript
// NumPy
const matrix = np.zeros((10, 10))

// sci-math-wasm
const matrix = new Float64Array(10 * 10);
const rows = 10;
const cols = 10;
```
