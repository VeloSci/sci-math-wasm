const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../pkg/web/sci_math_wasm.js');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Core DX Module
const dxModule = `
/**
 * SCI-MATH-WASM Advanced DX Layer - Roadmap Phase 1-7 Mastery
 */

// --- Global State & Config ---
const _config = {
    threads: 'auto',
    debug: false,
    measurePerformance: false,
    useGPU: 'auto',
    onError: null
};

export function configure(options) {
    Object.assign(_config, options);
}

// --- Metrics & Logging ---
const _metrics = {
    ops: [],
    lastExecutionMs: 0,
    gpuAvailable: false,
    poolSize: 0
};

export function getMetrics() { return { ..._metrics }; }

// --- Auto-Initialization (Zero-Config Milestone Q1) ---
let _initPromise = null;
let _isInitialized = false;

async function _ensureInit() {
    if (_isInitialized) return;
    if (!_initPromise) {
        if (_config.debug) console.log('[SciMathWASM] Auto-initializing engine...');
        const { default: init } = await import('./sci_math_wasm.js');
        _initPromise = init();
    }
    await _initPromise;
    _isInitialized = true;
}

// --- Error Handling & Profiling ---
export class MathError extends Error {
    constructor(message, code, context = {}) {
        super(message);
        this.name = 'MathError';
        this.code = code;
        this.context = context;
    }
}

function _logOp(name, start, success = true) {
    const duration = performance.now() - start;
    _metrics.lastExecutionMs = duration;
    if (_config.measurePerformance) {
        _metrics.ops.push({ name, duration, success, timestamp: Date.now() });
    }
    if (_config.debug) {
        console.log('[SciMathWASM] ' + name + ' executed in ' + duration.toFixed(3) + 'ms');
    }
}

// --- DataFrame API (Hito Q2 Beta) ---
export class DataFrame {
    constructor(engine = null, columns = {}) {
        this.engine = engine;
        this.columns = columns; // name -> vectorId
    }

    static async fromCSV(data, options = {}) {
        await _ensureInit();
        const { SciEngine } = await import('./sci_math_wasm.js');
        const engine = new SciEngine();
        const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
        const ids = await engine.importCSV(bytes, options.delimiter || 44, options.skipRows || 0);
        const df = new DataFrame(engine);
        ids.forEach((id, i) => { df.columns["col_" + i] = id; });
        return df;
    }

    head(n = 5) {
        const result = {};
        for (const [name, id] of Object.entries(this.columns)) {
            const ptr = this.engine.get_ptr(id);
            const len = Math.min(n, this.engine.vector_len(id));
            const view = new Float64Array(wasm.memory.buffer, ptr, len);
            result[name] = Array.from(view);
        }
        console.table(result);
        return result;
    }
}
`;

// 2. Wrap original functions to add auto-init and profiling
const wrappedFunctions = [];
content = content.replace(/export function (\w+)\((.*?)\) \{/g, (match, name, args) => {
    if (['init', 'initThreadPool', 'configure', 'getMetrics', 'isWebGPUSupported'].includes(name) || name.startsWith('__')) {
        return match;
    }
    wrappedFunctions.push({name, args});
    return `function _raw_${name}(${args}) {`;
});

let wrappers = '\n// --- DX Discovery Wrappers (Zero-Config) ---\n';
for (const {name, args} of wrappedFunctions) {
    wrappers += `
export async function ${name}(${args}) {
    await _ensureInit();
    const _start = performance.now();
    try {
        const _res = _raw_${name}(${args});
        _logOp('${name}', _start);
        return _res;
    } catch (e) {
        _logOp('${name}', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation ${name} failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }
}
`;
}

// 3. Final Write
fs.writeFileSync(targetFile, dxModule + content + wrappers);
console.log('Successfully applied Roadmap Q1/Q2 Mastery Wrapper.');
