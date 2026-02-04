const fs = require('fs');
const path = require('path');
const WASM_THRESHOLD = 1000;

function jsMean(data) {
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i];
    return sum / data.length;
}

/**
 * Hybrid Mean implementation
 */
function mean(data) {
    if (data.length < WASM_THRESHOLD) return jsMean(data);
    return wasm.mean(data);
}

const targetFile = path.join(__dirname, '../pkg/web/sci_math_wasm.js');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Core DX Module
const dxModule = `
/**
 * SCI-MATH-WASM Advanced DX Layer
 * Implements Roadmap Phases 1-7
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
    gpuAvailable: false
};

export function getMetrics() { return { ..._metrics }; }

// --- WebGPU Detection (Phase 7) ---
export async function isWebGPUSupported() {
    if (typeof navigator === 'undefined' || !navigator.gpu) return false;
    try {
        const adapter = await navigator.gpu.requestAdapter();
        _metrics.gpuAvailable = !!adapter;
        return !!adapter;
    } catch (e) {
        return false;
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

// --- Error Handling ---
export class MathError extends Error {
    constructor(message, code, context = {}) {
        super(message);
        this.name = 'MathError';
        this.code = code;
        this.context = context;
    }
}

// --- Auto-Initialization REMOVED ---
// The auto-initialization was causing circular imports in workers
// Users must manually call init() before using the library

// --- DataFrame API ---
export class DataFrame {
    constructor(engine = null, columns = {}) {
        this.engine = engine;
        this.columns = columns; // name -> vectorId
    }

    static async fromCSV(data, options = {}) {
        const { SciEngine, detectDelimiter, detectHeaderLines } = await import('./sci_math_wasm.js');
        
        const engine = new SciEngine();
        const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
        
        const delimiter = options.delimiter || await detectDelimiter(bytes.slice(0, 4096));
        const skip = options.skipRows || await detectHeaderLines(bytes.slice(0, 4096));
        
        const ids = await engine.importCSV(bytes, delimiter, skip);
        const df = new DataFrame(engine);
        
        ids.forEach((id, i) => {
            const name = "col_" + i;
            engine.set_column_name(id, name);
            df.columns[name] = id;
        });
        
        return df;
    }

    static async fromNPY(bytes) {
        const { read_npy } = await import('./sci_math_wasm.js');
        return read_npy(bytes);
    }

    select(cols) {
        const newCols = {};
        cols.forEach(c => { if (this.columns[c]) newCols[c] = this.columns[c]; });
        return new DataFrame(this.engine, newCols);
    }
}

// --- Framework Hooks Placeholder ---
export function useMath() { console.warn('Import from @velo-sci/sci-math-react for full hook support.'); }
`;

// 2. Wrap exported functions
const functionRegex = /export function (\w+)\((.*?)\) \{/g;
content = content.replace(functionRegex, (match, name, args) => {
    if (['init', 'initThreadPool', 'configure', 'getMetrics', 'isWebGPUSupported'].includes(name) || name.startsWith('__')) {
        return match;
    }
    return `export async function ${name}(${args}) { 
    const _start = performance.now();
    try {
        const _res = wasm.${name}(${args});
        _logOp('${name}', _start);
        return _res;
    } catch (e) {
        _logOp('${name}', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }
`;
});

// 3. Write final file
fs.writeFileSync(targetFile, dxModule + content);
console.log('Successfully applied Roadmap Phases 1-7 Mastery Wrapper.');
