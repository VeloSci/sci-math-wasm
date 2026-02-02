# Examples

This directory contains practical examples and simulations demonstrating the capabilities of sci-math-wasm.

## Performance Comparison

**File**: [`performance-comparison.ts`](./performance-comparison.ts)

Compares the performance of sci-math-wasm's IO module against pure TypeScript implementations.

### What it tests:
1. **Small CSV parsing** (10K rows) - Basic performance
2. **Large CSV parsing** (100K rows) - Memory and throughput
3. **MPT file processing** - Real-world scientific format with headers
4. **Format detection** - Auto-detection capabilities

**Note**: The interactive benchmarks at `/bench` now also include these IO performance tests alongside the existing mathematical computation benchmarks.

### How to run:
```bash
# Build the WASM package first
pnpm wasm:build:web

# Run the simulation
node examples/performance-comparison.ts
```

### Expected Results:
Typically 2-5x performance improvement for WASM over pure TypeScript, depending on:
- File size and complexity
- Hardware specifications
- Browser/Node.js version

## Interactive Examples

### File Processing Demo

**File**: [`file-processing-demo.html`](./file-processing-demo.html)

A complete web-based demo showing real-time file processing with drag-and-drop support.

**Features**:
- Drag & drop file upload
- Auto format detection
- Real-time processing statistics
- Data preview and analysis
- Performance metrics

**How to run**:
```bash
# Build WASM first
pnpm wasm:build:web

# Serve the examples directory
npx serve .

# Open in browser
# http://localhost:3000/examples/file-processing-demo.html
```

### Web Worker Example

Coming soon: Background processing for large files without blocking the UI.
