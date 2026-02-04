# Performance Benchmarks

Experience the power of WebAssembly in real-time. This interactive dashboard runs mathematical operations in your browser, comparing JavaScript performance with our highly optimized Rust/WASM implementation.

<BenchmarkRunner />

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
