# Benchmark Results Summary

**Date:** 2026-01-31
**Environment:** Linux (via Vitest Bench)

## Overview

Benchmarks comparing Rust/WASM implementation vs Pure JavaScript implementation for various mathematical operations.

## Results Table

| Operation | Implementation | Speed (ops/s) | Comparison | Notes |
|-----------|----------------|---------------|------------|-------|
| **Mean (1k)** | WASM | ~1,120,000 | **Baseline (Fast)** | |
| **Mean (1k)** | JS | ~132,000 | ~8.5x slower | WASM significantly faster |
| **MatMul (64x64)** | WASM | ~4,800 | | Faster than JS |
| **MatMul (64x64)** | JS | ~3,400 | ~1.4x slower | |
| **FFT (4096)** | WASM | ~1,700 | | No JS comparison, but fast |
| **Moving Avg (4k)** | WASM | ~24,800 | | Faster than JS |
| **Moving Avg (4k)** | JS | ~18,300 | ~1.35x slower | |
| **Derivative (4k)** | JS | ~124,000 | **Fastest** | Simple O(N) loop |
| **Derivative (4k)** | WASM | ~101,000 | ~1.2x slower | Overhead of call/memory |
| **Poly Eval (Deg 8)**| JS | ~23,850,000 | **Fastest** | Very light op |
| **Poly Eval (Deg 8)**| WASM | ~9,697,000 | ~2.5x slower | Overhead dominates |
| **Lin Reg (1k)** | JS | ~1,380,000 | **Fastest** | Simple O(N) sums |
| **Lin Reg (1k)** | WASM | ~649,000 | ~2.1x slower | Overhead dominates |

## Key Takeaways

1. **WASM Excels at:**
    - Heavy computational tasks (Matrix Multiplication).
    - Complex algorithms (FFT, likely).
    - Operations with more arithmetic intensity per data point (Moving Average).

2. **JS Excels at:**
    - Simple O(N) iterations over typed arrays (Derivative, Linear Regression).
    - Extremely lightweight operations (Polynomial Evaluation).
    - Scenarios where the overhead of crossing the WASM boundary (memory copying/views) outweighs the speedup of compilation.

## Recommendation

Use WASM for:
- Signal Processing (FFT, Filtering).
- Linear Algebra (Matrix ops).
- Heavy statistical analysis on large datasets.

Use JS for:
- Simple transformations (Scaling, derivative).
- Iterative calculations with low complexity.
