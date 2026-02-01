# Performance Benchmarks

Experience the power of WebAssembly in real-time. This interactive dashboard runs mathematical operations in your browser, comparing JavaScript performance with our highly optimized Rust/WASM implementation.

<BenchmarkRunner />

## Why use WebAssembly?

WebAssembly (WASM) allows us to execute code at near-native speeds. For computationally intensive tasks like **Matrix Multiplication** or **Signal Processing**, WASM consistently outperforms traditional JavaScript by significant margins.

### Key Factors in Performance:

1. **V13 Hyper-Parallel Engine**: Our latest version implements **Adaptive Parallelism**. It intelligently switches between sequential execution for small tasks and massive multi-threaded chunking for heavy workloads.
2. **SIMD Optimization**: Most kernels are hand-optimized with WebAssembly SIMD (Single Instruction, Multiple Data) to process multiple values per clock cycle.
3. **Rayon Work Stealing**: We utilize a work-stealing thread pool to ensure all CPU cores are balanced and utilized during complex calculations.
4. **Predictable Performance**: WASM execution is deterministic and lacks the garbage collection pauses common in large-scale JavaScript applications.

---

::: tip Running locally
If you want to run these benchmarks on your own infrastructure with Node.js, you can use:
```bash
pnpm bench:ts
```
:::
