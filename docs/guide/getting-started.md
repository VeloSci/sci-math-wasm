# Getting Started

Learn how to integrate `sci-math-wasm` into your project.

## Installation

```bash
npm install sci-math-wasm
# or
pnpm add sci-math-wasm
```

## Initialization

Since the library is a WebAssembly module, it must be initialized before use.

```typescript
import init, { mean, fft } from 'sci-math-wasm'

async function setup() {
  // Initialize the WASM module
  await init()
  
  // Now you can use the functions
  const data = new Float64Array([1, 2, 3, 4, 5, 6, 7, 8])
  console.log('Average:', mean(data))
}

setup()
```

## Core Concepts

### Memory Management
The library uses `Float64Array` (equivalent to Rust's `f64`) for most operations. Passing large buffers between JS and Rust is efficient because WASM shares linear memory.

### Data Types
- **Slices**: Most functions take `&[f64]` which maps to `Float64Array` in JS.
- **Results**: Functions that can fail return a `Result`, which throws an error in JS.
- **Complex Numbers**: Handled via a special `Complex` class.

## Browser Support
Requires a browser with WebAssembly support (all modern browsers since 2017).
