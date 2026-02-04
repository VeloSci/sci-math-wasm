# SciEngine (Stateful API)

The `SciEngine` class provides a stateful interface for high-performance computing. It manages internal memory vectors to minimize data transfer between JavaScript and WebAssembly, making it ideal for large-scale data processing and iterative algorithms.

## Usage

```typescript
import init, { SciEngine } from '@velo-sci/sci-math-wasm';

await init();
const engine = new SciEngine();

// Create and populate vectors
const id_x = engine.create_vector(1000000);
const id_y = engine.create_vector(1000000);

// Data is passed via memory views
const mem = engine.get_memory_buffer(); // (Optional helper)
// ... write to engine memory ...

// Perform operations without data copying
engine.fft(id_x, id_y, false);
const result = engine.get_vector_data(id_x);
```

## API Reference

### Vector Management

#### `create_vector(size: number): number`
Allocates a new `f64` vector in the engine's memory and returns its unique ID.

#### `get_ptr(id: number): number`
Returns the memory pointer (offset) for the vector with the given ID.

#### `get_vector_data(id: number): Float64Array`
(JS Wrapper helper) Returns a copy of the vector data.

### Operations

#### `fft(re_id: number, im_id: number, inverse: boolean): void`
Performs an in-place FFT on the specified vectors.

#### `matmul_unrolled(a_id: number, b_id: number, o_id: number, size: number): void`
High-performance matrix multiplication.

#### `import_csv(data: Uint8Array, delimiter: number, skip: number): number[]`
Parses CSV data directly into the engine's memory. Returns a list of vector IDs.

#### `smooth_sg(id_in: number, id_out: number, window: number, degree: number): void`
Stateful Savitzky-Golay smoothing.

#### `remove_baseline(id_y: number, id_x: number, order: number, id_out: number, iters: number): void`
Stateful baseline removal.

#### `deconvolve_rl(id_in: number, id_kernel: number, iterations: number, id_out: number): void`
Stateful Richardson-Lucy deconvolution.

#### `butterworth_lp(id_in: number, id_out: number, cutoff: number, fs: number): void`
Stateful Butterworth lowpass filter.

#### `genetic_algorithm(f: Function, bounds: number[], pop: number, gens: number, rate: number): number[]`
Runs the Optimized Genetic Algorithm from the stateful engine.
