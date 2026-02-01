# Implementation Plan - Phases 3 & 4: Analysis & Fitting

This plan details the implementation of advanced Signal Processing and Data Fitting modules in `sci-math-wasm`.

## User Review Required
> [!IMPORTANT]
> This is a massive update. We will implement multiple complex algorithms: Savitzky-Golay, Peak Detection, Linear/Poly Regression, and Levenberg-Marquardt.
>
> We will strictly follow the **"Unsafe Pointers + Loop Unrolling"** optimization strategy to ensure WASM outperforms V8's JIT.

## Proposed Changes

### 1. `src/analysis/mod.rs` (Signal Processing)
*   **Smoothing**: Implement `savitzky_golay` filter.
    *   *Strategy*: Pre-compute coefficients for fixed window sizes (e.g., 5, 7, 9) or solve convolution on the fly. For performance, we'll implement a fast convolution kernel.
*   **Peak Detection**: Implement `find_peaks`.
    *   *Algorithm*: Simple local maxima check `y[i-1] < y[i] > y[i+1]` + `threshold` + `prominence` (simplified).
*   **Baseline Correction**: Implement `baseline_als` (Asymmetric Least Squares Smoothing).
    *   *Note*: Requires solving a sparse linear system. We might simplify this to a rolling minimum or polynomial subtraction for this iteration if a sparse solver is too heavy. -> *Decision*: We'll implement a **Polish Polynomial** baseline removal (iterative fitting) as it reuses the Fitting module.

### 2. `src/fitting/mod.rs` (Data Fitting)
*   **Linear Algebra Helper**: We need a solver for $Ax = b$.
    *   *Implementation*: Gauss-Jordan elimination for small/medium systems (sufficient for PolyFit order < 10).
*   **Linear Regression**: `fit_linear(x, y) -> (slope, intercept, r2)`.
    *   *Optimization*: Single pass accumulation.
*   **Polynomial Fitting**: `fit_poly(x, y, order) -> coeffs`.
    *   *Algorithm*: Construct Normal Equations ($X^T X \beta = X^T y$) and solve.
*   **Non-Linear Fitting**: `fit_levenberg_marquardt`.
    *   *Target*: Fit a sum of Gaussians (common in spectroscopy).
    *   *Algorithm*: Damped Least Squares loop.

### 3. `src/engine.rs` (Public API)
*   Expose new methods:
    *   `smooth_savitzky_golay(id, window, order)`
    *   `detect_peaks(id, threshold)`
    *   `fit_linear(x_id, y_id)`
    *   `fit_poly(x_id, y_id, order)`

### 4. `bench.worker.ts`
*   Add benchmarks:
    *   `Analysis (Peaks + Smooth 1M)`
    *   `Fitting (PolyFit Order 5)`

## Verification Plan

### Automated Tests
*   `tests/wasm.spec.ts`: Add test cases for each new function.
    *   Verify PolyFit accuracy against known equations (e.g., $y = 2x^2 + 3x + 1$).
    *   Verify Peak Detection on generated gaussian data.

### Benchmarks
*   Run the full suite. Target:
    *   Fitting: > 2x vs JS (Matrix inversion in WASM should win).
    *   Analysis: > 1.5x vs JS (Pointer scanning).
