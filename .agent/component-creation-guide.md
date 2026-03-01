---
description: Guide on how to add functions and parse bindings in sci-math-wasm for AI Agents
---
# AI SYSTEM INSTRUCTION: Function Creation Guide

**CRITICAL DIRECTIVE**: Follow these exact steps when adding mathematical operations or parsers to `sci-math-wasm`.

---

## TASK A: Exposing a Mathematical Function to JS

If a user needs to compute something missing from JS Math (e.g., standard deviation over arrays), write it in Rust.

### Step 1: Implement the Logic
Go to the corresponding module (`src/stats.rs` or `src/linalg.rs`).
Use the `#[wasm_bindgen]` macro.

**Rules for Math Bindings:**
- Accept `&[f64]` slices for data (zero-copy memory access from JS).
- Return `Vec<f64>` or `f64`.
- Use `.iter()` or `.par_iter()` (if rayon is enabled) for vector loops.

**Reference Implementation:**
```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn standard_deviation(data: &[f64]) -> f64 {
    if data.is_empty() { return f64::NAN; }
    
    let sum: f64 = data.iter().sum();
    let mean = sum / data.len() as f64;
    
    let variance: f64 = data.iter()
        .map(|value| {
            let diff = mean - *value;
            diff * diff
        })
        .sum::<f64>() / data.len() as f64;
        
    variance.sqrt()
}
```

### Step 2: Build the Bindings
After adding the function, run `npm run wasm:build`. The output will automatically expose this function into `/pkg/web/sci_math_wasm.d.ts` as `export function standard_deviation(data: Float64Array): number;`.

---

## TASK B: Creating Complex IO Streaming

If you are asked to parse a new scientific file format (e.g., `.cdf` or binary datasets):

### Step 1: Handle Byte Steaming
Do not parse strings. Parse binary chunks. Define a parser structure inside `src/io/`.
```rust
use wasm_bindgen::prelude::*;
use js_sys::Uint8Array;

#[wasm_bindgen]
pub struct CustomBinaryParser {
    // state (e.g., current_offset)
}

#[wasm_bindgen]
impl CustomBinaryParser {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        CustomBinaryParser {}
    }

    // JS passes a chunky chunk of Uint8Array buffer
    #[wasm_bindgen(js_name = processChunk)]
    pub fn process_chunk(&mut self, chunk: &[u8]) -> Vec<f64> {
         // Perform SIMD byte scanning or structure unwrapping
         vec![]
    }
}
```

### Step 2: Test the Implementation
Write a test in `/tests/io_test.rs` handling a mock byte payload before attempting to compile down to JS tests.
