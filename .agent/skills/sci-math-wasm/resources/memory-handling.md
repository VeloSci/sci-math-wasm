---
description: Passing large data safely across the boundary
---
# Memory Handling Guide

The cost of calling WebAssembly from JavaScript is virtually zero, **unless you format the data incorrectly**.

## The Serialization Bottleneck
If you pass a complex object (like `Array<Object>` or nested Arrays) to `#[wasm_bindgen]`, the JS engine uses `serde_wasm_bindgen` to serialize it to JSON, passes the string to Rust, and Rust parses the JSON. This completely destroys performance for scientific arrays.

## The Zero-Copy approach
Always pass a TypedArray directly to a `&[f64]` or `&mut [u8]` parameter.
`wasm-bindgen` will instantly resolve the pointer to the underlying continuous memory slice in the WebAssembly Linear Memory.

### Rust View
```rust
#[wasm_bindgen]
pub fn compute_fast(data: &[f64]) -> Vec<f64> { ... }
```

### JS View
```javascript
// Good
const data = new Float64Array(1000000);
compute_fast(data); 

// BAD! Will trigger a massive hidden conversion loop
const badData = Array.from(data);
compute_fast(badData);
```
