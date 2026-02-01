# JS vs WASM Implementation

SciMath provides two implementations of its core algorithms: a pure JavaScript/TypeScript version and a WebAssembly (WASM) version. Both share the same API structure, allowing for easy switching based on your environment and performance needs.

## When to use WASM?

The WebAssembly implementation is written in Rust and compiled to WASM. It is generally faster for heavy computational tasks, especially when dealing with large datasets or complex algorithms like FFT, matrix multiplications, and curve fitting.

**Pros:**
- **High Performance:** Near-native speed for numerical operations.
- **Parallelism:** Utilizes multi-threading (via Web Workers and SharedArrayBuffer) for operations like FFT and large matrix formatting.
- **Memory Efficiency:** Better memory management for large arrays.

**Cons:**
- **Initialization:** Requires async loading (`initThreads`, `init`).
- **Overhead:** Small overhead for data transfer between JS and WASM (though minimized using typed arrays).
- **Environment:** Requires a customized build process (like Vite-plugin-wasm) for optimal integration.

## When to use JS/TS?

The pure JS implementation is a direct port of the logic to TypeScript. It runs natively in any JS environment without additional setup.

**Pros:**
- **Ease of Use:** No async initialization or build tooling required. Works out of the box.
- **Compatibility:** Runs everywhere JavaScript runs (older browsers, simple scripts, etc.).
- **Debugging:** Easier to debug step-by-step in browser dev tools.

**Cons:**
- **Performance:** Slower than WASM for heavy number crunching.
- **Single-threaded:** Runs on the main thread (unless manually moved to a worker), which can block UI for very large calculations.

## API Parity

We strive for 100% API parity between the two versions.

### Example: Linear Regression

**WASM:**
```typescript
import * as wasm from 'sci-math-wasm';

const x = new Float64Array([1, 2, 3]);
const y = new Float64Array([2, 4, 6]);
const result = wasm.fit_linear(x, y);
console.log(result.slope); // 2
```

**JS:**
```typescript
import { SciMathJS } from 'sci-math-wasm';

const x = [1, 2, 3];
const y = [2, 4, 6];
const result = SciMathJS.fitLinear(x, y);
console.log(result.slope); // 2
```

> [!NOTE]
> The WASM API uses `snake_case` for function names (Rust convention), while the JS API uses `camelCase`.
