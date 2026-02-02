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
- **📁 File I/O**: Scientific data parsing (CSV, Excel, DAT, MPT) with auto-detection.
- **📐 Math Tools**: Complex numbers, Polynomials, and Trigonometry.
- **📚 Documentation**: Full VitePress site with LaTeX support.

## Documentation

Full documentation is available at [https://velosci.github.io/sci-math-wasm/](https://velosci.github.io/sci-math-wasm/) (locally in `/docs`).

Interactive benchmarks comparing WASM vs JavaScript performance for both mathematical computations and file processing are available at the `/bench` route.

## Installation

```bash
npm install sci-math-wasm
# or
pnpm add sci-math-wasm
```

## Usage

```typescript
import init, { mean, fft, magnitude, TextStreamer, sniffFormat } from 'sci-math-wasm';

async function run() {
    await init();
    
    // === Mathematical Operations ===
    const data = new Float64Array([1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0]);
    
    // Statistics
    const avg = mean(data);
    console.log(`Mean: ${avg}`);
    
    // Signal Processing
    const spectrum = fft(data);
    const mags = magnitude(spectrum);
    console.log('Frequencies:', mags);
    
    // === File Processing ===
    // Auto-detect file format
    const fileHeader = new Uint8Array(await file.slice(0, 2048).arrayBuffer());
    const hint = sniffFormat(fileHeader);
    
    if (!hint.isBinary) {
        // Process text-based scientific files
        const streamer = new TextStreamer()
            .setDelimiter(hint.delimiter)
            .setSkipLines(hint.skipLines)
            .setCommentChar(hint.commentChar);
        
        // Stream processing for large files
        const reader = file.stream().getReader();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const rows = streamer.processChunk(value);
            // Process rows incrementally
        }
    }
}

run();
```

## Modules

- `basic`: Fundamental arithmetic and utilities.
- `stats`: Statistical analysis tools.
- `linalg`: Linear algebra (Vectors & Matrices).
- `signal`: Advanced signal processing (FFT).
- `io`: Scientific file parsing (CSV, Excel, DAT, MPT) with auto-detection.

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
