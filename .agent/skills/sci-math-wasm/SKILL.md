---
name: sci-math-wasm
description: High-performance scientific mathematical functions for WebAssembly
---

# Sci-Math-WASM Skill

This skill enables agents to leverage and extend **sci-math-wasm**, a critical library written in Rust and compiled to WebAssembly, providing native-speed calculations and massive file parsing for the web ecosystem.

## Quick Start (JS/TS Wrapper)

To utilize existing mathematical functions in the browser:

```typescript
import init, { standard_deviation, fft } from '@velo-sci/sci-math-wasm';

async function performMath() {
    // 1. Initialize the WASM module
    await init();
    
    // 2. Prepare Data (Must be a TypedArray)
    const data = new Float64Array([10.5, 23.1, 44.2, 11.0, 9.8]);
    
    // 3. Execute synchronous WASM function
    const stdDev = standard_deviation(data);
    const spectrum = fft(data);
    
    console.log(`SD: ${stdDev}`, spectrum);
}
```

## Core Concepts

- **Rust Foundation**: All logic is written in Rust (`src/` folder) taking advantage of crates like `nalgebra` for matrices and `rayon` for WebAssembly threads.
- **WASM-Bindgen Boundary**: The boundary between JS and Rust is strict. Data crosses the boundary as `Float64Array` mapping directly to memory slices (`&[f64]`).
- **Memory Safety & Zero-Copy**: Avoid copying large arrays back and forth. Passing a slice to Rust is instant. Sending deeply nested JSON objects is extremely slow via serialization.
- **SIMD Streaming IO**: Contains a deeply optimized CSV parser using `memchr` capable of chewing through gigabytes of text in the browser.

## Guidelines for Agents

1. **Binding Constraints**: DO NOT map complex JS objects or structs across the `#[wasm_bindgen]` barrier. Keep inputs flat (`&[f64]`, `&[u8]`, `u32`, `f64`). 
2. **Algorithm Additions**: If tasked with writing a new Heavy Math Algorithm (e.g. eigenvalue decomposition), MUST write it in Rust (`src/linalg.rs`) and expose it to JS. DO NOT write it in JS.
3. **Array Flattening**: Since matrices cannot be passed as `[][]` easily through WASM, flatten them to a 1D `Float64Array` and pass the `rows/cols` dimensions as separate `u32` arguments.
4. **No NPM Sub-Package Mappings**: When adding functions, you don't need to manually update typescript declaration files; `wasm-pack` build script auto-generates `/pkg/web/sci_math_wasm.d.ts`.

## Synthesis of Possibilities

- **High-Speed File IO**: Parsing `.csv`, `.dat`, `.mpt` into memory-safe TypedArrays.
- **Calculus**: Integrations, derivatives, and spline interpolations.
- **Linear Algebra**: Matrix inversion, dot products, system solving.
- **Signal Processing**: Fast Fourier Transforms (FFT), butterworth filters, noise reduction.
- **Statistics**: Linear Regression, Levenberg-Marquardt fitting (via proxy).

## Agent Implementation Checklist

When tasked with expanding `sci-math-wasm`:
1. **Rust Environment**: Ensure your logic operates within the constraints of `wasm32-unknown-unknown` standard library.
2. **Library Crates**: Utilize `nalgebra` for math and `rayon` (via `par_iter()`) for loops where applicable.
3. **Macro Wrapping**: Wrap the new function with `#[wasm_bindgen]`.
4. **Tests first**: Write Rust-native tests (`#[test]`) inside `.rs` files or `/tests/` folder to verify math without needing to compile WebAssembly every time.
5. **Compilation**: Execute the WASM build to pipe the changes to the React/Vue consumers.

## Comprehensive Guides
- [Memory Handling & Zero-Copy Boundaries](./resources/memory-handling.md)
- [SIMD Parsing & Streaming IO](./resources/simd-parsing.md)

## Practical Examples
- [Stateful Rust Filter Binding](./examples/rust-binding.rs)
- [Rust Multi-Dimensional Matrices](./examples/rust-matrix.rs)
- [WebWorker Init Sequence](./examples/js-worker.ts)

## Developer Tools
- `scripts/scaffold-math.sh <name>`: Boots a new math module wrapper.
