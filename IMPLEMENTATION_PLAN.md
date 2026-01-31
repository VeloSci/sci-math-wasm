# Implementation Plan - sci-math-wasm

Scientific mathematical functions library optimized for WebAssembly, written in Rust.

## Phase 1: Project Setup & Infrastructure
- [x] Initialize Rust library with `wasm-bindgen`.
- [x] Configure `Cargo.toml` for high-performance WASM builds (LTO, optimization levels).
- [x] Setup documentation workflow (Rustdoc + LaTeX support).
- [x] Define module structure.

## Phase 2: Foundation (Basic Mathematics)
- [x] **Arithmetic**: Basic functions implemented (clamp, lerp, etc).
- [x] **Trigonometry**: Sine, cosine, tangents, and their inverse functions.
- [x] **Basic Statistics**: Mean, median, mode, variance, standard deviation.
- [x] **Units**: Basic conversions and dimensional analysis support.

## Phase 3: Intermediate Math
- [x] **Linear Algebra**: Vector and Matrix operations (Addition, Multiplication, Transpose).
- [x] **Polynomials**: Evaluation, Root finding (basic).
- [x] **Complex Numbers**: Basic arithmetic and polar forms (via `num-complex`).

## Phase 4: Advanced Analysis
- [x] **FFT (Fast Fourier Transform)**: Core implementation for signal processing.
- [x] **Regression**: Linear, Polynomial, and Non-linear fitting.
- [x] **Calculus**: Numerical differentiation and integration.
- [x] **Signal Processing**: Filters (Moving Average), Peak detection.

## Phase 5: WASm Optimization
- [ ] Memory management between Rust and JS.
- [ ] SIMD optimization for supported browsers.
- [ ] Benchmarking vs Pure JS implementations.

## Documentation Standard
- Every function MUST have a doc block with:
  - Description.
  - Mathematical formula in LaTeX (via `$ ... $` or `$$ ... $$`).
  - `@example` usage in JS/TS.
  - Rust examples.
  - Complexity analysis ($O(n)$).

## Phase 6: Documentation & Polish (Completed)
- [x] **VitePress Integration**: Full static site generation setup.
- [x] **Math Rendering**: Robust LaTeX support using `markdown-it-katex` with custom alignment fixes.
- [x] **Visuals**: Orthogonal "Cyber-Math" theme, glassmorphism, and responsive design.
- [x] **API Reference**: Complete coverage of all modules (Trig, Stats, Signal, Poly, etc).
