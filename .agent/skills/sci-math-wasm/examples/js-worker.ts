// src/workers/math.worker.ts
import init, { solve_linear_system, standard_deviation } from '@velo-sci/sci-math-wasm';

// Ensure WASM is initialized globally in the worker scope before accepting messages
let wasmReady = init();

self.addEventListener('message', async (e) => {
    await wasmReady; // Wait for WASM to compile
    
    const { action, payload, jobId } = e.data;
    
    try {
        if (action === 'SOLVE_SYSTEM') {
            const { flatMatrix, rows, cols, vector } = payload;
            // Execute Rust fn
            const result = solve_linear_system(flatMatrix, rows, cols, vector);
            self.postMessage({ jobId, status: 'success', data: result });
        }
    } catch (err) {
        self.postMessage({ jobId, status: 'error', error: String(err) });
    }
});
