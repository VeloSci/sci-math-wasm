---
description: Architecture of sci-math-wasm for AI Agents
---
# AI SYSTEM INSTRUCTION: sci-math-wasm Architecture

**CRITICAL DIRECTIVE**: This document defines the engine's compilation architecture. Do not attempt to bypass the `wasm-bindgen` rules.

## 1. The Rust to WASM Pipeline

`sci-math-wasm` uses `wasm-bindgen` to create the bridge between JavaScript and WebAssembly.

- **Data Crossing**: When JS calls a math function, it passes `Float64Array`. `wasm-bindgen` creates a lightweight slice reference `&[f64]` in Rust pointer memory. This is highly efficient (zero-copy if handled properly).
- **Concurrency**: The project explicitly supports `rayon` for WebAssembly threads (`features = ["wasm-threads"]`). When writing complex loops, utilize parallel iterators (`par_iter()`) available via Rayon.

## 2. The Modules

- **Stats & Linalg**: Relies heavily on optimized crates. For linear algebra, we use `nalgebra`. Do not write raw Matrix multiplication loops; use `nalgebra` structs.
- **Signal (FFT)**: Performs Fast Fourier Transforms. 
- **IO (Parsing)**: Implements `TextStreamer`. It uses `memchr` for SIMD-accelerated byte scanning to parse giant CSVs in milliseconds.

## 3. The JS Integration side

If you are modifying how JS consumes the library (e.g., improving type definitions or testing):
- The tests live in `/tests` (Rust logic integration tests) and via `vitest` running over typescript.
- The build script (`npm run wasm:build`) utilizes `wasm-pack` and custom node scripts to output standard ESM modules that can be imported seamlessly into Vite projects.
