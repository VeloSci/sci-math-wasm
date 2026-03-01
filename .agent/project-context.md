---
description: Context & Overview of the sci-math-wasm library for AI Agents
---
# AI SYSTEM INSTRUCTION: sci-math-wasm Context

**CRITICAL DIRECTIVE**: You are reading the core documentation for `sci-math-wasm`. This project uses a completely different architecture than the React/Vue frontend apps. It is a Rust codebase compiled to WebAssembly (WASM).

## 1. Project Definitions
- **Project Goal**: High-performance mathematical operations (Calculus, Signal Processing, Linear Algebra) and Scientific File I/O parsing, brought to the browser natively via WASM.
- **Languages**: Rust (Primary) and TypeScript (Glue code).
- **Compilation Targets**: `wasm32-unknown-unknown`. It produces both `pkg/web` and `pkg/node` targets.

## 2. Core Library Structure
The repository is a standard Rust application:

### `src/` (Rust Source)
- **`lib.rs`**: Main WASM bindgen entrypoint.
- Modules: `basic`, `stats`, `linalg`, `signal` (FFT), `io` (CSV, DAT memory-safe parsing).
- **Memory Paradigm**: Operations take contiguous arrays `&[f64]` and return `Vec<f64>` which are automatically mapped to JavaScript `Float64Array`.

### `pkg/` (Generated)
- This is the output of `wasm-pack`. **DO NOT modify files inside `pkg/`**. They are auto-generated JS bindings and `.wasm` binaries.

### `scripts/`
- Tooling to fix WASM worker compatibilities for Vite.

## 3. Operational Boundaries (Do NOT do this)
- **DO NOT write performance-critical math in JS**: If you are tasked to add a mathematical function (e.g., Matrix Inversion) to this repo, write it in Rust under `src/linalg/` and expose it via `#[wasm_bindgen]`.
- **DO NOT return deeply nested structs if possible**: WASM serialization is expensive. Prefer passing flat `Float64Array` buffers over passing complex arrays of JS Objects.
- **DO NOT use JS built-in fetch in Rust**: The library is pure computation. Keep I/O fetching in JS, pass the resulting `ArrayBuffer` or `Uint8Array` to Rust for processing.
