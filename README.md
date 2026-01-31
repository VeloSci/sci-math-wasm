# sci-math-wasm 🧪
<p align="center">
  <img src="docs/public/logo.svg" width="120" alt="SciMath Logo">
</p>

High-performance scientific mathematical functions for the web, powered by Rust and WebAssembly.

## Overview

`sci-math-wasm` provides a robust, typed, and highly optimized set of mathematical tools designed specifically for scientific applications, data analysis, and signal processing in browser environments.

## Features

- **🚀 Performance**: Hand-optimized Rust algorithms compiled to WASM.
- **📈 Analysis**: Regression, Calculus, and Signal Processing (FFT).
- **📊 Statistics**: Mean, median, variance, standard deviation.
- **🔢 Linear Algebra**: Vector and Matrix operations.
- **📐 Math Tools**: Complex numbers, Polynomials, and Trigonometry.
- **📚 Documentation**: Full VitePress site with LaTeX support.

## Documentation

Full documentation is available at [https://velosci.github.io/sci-math-wasm/](https://velosci.github.io/sci-math-wasm/) (locally in `/docs`).

## Installation

```bash
npm install sci-math-wasm
# or
pnpm add sci-math-wasm
```

## Usage

```typescript
import init, { mean, fft, magnitude } from 'sci-math-wasm';

async function run() {
    await init();
    
    const data = new Float64Array([1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0]);
    
    // Statistics
    const avg = mean(data);
    console.log(`Mean: ${avg}`);
    
    // Signal Processing
    const spectrum = fft(data);
    const mags = magnitude(spectrum);
    console.log('Frequencies:', mags);
}

run();
```

## Modules

- `basic`: Fundamental arithmetic and utilities.
- `stats`: Statistical analysis tools.
- `linalg`: Linear algebra (Vectors & Matrices).
- `signal`: Advanced signal processing (FFT).

## Development

### Build
Requires `rust` and `wasm-pack`.

```bash
wasm-pack build --target web
```

### Documentation
```bash
cargo doc --open
```

## License

MIT © [VeloSci](https://github.com/VeloSci)
