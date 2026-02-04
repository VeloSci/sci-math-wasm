# Implementation Plan - Phases 3 & 4: Analysis & Fitting [COMPLETED]

This plan details the implementation of advanced Signal Processing and Data Fitting modules in `sci-math-wasm`.

## User Review Required
> [!IMPORTANT]
> This is a massive update. We will implement multiple complex algorithms: Savitzky-Golay, Peak Detection, Linear/Poly Regression, and Levenberg-Marquardt.
>
> We will strictly follow the **"Unsafe Pointers + Loop Unrolling"** optimization strategy to ensure WASM outperforms V8's JIT.

## Proposed Changes

### 1. `src/analysis/mod.rs` (Signal Processing)
*   [x] **Smoothing**: Implement `savitzky_golay` filter. (Generalized for any window/degree).
*   [x] **Peak Detection**: Implement `find_peaks`. (Includes Prominence and Threshold).
*   [x] **Baseline Correction**: Implement **Polish Polynomial** baseline removal (iterative fitting).

### 2. `src/fitting/mod.rs` (Data Fitting)
*   [x] **Linear Algebra Helper**: Solver for $Ax = b$ (Gauss-Jordan).
*   [x] **Linear Regression**: `fit_linear(x, y) -> (slope, intercept, r2)`.
*   [x] **Polynomial Fitting**: `fit_poly(x, y, order) -> coeffs`.
*   [x] **Non-Linear Fitting**: `fit_levenberg_marquardt` for Multi-Gaussian support.

### 3. `src/engine.rs` (Public API)
*   [x] Expose new methods:
    *   `smooth_savitzky_golay(id, window, order)`
    *   `detect_peaks(id, threshold, prominence)`
    *   `fit_linear(x_id, y_id)`
    *   `fit_poly(x_id, y_id, order)`
    *   `fit_gaussians(x_id, y_id, initial_params)`
    *   `remove_baseline(id, x_id, order, oid, iters)`

### 4. `bench.worker.ts`
*   [x] Add benchmarks:
    *   `Analysis (Peaks + Smooth 1M)`
    *   `Fitting (PolyFit Order 5)`

## Verification Plan [DONE]

### Automated Tests
*   [x] `tests/wasm.spec.ts` & `tests/engine.spec.ts`: Added test cases for each new function.
    *   [x] Verify PolyFit accuracy.
    *   [x] Verify Peak Detection on generated data.

### Benchmarks
*   [x] Run the full suite. Target:
    *   [x] Fitting: > 2x vs JS.
    *   [x] Analysis: > 1.5x vs JS.
