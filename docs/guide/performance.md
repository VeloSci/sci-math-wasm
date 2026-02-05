# Performance Guide

Experience the power of WebAssembly in real-time. This interactive dashboard runs mathematical operations in your browser, comparing JavaScript performance with our highly optimized Rust/WASM implementation.

<BenchmarkRunner />

## When to use WASM vs JavaScript?

While WebAssembly is powerful, it's not always the best tool for every job. Understanding the "Cost of Crossing the Bridge" is key.

### Use JavaScript when:
- **Small Data Sets**: For arrays with fewer than 1,000 elements, the overhead of calling into WASM might exceed the execution time.
- **Simple Operations**: Basic arithmetic (`a + b`) on standard arrays is highly optimized by modern JIT engines (V8).
- **Heavy DOM Interaction**: If the result of your calculation is immediately used to update many DOM elements, JS might be simpler.

### Use WebAssembly (sci-math-wasm) when:
- **Large Data Sets**: Operations on $10^5$ to $10^7$ elements see massive speedups.
- **Complex Algorithms**: Iterative methods like `deconvolveRL`, `eigenvalues`, or complex FFTs.
- **Background Processing**: Heavy math in Web Workers where WASM can utilize multi-threading (Rayon).
- **Chained Operations**: Using `SciEngine` to keep data in WASM memory for a sequence of 10+ operations avoids the transfer overhead completely.

## Why use WebAssembly?

WebAssembly (WASM) allows us to execute code at near-native speeds. For computationally intensive tasks like **Matrix Multiplication** or **Signal Processing**, WASM consistently outperforms traditional JavaScript by significant margins.

### Key Factors in Performance:

1. **V15 Hyper-Parallel Engine**: Implements **Adaptive Parallelism**, intelligently switching between sequential execution for small tasks and massive multi-threaded chunking for heavy workloads.
2. **Stateful Vector Management**: Using the `SciEngine` API allows keeping data in WASM memory across multiple operations, avoiding costly data serialization/deserialization.
3. **SIMD & Zero-Copy**: Hand-optimized SIMD kernels combined with `Float64Array::view` for zero-copy data access between Rust and JS.
4. **Rayon Work Stealing**: Advanced thread-pooling that balances workloads across all available cores in the background.
5. **Predictable Latency**: No Garbage Collection (GC) pressure for intensive math loops, ensuring ultra-low jitters in real-time analysis.

---

::: tip Running locally
If you want to run these benchmarks on your own infrastructure with Node.js, you can use:
```bash
pnpm bench:ts
```
:::
