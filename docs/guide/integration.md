# Integration Guide

This guide details how to integrate the high-performance `sci-math-wasm` module into your own project, ensuring full multi-threading support via `SharedArrayBuffer` (V13 Hyper-Parallel mode).

## 1. Security Headers (CRITICAL)

To enable multi-threading in browsers (`SharedArrayBuffer`), your page must be **Cross-Origin Isolated**. You must configure your server to send these headers:

```http
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

### Vite Configuration (`vite.config.ts`)

```typescript
export default {
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  preview: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  optimizeDeps: {
    // Exclude the package from pre-bundling to ensure workers load correctly
    exclude: ['@velo-sci/sci-math-wasm']
  }
}
```

## 2. Dependencies

We recommend using the following plugins if you are using Vite:

```bash
npm install -D vite-plugin-wasm vite-plugin-top-level-await
```

## 3. Initialization Sequence

The initialization sequence is specific because of the multi-threading requirement. You must initialize the module **and** the thread pool before use.

```typescript
import init, { initThreadPool, SciEngine } from '@velo-sci/sci-math-wasm';

async function startEngine() {
    // 1. Initialize the WASM module
    await init();

    // 2. Initialize the Thread Pool
    // Use navigator.hardwareConcurrency to utilize all available cores
    const threads = navigator.hardwareConcurrency || 4;
    await initThreadPool(threads);

    console.log(`Engine initialized with ${threads} threads.`);

    // 3. Create the Engine instance
    const engine = new SciEngine();
    
    // 4. Zero-Copy Workflow (Crucial for Performance)
    // Instead of copying data back and forth, you access the WASM memory directly.
    const size = 1_000_000;
    const inputId = engine.create_vector(size); // returns a unique ID
    const outputId = engine.create_vector(size);
    
    // Get pointers to WASM memory
    const ptrIn = engine.get_ptr(inputId);
    const ptrOut = engine.get_ptr(outputId);
    
    // Create TypedArrays that use the WASM memory buffer
    const { memory } = await import('@velo-sci/sci-math-wasm');
    const inputBuffer = new Float64Array(memory.buffer, ptrIn, size);
    const outputBuffer = new Float64Array(memory.buffer, ptrOut, size);
    
    // Now you can fill inputBuffer from JS and run engine methods
    inputBuffer.set(myLargeData);
    
    // Run an in-place/memory-to-memory operation
    engine.smooth_sg(inputId, outputId, 11, 2);
    
    // Result is directly available in outputBuffer!
    console.log(outputBuffer[0]);
}
```

### Why use `SciEngine`?
While the top-level functions (like `smoothSG(data, ...)`) are convenient, they involve **copying** data from JavaScript to WASM and then back. 

The `SciEngine` class allows you to:
1. **Pre-allocate** memory once.
2. **Reuse** buffers across multiple operations (e.g., `smooth` -> `remove_baseline` -> `fft`).
3. **Zero-Copy**: Access results directly from the WASM linear memory heap.

## 4. Performance Insights (V13)

The engine uses **Adaptive Parallelism** to maximize throughput while minimizing overhead:

- **Sequential Fallback**: If YOUR dataset is small (e.g., < 32k points for Signal Processing), the engine will automatically run sequentially. This is intentional to avoid the ~10-20ms overhead of thread synchronization.
- **Massive Chunking**: For large datasets (1M+ points), the engine uses massive chunking (up to 250k items per task) to maximize cache locality and multi-core utility.
- **SIMD Acceleration**: Most arithmetic kernels are SIMD-powered. Ensure your target browser supports WebAssembly SIMD (Modern Chrome, Firefox, Edge, Safari 16.4+).

## 6. Troubleshooting

### `DataCloneError: SharedArrayBuffer transfer requires self.crossOriginIsolated`

This is the most common error when working with the engine. It happens because browsers require a **Secure Context** and specific **Isolation Headers** to allow memory sharing between threads.

#### 1. Check Security Headers
Ensure your server is sending these headers:
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`

#### 2. Local Development
If using Vite, ensure your `vite.config.ts` includes the headers in both `server` and `preview` sections (see [Section 1](#1-security-headers-critical)).

#### 3. Secure Context (HTTPS)
`SharedArrayBuffer` is only available in [Secure Contexts](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts). This means:
- `http://localhost` is considered secure.
- Any other domain **MUST** use `https://`.

#### 4. SharedArrayBuffer Support
Check if the browser supports it by running this in the console:
```javascript
typeof SharedArrayBuffer !== 'undefined' && crossOriginIsolated
```
If this returns `false`, the engine will fail to initialize the thread pool.
