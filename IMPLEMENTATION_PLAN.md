# 🚀 Sci-Math-WASM Implementation Roadmap

This document outlines the development strategy to transform `sci-math-wasm` into a comprehensive, high-performance scientific computing library for the web.
Our core philosophy is **SciEngine Architecture**: Zero-Copy memory management + Custom SIMD Intrinsics.

## 🏆 Current Status (Verified)
- [x] **Core Engine**: `SciEngine` with f64/f32 memory pools.
- [x] **Memory Management**: Zero-Copy handles.
- [x] **SIMD Arithmetic**: N-Body Simulation (**2.91x Speedup**).
- [x] **Linear Algebra**: Blocked Matrix Multiplication (**1.52x Speedup**).

---

## 📅 Development Roadmap

### PHASE 1: Spectral Analysis (The Frequency Domain)
*Objective: Outperform JS implementations of FFT using SIMD-accelerated complex number arithmetic.*

- [ ] **Complex FFT (Fast Fourier Transform)**
    - Implementation of Cooley-Tukey algorithm optimized for WASM.
    - Support for both Radix-2 and Radix-4 kernels.
- [ ] **Real-to-Complex FFT**
    - Optimized for audio and sensor data (real signals).
- [ ] **Inverse FFT (iFFT)**
    - Reconstructing signals from frequency domain.

### PHASE 2: Numerical Calculus (The Rate of Change)
*Objective: Real-time analysis of streaming data.*

- [ ] **Numerical Differentiation**
    - Finite difference methods (Central, Forward, Backward).
    - 5-point stencil for high precision.
- [ ] **Numerical Integration**
    - Trapezoidal Rule (fast).
    - Simpson's 1/3 Rule (precise).
    - Adaptive Quadrature integration.

### PHASE 3: Signal Processing & Analysis
*Objective: Advanced feature extraction and signal cleaning.*

- [ ] **Signal Filtering**
    - Savitzky-Golay Smoothing (Polynomial smoothing).
    - Butterworth Low-pass/High-pass filters.
- [ ] **Peak Detection**
    - Automatic local maxima finding with prominence thresholds.
    - Zero-crossing detection.
- [ ] **Baseline Correction**
    - Asymmetric Least Squares (AirPLS) or Polish Polynomial removal.
- [ ] **Signal-to-Noise Ratio (SNR)**
    - Robust noise estimation algorithms.
- [ ] **Deconvolution**
    - Gaussian Peak Deconvolution (separating overlapped peaks).
    - Richardson-Lucy algorithm blind deconvolution.

### PHASE 4: Data Fitting (The Model Layer)
*Objective: Finding trends and mathematical models in noisy data.*

- [ ] **Linear Regression**
    - Simple OLS (Ordinary Least Squares).
    - Weighted Least Squares.
- [ ] **Polynomial Fitting**
    - Fitting data to $y = ax^n + bx^{n-1} + ...$
    - Vandermonde matrix solving using QR decomposition.
- [ ] **Non-Linear Fitting**
    - Levenberg-Marquardt algorithm (LM) for curve fitting.

---

## 🧪 Benchmark Suite Expansion

Every algorithm will be added to the `bench.worker.ts` suite with the following comparison strategy:

| Module | Benchmark Case | Target Metrics |
| :--- | :--- | :--- |
| **FFT** | 1M points Transform | Time (ms) |
| **Calculus** | Integration of 10M pts array | Throughput (GB/s) |
| **Fitting** | PolyFit order=5 on 100k pts | Time (ms) / Precision |
| **Deconv** | Separating 5 gaussians | Convergence Iterations |

## 🏗 Architecture & Modules

We will restructure the crate to support these domains cleanly:

```rust
src/
├── lib.rs          // Exports
├── engine.rs       // Memory & SIMD Core (Existing)
├── fft/            // New
│   └── mod.rs      // FFT logic
├── calculus/       // New
│   └── mod.rs      // Deriv/Integ logic
├── analysis/       // New
│   └── mod.rs      // Peaks, SNR, Deconv
└── fitting/        // New
    └── mod.rs      // Regressions
```
