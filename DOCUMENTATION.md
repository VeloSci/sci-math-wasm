# Documentation Standard - sci-math-wasm

All functions in this library follow a strict documentation standard to ensure clarity, mathematical correctness, and ease of use in WebAssembly environments.

## Documentation Template

Every exported function MUST include:

1.  **Summary Line**: A brief description of what the function does.
2.  **Mathematical Formula**: Using LaTeX syntax.
    - Inline: `$ formula $`
    - Block: `$$ formula $$`
3.  **Arguments**: Detailed description of parameters.
4.  **Returns/Errors**: Expected output and potential error cases.
5.  **Complexity**: Big O notation for time/space complexity (e.g., $O(n \log n)$).
6.  **Example**: Usage code snippets in TypeScript.

## Example

```rust
/// Linear interpolation between two values.
/// 
/// The formula used is:
/// $$ f(a, b, t) = a + t \cdot (b - a) $$
/// 
/// # Arguments
/// * `a` - Start value.
/// * `b` - End value.
/// * `t` - Interpolation factor (0.0 to 1.0).
/// 
/// # Complexity
/// $O(1)$
#[wasm_bindgen]
pub fn lerp(a: f64, b: f64, t: f64) -> f64 { ... }
```

## Rendering Formulae

Since standard `rustdoc` does not render LaTeX natively, we recommend using `rustdoc-katex-demo` or integrating the generated docs with a VitePress/Docusaurus site that handles KaTeX rendering.

For local development viewing:
```bash
# You can use tools like RUSTDOCFLAGS to inject KaTeX
RUSTDOCFLAGS="--html-in-header katex-header.html" cargo doc --no-deps --open
```
