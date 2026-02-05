// Playground Worker - Matches Bench Worker pattern for stability
let wasmModule: any;
let wasm: any;

async function initWasm() {
    try {
        // Use the same pattern as bench.worker.ts
        wasmModule = await import('@wasm/sci_math_wasm');
        wasm = await wasmModule.default();
        console.log("WASM Initialized in Playground Worker");
        return true;
    } catch (e) {
        console.error("WASM Init Failed in Playground Worker:", e);
        return false;
    }
}

let initPromise: Promise<boolean> | null = null;

self.onmessage = async (e) => {
    const { type, code } = e.data;
    if (type === 'execute') {
        if (!initPromise) initPromise = initWasm();
        const success = await initPromise;
        
        if (!success) {
            self.postMessage({ type: 'error', data: "Failed to initialize WASM engine" });
            return;
        }

        // Custom console.log to send messages back to the main thread
        const customConsole = {
            log: (...args: any[]) => {
                const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
                self.postMessage({ type: 'log', data: msg });
            },
            error: (...args: any[]) => {
                const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
                self.postMessage({ type: 'error', data: msg });
            }
        };

        try {
            console.log("Playing with code:", code);
            // Create a function from the code string
            // We inject SciMathJS (the wrapper API) into the scope
            // Users can also access the raw 'wasm' exports if needed
            const fn = new Function('SciMathJS', 'wasm', 'console', `
                const __run = async () => {
                    ${code}
                };
                return __run();
            `);

            // SciMathJS in worker context refers to the exported module (DX layer)
            const result = await fn(wasmModule, wasm, customConsole);
            self.postMessage({ type: 'result', data: result || null });
        } catch (err: any) {
            self.postMessage({ type: 'error', data: err.message || String(err) });
        }
    }
};
