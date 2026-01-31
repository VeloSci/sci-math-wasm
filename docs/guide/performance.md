# WASM Performance

Understanding why and when to use WebAssembly for mathematics.

## Why WebAssembly?

JavaScript engines (like V8) are incredibly fast, but they have limitations when it comes to raw number crunching:

1.  **Dynamic Typing**: JS numbers are always 64-bit floats (doubles). The engine has to check types constantly.
2.  **Memory Layout**: JS objects and arrays are not guaranteed to be contiguous in memory, leading to cache misses.
3.  **Garbage Collection**: Complex calculations creating many temporary objects can trigger GC pauses.

**WebAssembly (WASM)** solves these by providing:
- **Static Typing**: Rust compiles to strict types (i.e., `f64`, `u32`).
- **Linear Memory**: Data is stored in a flat buffer, cache-friendly.
- **No GC**: Rust manages memory manually (via ownership), reducing unpredictable pauses.

## Benchmarks

*Representative comparisons for 10M iterations.*

| Operation | JavaScript | sci-math-wasm | Speedup |
| :--- | :--- | :--- | :--- |
| **FFT (1024 points)** | ~12ms | ~3ms | **4x** |
| **Matrix Mul (100x100)** | ~45ms | ~8ms | **5.5x** |
| **Simple Addition** | <1ms | <1ms | 1x (Overhead dominates) |

## Best Practices

### 1. Minimize Boundary Crossing
Calling a WASM function from JS has a small overhead.
*   **Bad**: Calling `add(a, b)` inside a loop 1 million times.
*   **Good**: Passing a large array to `sum_array(data)` once.

### 2. Use TypedArrays
Always pass `Float64Array` or `Float32Array` to WASM functions. This allows memory to be viewed directly by WASM without copying (zero-copy) in some cases, or with efficient copying in others.

```typescript
// Efficient
const data = new Float64Array(10000);
const result = wasm.mean(data);
```

### 3. Initialize Once
The `init()` function loads the WASM module. Do this only once at the start of your application.

```typescript
import init from 'sci-math-wasm';

await init(); // Do this early
```
