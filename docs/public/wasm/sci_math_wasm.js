
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
/* @ts-self-types="./sci_math_wasm.d.ts" */
import { startWorkers } from './snippets/wasm-bindgen-rayon-3e04391371ad0a8e/src/workerHelpers.js';

/**
 * Advanced CSV Reader options
 */
export class CSVReaderOptions {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        CSVReaderOptionsFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_csvreaderoptions_free(ptr, 0);
    }
    constructor() {
        const ret = wasm.csvreaderoptions_new();
        this.__wbg_ptr = ret >>> 0;
        CSVReaderOptionsFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {number | undefined}
     */
    get comment_char() {
        const ret = wasm.__wbg_get_csvreaderoptions_comment_char(this.__wbg_ptr);
        return ret === 0xFFFFFF ? undefined : ret;
    }
    /**
     * @returns {number}
     */
    get delimiter() {
        const ret = wasm.__wbg_get_csvreaderoptions_delimiter(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {boolean}
     */
    get has_header() {
        const ret = wasm.__wbg_get_csvreaderoptions_has_header(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {number | undefined}
     */
    get quote_char() {
        const ret = wasm.__wbg_get_csvreaderoptions_quote_char(this.__wbg_ptr);
        return ret === 0xFFFFFF ? undefined : ret;
    }
    /**
     * @param {number | null} [arg0]
     */
    set comment_char(arg0) {
        wasm.__wbg_set_csvreaderoptions_comment_char(this.__wbg_ptr, isLikeNone(arg0) ? 0xFFFFFF : arg0);
    }
    /**
     * @param {number} arg0
     */
    set delimiter(arg0) {
        wasm.__wbg_set_csvreaderoptions_delimiter(this.__wbg_ptr, arg0);
    }
    /**
     * @param {boolean} arg0
     */
    set has_header(arg0) {
        wasm.__wbg_set_csvreaderoptions_has_header(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number | null} [arg0]
     */
    set quote_char(arg0) {
        wasm.__wbg_set_csvreaderoptions_quote_char(this.__wbg_ptr, isLikeNone(arg0) ? 0xFFFFFF : arg0);
    }
}
if (Symbol.dispose) CSVReaderOptions.prototype[Symbol.dispose] = CSVReaderOptions.prototype.free;

/**
 * A complex number with real and imaginary parts.
 */
export class Complex {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Complex.prototype);
        obj.__wbg_ptr = ptr;
        ComplexFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ComplexFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_complex_free(ptr, 0);
    }
    /**
     * Adds another complex number.
     * @param {Complex} other
     * @returns {Complex}
     */
    add(other) {
        _assertClass(other, Complex);
        const ret = wasm.complex_add(this.__wbg_ptr, other.__wbg_ptr);
        return Complex.__wrap(ret);
    }
    /**
     * Creates a complex number from polar coordinates.
     *
     * $$ z = r(\cos \theta + i \sin \theta) $$
     * @param {number} r
     * @param {number} theta
     * @returns {Complex}
     */
    static fromPolar(r, theta) {
        const ret = wasm.complex_fromPolar(r, theta);
        return Complex.__wrap(ret);
    }
    /**
     * Returns the magnitude (norm) of the complex number.
     *
     * $$ |z| = \sqrt{a^2 + b^2} $$
     * @returns {number}
     */
    magnitude() {
        const ret = wasm.complex_magnitude(this.__wbg_ptr);
        return ret;
    }
    /**
     * Multiplies by another complex number.
     *
     * $$ (a + bi)(c + di) = (ac - bd) + (ad + bc)i $$
     * @param {Complex} other
     * @returns {Complex}
     */
    mul(other) {
        _assertClass(other, Complex);
        const ret = wasm.complex_mul(this.__wbg_ptr, other.__wbg_ptr);
        return Complex.__wrap(ret);
    }
    /**
     * @param {number} re
     * @param {number} im
     */
    constructor(re, im) {
        const ret = wasm.complex_new(re, im);
        this.__wbg_ptr = ret >>> 0;
        ComplexFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Returns the phase (argument) in radians.
     * @returns {number}
     */
    phase() {
        const ret = wasm.complex_phase(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get im() {
        const ret = wasm.__wbg_get_complex_im(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get re() {
        const ret = wasm.__wbg_get_complex_re(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set im(arg0) {
        wasm.__wbg_set_complex_im(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set re(arg0) {
        wasm.__wbg_set_complex_re(this.__wbg_ptr, arg0);
    }
}
if (Symbol.dispose) Complex.prototype[Symbol.dispose] = Complex.prototype.free;

export class DataBuffer {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        DataBufferFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_databuffer_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    len() {
        const ret = wasm.databuffer_len(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    mut_ptr() {
        const ret = wasm.databuffer_mut_ptr(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} size
     */
    constructor(size) {
        const ret = wasm.databuffer_new(size);
        this.__wbg_ptr = ret >>> 0;
        DataBufferFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {number}
     */
    ptr() {
        const ret = wasm.databuffer_ptr(this.__wbg_ptr);
        return ret >>> 0;
    }
}
if (Symbol.dispose) DataBuffer.prototype[Symbol.dispose] = DataBuffer.prototype.free;

/**
 * Detected file format information
 */
export class FormatHint {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(FormatHint.prototype);
        obj.__wbg_ptr = ptr;
        FormatHintFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FormatHintFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_formathint_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get commentChar() {
        const ret = wasm.formathint_commentChar(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get confidence() {
        const ret = wasm.formathint_confidence(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get delimiter() {
        const ret = wasm.formathint_delimiter(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {string}
     */
    get format() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.formathint_format(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {boolean}
     */
    get isBinary() {
        const ret = wasm.formathint_isBinary(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {number}
     */
    get skipLines() {
        const ret = wasm.formathint_skipLines(this.__wbg_ptr);
        return ret >>> 0;
    }
}
if (Symbol.dispose) FormatHint.prototype[Symbol.dispose] = FormatHint.prototype.free;

export class GpuContext {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        GpuContextFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_gpucontext_free(ptr, 0);
    }
    /**
     * Checks if WebGPU is supported by the environment.
     * @returns {boolean}
     */
    is_supported() {
        const ret = wasm.gpucontext_is_supported(this.__wbg_ptr);
        return ret !== 0;
    }
    constructor() {
        const ret = wasm.gpucontext_new();
        this.__wbg_ptr = ret >>> 0;
        GpuContextFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
}
if (Symbol.dispose) GpuContext.prototype[Symbol.dispose] = GpuContext.prototype.free;

/**
 * Result structure for a linear regression.
 */
export class LinearRegressionResult {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(LinearRegressionResult.prototype);
        obj.__wbg_ptr = ptr;
        LinearRegressionResultFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LinearRegressionResultFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_linearregressionresult_free(ptr, 0);
    }
    /**
     * Intercept (b)
     * @returns {number}
     */
    get intercept() {
        const ret = wasm.__wbg_get_complex_im(this.__wbg_ptr);
        return ret;
    }
    /**
     * R-squared ($R^2$) value
     * @returns {number}
     */
    get rSquared() {
        const ret = wasm.__wbg_get_linearregressionresult_rSquared(this.__wbg_ptr);
        return ret;
    }
    /**
     * Slope (m)
     * @returns {number}
     */
    get slope() {
        const ret = wasm.__wbg_get_complex_re(this.__wbg_ptr);
        return ret;
    }
    /**
     * Intercept (b)
     * @param {number} arg0
     */
    set intercept(arg0) {
        wasm.__wbg_set_complex_im(this.__wbg_ptr, arg0);
    }
    /**
     * R-squared ($R^2$) value
     * @param {number} arg0
     */
    set rSquared(arg0) {
        wasm.__wbg_set_linearregressionresult_rSquared(this.__wbg_ptr, arg0);
    }
    /**
     * Slope (m)
     * @param {number} arg0
     */
    set slope(arg0) {
        wasm.__wbg_set_complex_re(this.__wbg_ptr, arg0);
    }
}
if (Symbol.dispose) LinearRegressionResult.prototype[Symbol.dispose] = LinearRegressionResult.prototype.free;

export class NpyData {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(NpyData.prototype);
        obj.__wbg_ptr = ptr;
        NpyDataFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NpyDataFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_npydata_free(ptr, 0);
    }
    /**
     * @returns {Float64Array}
     */
    get data() {
        const ret = wasm.npydata_data(this.__wbg_ptr);
        var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
        return v1;
    }
    /**
     * @returns {Uint32Array}
     */
    get shape() {
        const ret = wasm.npydata_shape(this.__wbg_ptr);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
}
if (Symbol.dispose) NpyData.prototype[Symbol.dispose] = NpyData.prototype.free;

export class SciEngine {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SciEngineFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_sciengine_free(ptr, 0);
    }
    /**
     * @param {number} id_in
     * @param {number} id_out
     * @param {number} cutoff
     * @param {number} fs
     */
    butterworth_lp(id_in, id_out, cutoff, fs) {
        const ret = wasm.sciengine_butterworth_lp(this.__wbg_ptr, id_in, id_out, cutoff, fs);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} size
     * @returns {number}
     */
    create_vector(size) {
        const ret = wasm.sciengine_create_vector(this.__wbg_ptr, size);
        return ret >>> 0;
    }
    /**
     * @param {number} size
     * @returns {number}
     */
    create_vector_f32(size) {
        const ret = wasm.sciengine_create_vector_f32(this.__wbg_ptr, size);
        return ret >>> 0;
    }
    /**
     * @param {number} id_in
     * @param {number} factor
     * @param {number} id_out
     */
    decimate(id_in, factor, id_out) {
        const ret = wasm.sciengine_decimate(this.__wbg_ptr, id_in, factor, id_out);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} id_in
     * @param {number} id_kernel
     * @param {number} iterations
     * @param {number} id_out
     */
    deconvolve_rl(id_in, id_kernel, iterations, id_out) {
        const ret = wasm.sciengine_deconvolve_rl(this.__wbg_ptr, id_in, id_kernel, iterations, id_out);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} id_in
     * @param {number} n
     * @returns {number}
     */
    det_lu(id_in, n) {
        const ret = wasm.sciengine_det_lu(this.__wbg_ptr, id_in, n);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return ret[0];
    }
    /**
     * @param {number} id_in
     * @param {number} threshold
     * @param {number} prominence
     * @returns {Uint32Array}
     */
    detect_peaks(id_in, threshold, prominence) {
        const ret = wasm.sciengine_detect_peaks(this.__wbg_ptr, id_in, threshold, prominence);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @param {number} id_in
     * @param {number} id_out
     * @param {number} h
     */
    diff(id_in, id_out, h) {
        const ret = wasm.sciengine_diff(this.__wbg_ptr, id_in, id_out, h);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} re_id
     * @param {number} im_id
     * @param {boolean} inverse
     */
    fft(re_id, im_id, inverse) {
        const ret = wasm.sciengine_fft(this.__wbg_ptr, re_id, im_id, inverse);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} id_x
     * @param {number} id_y
     * @returns {Float64Array}
     */
    fit_exponential(id_x, id_y) {
        const ret = wasm.sciengine_fit_exponential(this.__wbg_ptr, id_x, id_y);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
        return v1;
    }
    /**
     * @param {number} id_x
     * @param {number} id_y
     * @param {Float64Array} initial
     * @returns {Float64Array}
     */
    fit_gaussians(id_x, id_y, initial) {
        const ptr0 = passArrayF64ToWasm0(initial, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.sciengine_fit_gaussians(this.__wbg_ptr, id_x, id_y, ptr0, len0);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
        return v2;
    }
    /**
     * @param {number} id_x
     * @param {number} id_y
     * @returns {Float64Array}
     */
    fit_linear(id_x, id_y) {
        const ret = wasm.sciengine_fit_linear(this.__wbg_ptr, id_x, id_y);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
        return v1;
    }
    /**
     * @param {number} id_x
     * @param {number} id_y
     * @returns {Float64Array}
     */
    fit_logarithmic(id_x, id_y) {
        const ret = wasm.sciengine_fit_logarithmic(this.__wbg_ptr, id_x, id_y);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
        return v1;
    }
    /**
     * @param {number} id_x
     * @param {number} id_y
     * @param {number} order
     * @returns {Float64Array}
     */
    fit_poly(id_x, id_y, order) {
        const ret = wasm.sciengine_fit_poly(this.__wbg_ptr, id_x, id_y, order);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
        return v1;
    }
    /**
     * @param {Function} f
     * @param {Float64Array} bounds
     * @param {number} pop_size
     * @param {number} generations
     * @param {number} mutation_rate
     * @returns {Float64Array}
     */
    genetic_algorithm(f, bounds, pop_size, generations, mutation_rate) {
        const ptr0 = passArrayF64ToWasm0(bounds, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.sciengine_genetic_algorithm(this.__wbg_ptr, f, ptr0, len0, pop_size, generations, mutation_rate);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
        return v2;
    }
    /**
     * @param {string} name
     * @returns {number}
     */
    get_column_id(name) {
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.sciengine_get_column_id(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
    /**
     * @param {number} id
     * @returns {number}
     */
    get_ptr(id) {
        const ret = wasm.sciengine_get_ptr(this.__wbg_ptr, id);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return ret[0] >>> 0;
    }
    /**
     * @param {number} id
     * @returns {number}
     */
    get_ptr_f32(id) {
        const ret = wasm.sciengine_get_ptr_f32(this.__wbg_ptr, id);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return ret[0] >>> 0;
    }
    /**
     * @param {Uint8Array} data
     * @param {number} delimiter
     * @param {number} skip
     * @returns {Uint32Array}
     */
    import_csv(data, delimiter, skip) {
        const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.sciengine_import_csv(this.__wbg_ptr, ptr0, len0, delimiter, skip);
        var v2 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v2;
    }
    /**
     * @param {number} id_in
     * @param {number} h
     * @returns {number}
     */
    integrate(id_in, h) {
        const ret = wasm.sciengine_integrate(this.__wbg_ptr, id_in, h);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return ret[0];
    }
    /**
     * @param {number} id_in
     * @returns {number}
     */
    kurtosis(id_in) {
        const ret = wasm.sciengine_kurtosis(this.__wbg_ptr, id_in);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return ret[0];
    }
    /**
     * @param {number} a_id
     * @param {number} b_id
     * @param {number} o_id
     * @param {number} size
     */
    matmul_unrolled(a_id, b_id, o_id, size) {
        const ret = wasm.sciengine_matmul_unrolled(this.__wbg_ptr, a_id, b_id, o_id, size);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} id_in
     * @returns {number}
     */
    mode(id_in) {
        const ret = wasm.sciengine_mode(this.__wbg_ptr, id_in);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return ret[0];
    }
    /**
     * @param {number} idx
     * @param {number} idy
     * @param {number} idz
     * @param {number} ivx
     * @param {number} ivy
     * @param {number} ivz
     * @param {number} dt
     * @param {number} iters
     */
    nbody_f32_soa(idx, idy, idz, ivx, ivy, ivz, dt, iters) {
        const ret = wasm.sciengine_nbody_f32_soa(this.__wbg_ptr, idx, idy, idz, ivx, ivy, ivz, dt, iters);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    constructor() {
        const ret = wasm.sciengine_new();
        this.__wbg_ptr = ret >>> 0;
        SciEngineFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {number} id_y
     * @param {number} id_x
     * @param {number} order
     * @param {number} id_out
     * @param {number} iters
     */
    remove_baseline(id_y, id_x, order, id_out, iters) {
        const ret = wasm.sciengine_remove_baseline(this.__wbg_ptr, id_y, id_x, order, id_out, iters);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} id_in
     * @param {number} new_len
     * @param {number} id_out
     */
    resample_linear(id_in, new_len, id_out) {
        const ret = wasm.sciengine_resample_linear(this.__wbg_ptr, id_in, new_len, id_out);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} id_in
     * @returns {number}
     */
    skewness(id_in) {
        const ret = wasm.sciengine_skewness(this.__wbg_ptr, id_in);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return ret[0];
    }
    /**
     * @param {number} id_in
     * @param {number} id_out
     * @param {number} window
     * @param {number} degree
     */
    smooth_sg(id_in, id_out, window, degree) {
        const ret = wasm.sciengine_smooth_sg(this.__wbg_ptr, id_in, id_out, window, degree);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} id_in
     * @param {number} n
     * @returns {number}
     */
    trace(id_in, n) {
        const ret = wasm.sciengine_trace(this.__wbg_ptr, id_in, n);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return ret[0];
    }
}
if (Symbol.dispose) SciEngine.prototype[Symbol.dispose] = SciEngine.prototype.free;

export class SymbolicExpr {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(SymbolicExpr.prototype);
        obj.__wbg_ptr = ptr;
        SymbolicExprFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SymbolicExprFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_symbolicexpr_free(ptr, 0);
    }
    /**
     * @param {string} var_name
     * @returns {Function}
     */
    compile(var_name) {
        const ptr0 = passStringToWasm0(var_name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.symbolicexpr_compile(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
    /**
     * @param {string} _var
     * @returns {SymbolicExpr}
     */
    diff(_var) {
        const ptr0 = passStringToWasm0(_var, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.symbolicexpr_diff(this.__wbg_ptr, ptr0, len0);
        return SymbolicExpr.__wrap(ret);
    }
    /**
     * @param {string} var_name
     * @param {number} val
     * @returns {number}
     */
    eval(var_name, val) {
        const ptr0 = passStringToWasm0(var_name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.symbolicexpr_eval(this.__wbg_ptr, ptr0, len0, val);
        return ret;
    }
    /**
     * @param {string} _var
     * @returns {SymbolicExpr}
     */
    integrate(_var) {
        const ptr0 = passStringToWasm0(_var, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.symbolicexpr_integrate(this.__wbg_ptr, ptr0, len0);
        return SymbolicExpr.__wrap(ret);
    }
    /**
     * @param {string} s
     * @returns {SymbolicExpr}
     */
    static parse(s) {
        const ptr0 = passStringToWasm0(s, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.symbolicexpr_parse(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return SymbolicExpr.__wrap(ret[0]);
    }
    /**
     * @returns {SymbolicExpr}
     */
    simplify() {
        const ret = wasm.symbolicexpr_simplify(this.__wbg_ptr);
        return SymbolicExpr.__wrap(ret);
    }
    /**
     * @returns {string}
     */
    to_js_string() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.symbolicexpr_to_js_string(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    to_latex() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.symbolicexpr_to_latex(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) SymbolicExpr.prototype[Symbol.dispose] = SymbolicExpr.prototype.free;

export class TextStreamer {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(TextStreamer.prototype);
        obj.__wbg_ptr = ptr;
        TextStreamerFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TextStreamerFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_textstreamer_free(ptr, 0);
    }
    constructor() {
        const ret = wasm.textstreamer_new();
        this.__wbg_ptr = ret >>> 0;
        TextStreamerFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {Uint8Array} chunk
     * @returns {any}
     */
    processChunk(chunk) {
        const ptr0 = passArray8ToWasm0(chunk, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.textstreamer_processChunk(this.__wbg_ptr, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {Uint8Array} chunk
     * @returns {any}
     */
    processColumnarChunk(chunk) {
        const ptr0 = passArray8ToWasm0(chunk, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.textstreamer_processColumnarChunk(this.__wbg_ptr, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {Uint8Array} chunk
     * @returns {Float64Array}
     */
    processNumericChunk(chunk) {
        const ptr0 = passArray8ToWasm0(chunk, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.textstreamer_processNumericChunk(this.__wbg_ptr, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {number} delimiter
     * @returns {TextStreamer}
     */
    setDelimiter(delimiter) {
        const ptr = this.__destroy_into_raw();
        const ret = wasm.textstreamer_setDelimiter(ptr, delimiter);
        return TextStreamer.__wrap(ret);
    }
    /**
     * @param {number} skip
     * @returns {TextStreamer}
     */
    setSkipLines(skip) {
        const ptr = this.__destroy_into_raw();
        const ret = wasm.textstreamer_setSkipLines(ptr, skip);
        return TextStreamer.__wrap(ret);
    }
}
if (Symbol.dispose) TextStreamer.prototype[Symbol.dispose] = TextStreamer.prototype.free;

/**
 * Allocate input buffer and return pointer for JS to write directly
 * @param {number} size
 * @returns {number}
 */
export async function allocParseBuffer(size) { 
    const _start = performance.now();
    try {
        const _res = wasm.allocParseBuffer(size);
        _logOp('allocParseBuffer', _start);
        return _res;
    } catch (e) {
        _logOp('allocParseBuffer', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ret = wasm.allocParseBuffer(size);
    return ret >>> 0;
}

/**
 * Calculates the auto-correlation of a signal - Parallel
 * @param {Float64Array} data
 * @returns {Float64Array}
 */
export async function autoCorrelation(data) { 
    const _start = performance.now();
    try {
        const _res = wasm.autoCorrelation(data);
        _logOp('autoCorrelation', _start);
        return _res;
    } catch (e) {
        _logOp('autoCorrelation', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.autoCorrelation(ptr0, len0);
    var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v2;
}

/**
 * Pressure conversion: Bar to Pascal.
 * @param {number} bar
 * @returns {number}
 */
export async function barToPascal(bar) { 
    const _start = performance.now();
    try {
        const _res = wasm.barToPascal(bar);
        _logOp('barToPascal', _start);
        return _res;
    } catch (e) {
        _logOp('barToPascal', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ret = wasm.barToPascal(bar);
    return ret;
}

/**
 * Batch Normalization (Inference mode)
 * @param {Float64Array} x
 * @param {Float64Array} mean
 * @param {Float64Array} _var
 * @param {Float64Array} gamma
 * @param {Float64Array} beta
 * @param {number} epsilon
 * @returns {Float64Array}
 */
export async function batchNorm(x, mean, _var, gamma, beta, epsilon) { 
    const _start = performance.now();
    try {
        const _res = wasm.batchNorm(x, mean, _var, gamma, beta, epsilon);
        _logOp('batchNorm', _start);
        return _res;
    } catch (e) {
        _logOp('batchNorm', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(x, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArrayF64ToWasm0(mean, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passArrayF64ToWasm0(_var, wasm.__wbindgen_malloc);
    const len2 = WASM_VECTOR_LEN;
    const ptr3 = passArrayF64ToWasm0(gamma, wasm.__wbindgen_malloc);
    const len3 = WASM_VECTOR_LEN;
    const ptr4 = passArrayF64ToWasm0(beta, wasm.__wbindgen_malloc);
    const len4 = WASM_VECTOR_LEN;
    const ret = wasm.batchNorm(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4, epsilon);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v6 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v6;
}

/**
 * @param {Float64Array} data
 * @param {number} cutoff
 * @param {number} fs
 * @returns {Float64Array}
 */
export async function butterworthLowpass(data, cutoff, fs) { 
    const _start = performance.now();
    try {
        const _res = wasm.butterworthLowpass(data, cutoff, fs);
        _logOp('butterworthLowpass', _start);
        return _res;
    } catch (e) {
        _logOp('butterworthLowpass', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.butterworthLowpass(ptr0, len0, cutoff, fs);
    var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v2;
}

/**
 * Temperature conversion: Celsius to Fahrenheit.
 * @param {number} c
 * @returns {number}
 */
export async function celsiusToFahrenheit(c) { 
    const _start = performance.now();
    try {
        const _res = wasm.celsiusToFahrenheit(c);
        _logOp('celsiusToFahrenheit', _start);
        return _res;
    } catch (e) {
        _logOp('celsiusToFahrenheit', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ret = wasm.celsiusToFahrenheit(c);
    return ret;
}

/**
 * Temperature conversion: Celsius to Kelvin.
 * @param {number} c
 * @returns {number}
 */
export async function celsiusToKelvin(c) { 
    const _start = performance.now();
    try {
        const _res = wasm.celsiusToKelvin(c);
        _logOp('celsiusToKelvin', _start);
        return _res;
    } catch (e) {
        _logOp('celsiusToKelvin', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ret = wasm.celsiusToKelvin(c);
    return ret;
}

/**
 * Computes the Cholesky decomposition of a symmetric positive-definite matrix.
 * @param {Float64Array} matrix
 * @param {number} n
 * @returns {Float64Array}
 */
export async function cholesky(matrix, n) { 
    const _start = performance.now();
    try {
        const _res = wasm.cholesky(matrix, n);
        _logOp('cholesky', _start);
        return _res;
    } catch (e) {
        _logOp('cholesky', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(matrix, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.cholesky(ptr0, len0, n);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v2;
}

/**
 * Clamps a value between a minimum and maximum range.
 *
 * The mathematical representation is:
 * $$ f(x, \min, \max) = \max(\min, \min(x, \max)) $$
 *
 * # Arguments
 * * `value` - The value to clamp.
 * * `min` - The lower bound.
 * * `max` - The upper bound.
 *
 * # Examples
 * ```typescript
 * const result = math.clamp(15, 0, 10); // returns 10
 * ```
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export async function clamp(value, min, max) { 
    const _start = performance.now();
    try {
        const _res = wasm.clamp(value, min, max);
        _logOp('clamp', _start);
        return _res;
    } catch (e) {
        _logOp('clamp', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ret = wasm.clamp(value, min, max);
    return ret;
}

/**
 * Constrained Optimization using Penalty Method
 * f: objective function, constraints: list of functions that must be >= 0
 * @param {Function} f
 * @param {Array<any>} constraints
 * @param {Float64Array} _x0
 * @param {number} penalty_weight
 * @param {number} _tol
 * @param {number} _max_iters
 * @returns {Float64Array}
 */
export async function constrained_optimize(f, constraints, _x0, penalty_weight, _tol, _max_iters) { 
    const _start = performance.now();
    try {
        const _res = wasm.constrained_optimize(f, constraints, _x0, penalty_weight, _tol, _max_iters);
        _logOp('constrained_optimize', _start);
        return _res;
    } catch (e) {
        _logOp('constrained_optimize', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(_x0, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.constrained_optimize(f, constraints, ptr0, len0, penalty_weight, _tol, _max_iters);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v2;
}

/**
 * Simple 2D Convolution (Validity Padding, Stride 1)
 * @param {Float64Array} input
 * @param {number} in_h
 * @param {number} in_w
 * @param {Float64Array} kernel
 * @param {number} k_h
 * @param {number} k_w
 * @returns {Float64Array}
 */
export async function conv2d(input, in_h, in_w, kernel, k_h, k_w) { 
    const _start = performance.now();
    try {
        const _res = wasm.conv2d(input, in_h, in_w, kernel, k_h, k_w);
        _logOp('conv2d', _start);
        return _res;
    } catch (e) {
        _logOp('conv2d', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(input, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArrayF64ToWasm0(kernel, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.conv2d(ptr0, len0, in_h, in_w, ptr1, len1, k_h, k_w);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v3 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v3;
}

/**
 * Calculates the Pearson correlation coefficient between two numeric sequences.
 *
 * $$ r_{xy} = \frac{cov(X, Y)}{s_x s_y} $$
 * @param {Float64Array} x
 * @param {Float64Array} y
 * @returns {number}
 */
export async function correlation(x, y) { 
    const _start = performance.now();
    try {
        const _res = wasm.correlation(x, y);
        _logOp('correlation', _start);
        return _res;
    } catch (e) {
        _logOp('correlation', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(x, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArrayF64ToWasm0(y, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.correlation(ptr0, len0, ptr1, len1);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0];
}

/**
 * Calculates the sample covariance between two numeric sequences.
 *
 * $$ cov(X, Y) = \frac{1}{n-1} \sum_{i=1}^n (x_i - \bar{x})(y_i - \bar{y}) $$
 * @param {Float64Array} x
 * @param {Float64Array} y
 * @returns {number}
 */
export async function covariance(x, y) { 
    const _start = performance.now();
    try {
        const _res = wasm.covariance(x, y);
        _logOp('covariance', _start);
        return _res;
    } catch (e) {
        _logOp('covariance', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(x, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArrayF64ToWasm0(y, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.covariance(ptr0, len0, ptr1, len1);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0];
}

/**
 * Calculates the cross-correlation of two signals - Parallel
 * @param {Float64Array} a
 * @param {Float64Array} b
 * @returns {Float64Array}
 */
export async function crossCorrelation(a, b) { 
    const _start = performance.now();
    try {
        const _res = wasm.crossCorrelation(a, b);
        _logOp('crossCorrelation', _start);
        return _res;
    } catch (e) {
        _logOp('crossCorrelation', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(a, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArrayF64ToWasm0(b, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.crossCorrelation(ptr0, len0, ptr1, len1);
    var v3 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v3;
}

/**
 * Downsamples the signal by keeping every `n`-th sample.
 * @param {Float64Array} data
 * @param {number} factor
 * @returns {Float64Array}
 */
export async function decimate(data, factor) { 
    const _start = performance.now();
    try {
        const _res = wasm.decimate(data, factor);
        _logOp('decimate', _start);
        return _res;
    } catch (e) {
        _logOp('decimate', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.decimate(ptr0, len0, factor);
    var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v2;
}

/**
 * @param {Float64Array} data
 * @param {Float64Array} kernel
 * @param {number} iterations
 * @returns {Float64Array}
 */
export async function deconvolveRL(data, kernel, iterations) { 
    const _start = performance.now();
    try {
        const _res = wasm.deconvolveRL(data, kernel, iterations);
        _logOp('deconvolveRL', _start);
        return _res;
    } catch (e) {
        _logOp('deconvolveRL', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArrayF64ToWasm0(kernel, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.deconvolveRL(ptr0, len0, ptr1, len1, iterations);
    var v3 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v3;
}

/**
 * Calculates the determinant using LU decomposition.
 * @param {Float64Array} matrix
 * @param {number} n
 * @returns {number}
 */
export async function detLU(matrix, n) { 
    const _start = performance.now();
    try {
        const _res = wasm.detLU(matrix, n);
        _logOp('detLU', _start);
        return _res;
    } catch (e) {
        _logOp('detLU', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(matrix, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.detLU(ptr0, len0, n);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0];
}

/**
 * Detects the most likely delimiter in a text file.
 * Detects the most likely delimiter in a text file.
 * @param {Uint8Array} sample_bytes
 * @returns {number}
 */
export async function detectDelimiter(sample_bytes) { 
    const _start = performance.now();
    try {
        const _res = wasm.detectDelimiter(sample_bytes);
        _logOp('detectDelimiter', _start);
        return _res;
    } catch (e) {
        _logOp('detectDelimiter', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArray8ToWasm0(sample_bytes, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.detectDelimiter(ptr0, len0);
    return ret;
}

/**
 * Counts the number of header/metadata lines before actual data.
 * @param {Uint8Array} sample_bytes
 * @returns {number}
 */
export async function detectHeaderLines(sample_bytes) { 
    const _start = performance.now();
    try {
        const _res = wasm.detectHeaderLines(sample_bytes);
        _logOp('detectHeaderLines', _start);
        return _res;
    } catch (e) {
        _logOp('detectHeaderLines', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArray8ToWasm0(sample_bytes, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.detectHeaderLines(ptr0, len0);
    return ret >>> 0;
}

/**
 * Calculates the determinant of a square matrix.
 * @param {Float64Array} matrix
 * @param {number} n
 * @returns {number}
 */
export async function determinant(matrix, n) { 
    const _start = performance.now();
    try {
        const _res = wasm.determinant(matrix, n);
        _logOp('determinant', _start);
        return _res;
    } catch (e) {
        _logOp('determinant', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(matrix, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.determinant(ptr0, len0, n);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0];
}

/**
 * @param {Float64Array} data
 * @param {number} h
 * @returns {Float64Array}
 */
export async function diff5Pt(data, h) { 
    const _start = performance.now();
    try {
        const _res = wasm.diff5Pt(data, h);
        _logOp('diff5Pt', _start);
        return _res;
    } catch (e) {
        _logOp('diff5Pt', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.diff5Pt(ptr0, len0, h);
    var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v2;
}

/**
 * Calculates the Euclidean distance between two 2D points.
 *
 * $$ d = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2} $$
 *
 * # Arguments
 * * `x1`, `y1` - Coordinates of the first point.
 * * `x2`, `y2` - Coordinates of the second point.
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @returns {number}
 */
export async function distance2D(x1, y1, x2, y2) { 
    const _start = performance.now();
    try {
        const _res = wasm.distance2D(x1, y1, x2, y2);
        _logOp('distance2D', _start);
        return _res;
    } catch (e) {
        _logOp('distance2D', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ret = wasm.distance2D(x1, y1, x2, y2);
    return ret;
}

/**
 * Calculates the dot product of two vectors - Parallel + SIMD
 * @param {Float64Array} a
 * @param {Float64Array} b
 * @returns {number}
 */
export async function dotProduct(a, b) { 
    const _start = performance.now();
    try {
        const _res = wasm.dotProduct(a, b);
        _logOp('dotProduct', _start);
        return _res;
    } catch (e) {
        _logOp('dotProduct', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(a, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArrayF64ToWasm0(b, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.dotProduct(ptr0, len0, ptr1, len1);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0];
}

/**
 * Dropout (Inference mode = identity, or Training mode with mask)
 * @param {Float64Array} x
 * @param {number} rate
 * @param {number} seed
 * @returns {Float64Array}
 */
export async function dropout(x, rate, seed) { 
    const _start = performance.now();
    try {
        const _res = wasm.dropout(x, rate, seed);
        _logOp('dropout', _start);
        return _res;
    } catch (e) {
        _logOp('dropout', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(x, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.dropout(ptr0, len0, rate, seed);
    var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v2;
}

/**
 * Computes the eigenvalues of a square matrix.
 * Returns complex eigenvalues as [re1, im1, re2, im2, ...].
 * @param {Float64Array} matrix
 * @param {number} n
 * @returns {Float64Array}
 */
export async function eigenvalues(matrix, n) { 
    const _start = performance.now();
    try {
        const _res = wasm.eigenvalues(matrix, n);
        _logOp('eigenvalues', _start);
        return _res;
    } catch (e) {
        _logOp('eigenvalues', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(matrix, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.eigenvalues(ptr0, len0, n);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v2;
}

/**
 * @param {Float64Array} data
 * @returns {number}
 */
export async function estimateSNR(data) { 
    const _start = performance.now();
    try {
        const _res = wasm.estimateSNR(data);
        _logOp('estimateSNR', _start);
        return _res;
    } catch (e) {
        _logOp('estimateSNR', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.estimateSNR(ptr0, len0);
    return ret;
}

/**
 * Temperature conversion: Fahrenheit to Celsius.
 * @param {number} f
 * @returns {number}
 */
export async function fahrenheitToCelsius(f) { 
    const _start = performance.now();
    try {
        const _res = wasm.fahrenheitToCelsius(f);
        _logOp('fahrenheitToCelsius', _start);
        return _res;
    } catch (e) {
        _logOp('fahrenheitToCelsius', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ret = wasm.fahrenheitToCelsius(f);
    return ret;
}

/**
 * MANDELBROT ZERO-COPY - Parallel
 * @param {number} in_ptr
 * @param {number} out_ptr
 * @param {number} len
 * @param {number} iters
 */
export async function fast_mandelbrot(in_ptr, out_ptr, len, iters) { 
    const _start = performance.now();
    try {
        const _res = wasm.fast_mandelbrot(in_ptr, out_ptr, len, iters);
        _logOp('fast_mandelbrot', _start);
        return _res;
    } catch (e) {
        _logOp('fast_mandelbrot', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    wasm.fast_mandelbrot(in_ptr, out_ptr, len, iters);
}

/**
 * MATRIX MULTIPLY ZERO-COPY - Parallel
 * @param {number} a_ptr
 * @param {number} b_ptr
 * @param {number} out_ptr
 * @param {number} size
 */
export async function fast_matmul_ptr(a_ptr, b_ptr, out_ptr, size) { 
    const _start = performance.now();
    try {
        const _res = wasm.fast_matmul_ptr(a_ptr, b_ptr, out_ptr, size);
        _logOp('fast_matmul_ptr', _start);
        return _res;
    } catch (e) {
        _logOp('fast_matmul_ptr', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    wasm.fast_matmul_ptr(a_ptr, b_ptr, out_ptr, size);
}

/**
 * Performs a Fast Fourier Transform (FFT) on a real-valued signal - Parallel
 * @param {Float64Array} input
 * @returns {Float64Array}
 */
export async function fft(input) { 
    const _start = performance.now();
    try {
        const _res = wasm.fft(input);
        _logOp('fft', _start);
        return _res;
    } catch (e) {
        _logOp('fft', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(input, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.fft(ptr0, len0);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v2;
}

/**
 * @param {Float64Array} data
 * @param {number} threshold
 * @param {number | null} [prominence]
 * @returns {Uint32Array}
 */
export async function findPeaks(data, threshold, prominence) { 
    const _start = performance.now();
    try {
        const _res = wasm.findPeaks(data, threshold, prominence);
        _logOp('findPeaks', _start);
        return _res;
    } catch (e) {
        _logOp('findPeaks', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.findPeaks(ptr0, len0, threshold, !isLikeNone(prominence), isLikeNone(prominence) ? 0 : prominence);
    var v2 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v2;
}

/**
 * Simple peak detection based on local maxima and a threshold - Parallel
 * @param {Float64Array} data
 * @param {number} threshold
 * @returns {Uint32Array}
 */
export async function findPeaksSimple(data, threshold) { 
    const _start = performance.now();
    try {
        const _res = wasm.findPeaksSimple(data, threshold);
        _logOp('findPeaksSimple', _start);
        return _res;
    } catch (e) {
        _logOp('findPeaksSimple', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.findPeaksSimple(ptr0, len0, threshold);
    var v2 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v2;
}

/**
 * Simple Genetic Algorithm for optimization.
 * bounds: flattened [min1, max1, min2, max2, ...]
 * @param {Function} f
 * @param {Float64Array} bounds
 * @param {number} pop_size
 * @param {number} generations
 * @param {number} mutation_rate
 * @returns {Float64Array}
 */
export async function genetic_algorithm(f, bounds, pop_size, generations, mutation_rate) { 
    const _start = performance.now();
    try {
        const _res = wasm.genetic_algorithm(f, bounds, pop_size, generations, mutation_rate);
        _logOp('genetic_algorithm', _start);
        return _res;
    } catch (e) {
        _logOp('genetic_algorithm', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(bounds, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.genetic_algorithm(f, ptr0, len0, pop_size, generations, mutation_rate);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v2;
}

/**
 * Gets information about an Excel workbook (sheet names, count).
 * @param {Uint8Array} file_bytes
 * @returns {any}
 */
export async function getExcelInfo(file_bytes) { 
    const _start = performance.now();
    try {
        const _res = wasm.getExcelInfo(file_bytes);
        _logOp('getExcelInfo', _start);
        return _res;
    } catch (e) {
        _logOp('getExcelInfo', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArray8ToWasm0(file_bytes, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.getExcelInfo(ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Get length of result buffer
 * @returns {number}
 */
export async function getResultLen() { 
    const _start = performance.now();
    try {
        const _res = wasm.getResultLen();
        _logOp('getResultLen', _start);
        return _res;
    } catch (e) {
        _logOp('getResultLen', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ret = wasm.getResultLen();
    return ret >>> 0;
}

/**
 * Get pointer to result buffer after parsing
 * @returns {number}
 */
export async function getResultPtr() { 
    const _start = performance.now();
    try {
        const _res = wasm.getResultPtr();
        _logOp('getResultPtr', _start);
        return _res;
    } catch (e) {
        _logOp('getResultPtr', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ret = wasm.getResultPtr();
    return ret >>> 0;
}

/**
 * @returns {any}
 */
export async function get_wasm_memory() { 
    const _start = performance.now();
    try {
        const _res = wasm.get_wasm_memory();
        _logOp('get_wasm_memory', _start);
        return _res;
    } catch (e) {
        _logOp('get_wasm_memory', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ret = wasm.get_wasm_memory();
    return ret;
}

/**
 * GPU-accelerated Matrix Multiplication (WebGPU Bridge)
 * @param {Float64Array} _a
 * @param {Float64Array} _b
 * @param {number} _rows_a
 * @param {number} _cols_a
 * @param {number} _cols_b
 * @returns {Promise<Float64Array>}
 */
export async function gpuMatMul(_a, _b, _rows_a, _cols_a, _cols_b) { 
    const _start = performance.now();
    try {
        const _res = wasm.gpuMatMul(_a, _b, _rows_a, _cols_a, _cols_b);
        _logOp('gpuMatMul', _start);
        return _res;
    } catch (e) {
        _logOp('gpuMatMul', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(_a, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArrayF64ToWasm0(_b, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.gpuMatMul(ptr0, len0, ptr1, len1, _rows_a, _cols_a, _cols_b);
    return ret;
}

/**
 * Calculates the numerical gradient of a function sampled at points `x`.
 * @param {Float64Array} data
 * @param {number} h
 * @returns {Float64Array}
 */
export async function gradient(data, h) { 
    const _start = performance.now();
    try {
        const _res = wasm.gradient(data, h);
        _logOp('gradient', _start);
        return _res;
    } catch (e) {
        _logOp('gradient', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.gradient(ptr0, len0, h);
    var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v2;
}

/**
 * Calculates the numerical Hessian of a scalar field at a given point `x`.
 * Returns the nxn matrix as a flattened vector.
 * @param {Function} f
 * @param {Float64Array} x
 * @param {number} h
 * @returns {Float64Array}
 */
export async function hessian(f, x, h) { 
    const _start = performance.now();
    try {
        const _res = wasm.hessian(f, x, h);
        _logOp('hessian', _start);
        return _res;
    } catch (e) {
        _logOp('hessian', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(x, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.hessian(f, ptr0, len0, h);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v2;
}

/**
 * Hilbert Transform - Computes the analytic signal
 * @param {Float64Array} data
 * @returns {Float64Array}
 */
export async function hilbert(data) { 
    const _start = performance.now();
    try {
        const _res = wasm.hilbert(data);
        _logOp('hilbert', _start);
        return _res;
    } catch (e) {
        _logOp('hilbert', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.hilbert(ptr0, len0);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v2;
}

/**
 * Calculates a histogram of the data - Parallel
 * @param {Float64Array} data
 * @param {number} bins
 * @returns {Uint32Array}
 */
export async function histogram(data, bins) { 
    const _start = performance.now();
    try {
        const _res = wasm.histogram(data, bins);
        _logOp('histogram', _start);
        return _res;
    } catch (e) {
        _logOp('histogram', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.histogram(ptr0, len0, bins);
    var v2 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v2;
}

/**
 * Calculates the hypotenuse of a right-angled triangle.
 *
 * $$ h = \sqrt{a^2 + b^2} $$
 * Calculates the hypotenuse of a right-angled triangle.
 *
 * $$ h = \sqrt{a^2 + b^2} $$
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
export async function hypot(a, b) { 
    const _start = performance.now();
    try {
        const _res = wasm.hypot(a, b);
        _logOp('hypot', _start);
        return _res;
    } catch (e) {
        _logOp('hypot', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ret = wasm.hypot(a, b);
    return ret;
}

/**
 * @param {Float64Array} re
 * @param {Float64Array} im
 * @returns {Float64Array}
 */
export async function ifft(re, im) { 
    const _start = performance.now();
    try {
        const _res = wasm.ifft(re, im);
        _logOp('ifft', _start);
        return _res;
    } catch (e) {
        _logOp('ifft', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(re, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArrayF64ToWasm0(im, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.ifft(ptr0, len0, ptr1, len1);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v3 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v3;
}

export async function initHooks() { 
    const _start = performance.now();
    try {
        const _res = wasm.initHooks();
        _logOp('initHooks', _start);
        return _res;
    } catch (e) {
        _logOp('initHooks', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    wasm.set_panic_hook();
}

/**
 * @param {number} num_threads
 * @returns {Promise<any>}
 */
export function initThreadPool(num_threads) {
    const ret = wasm.initThreadPool(num_threads);
    return ret;
}

/**
 * @param {Float64Array} data
 * @param {number} h
 * @returns {number}
 */
export async function integrateSimpson(data, h) { 
    const _start = performance.now();
    try {
        const _res = wasm.integrateSimpson(data, h);
        _logOp('integrateSimpson', _start);
        return _res;
    } catch (e) {
        _logOp('integrateSimpson', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.integrateSimpson(ptr0, len0, h);
    return ret;
}

/**
 * Linear Interpolation for a set of points
 * @param {Float64Array} x
 * @param {Float64Array} y
 * @param {Float64Array} xi
 * @returns {Float64Array}
 */
export async function interpolate_linear(x, y, xi) { 
    const _start = performance.now();
    try {
        const _res = wasm.interpolate_linear(x, y, xi);
        _logOp('interpolate_linear', _start);
        return _res;
    } catch (e) {
        _logOp('interpolate_linear', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(x, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArrayF64ToWasm0(y, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passArrayF64ToWasm0(xi, wasm.__wbindgen_malloc);
    const len2 = WASM_VECTOR_LEN;
    const ret = wasm.interpolate_linear(ptr0, len0, ptr1, len1, ptr2, len2);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v4 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v4;
}

/**
 * Inverts a 2x2 matrix.
 * @param {Float64Array} m
 * @returns {Float64Array}
 */
export async function invert2x2(m) { 
    const _start = performance.now();
    try {
        const _res = wasm.invert2x2(m);
        _logOp('invert2x2', _start);
        return _res;
    } catch (e) {
        _logOp('invert2x2', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(m, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.invert2x2(ptr0, len0);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v2;
}

/**
 * Inverts a 3x3 matrix.
 * @param {Float64Array} m
 * @returns {Float64Array}
 */
export async function invert3x3(m) { 
    const _start = performance.now();
    try {
        const _res = wasm.invert3x3(m);
        _logOp('invert3x3', _start);
        return _res;
    } catch (e) {
        _logOp('invert3x3', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(m, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.invert3x3(ptr0, len0);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v2;
}

/**
 * Inverse Short-Time Fourier Transform (ISTFT)
 * @param {Float64Array} stft_data
 * @param {number} window_size
 * @param {number} hop_size
 * @returns {Float64Array}
 */
export async function istft(stft_data, window_size, hop_size) { 
    const _start = performance.now();
    try {
        const _res = wasm.istft(stft_data, window_size, hop_size);
        _logOp('istft', _start);
        return _res;
    } catch (e) {
        _logOp('istft', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(stft_data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.istft(ptr0, len0, window_size, hop_size);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v2;
}

/**
 * Calculates the kurtosis (excess) of a data set.
 * @param {Float64Array} data
 * @returns {number}
 */
export async function kurtosis(data) { 
    const _start = performance.now();
    try {
        const _res = wasm.kurtosis(data);
        _logOp('kurtosis', _start);
        return _res;
    } catch (e) {
        _logOp('kurtosis', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.kurtosis(ptr0, len0);
    return ret;
}

/**
 * Least Squares Solver for Ax = b
 * @param {Float64Array} a
 * @param {Float64Array} b
 * @param {number} rows
 * @param {number} cols
 * @returns {Float64Array}
 */
export async function least_squares(a, b, rows, cols) { 
    const _start = performance.now();
    try {
        const _res = wasm.least_squares(a, b, rows, cols);
        _logOp('least_squares', _start);
        return _res;
    } catch (e) {
        _logOp('least_squares', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(a, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArrayF64ToWasm0(b, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.least_squares(ptr0, len0, ptr1, len1, rows, cols);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v3 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v3;
}

/**
 * Linear interpolation between two values.
 *
 * The formula used is:
 * $$ f(a, b, t) = a + t \cdot (b - a) $$
 *
 * # Arguments
 * * `a` - Start value.
 * * `b` - End value.
 * * `t` - Interpolation factor (usually between 0.0 and 1.0).
 *
 * # Complexity
 * $O(1)$
 * @param {number} a
 * @param {number} b
 * @param {number} t
 * @returns {number}
 */
export async function lerp(a, b, t) { 
    const _start = performance.now();
    try {
        const _res = wasm.lerp(a, b, t);
        _logOp('lerp', _start);
        return _res;
    } catch (e) {
        _logOp('lerp', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ret = wasm.lerp(a, b, t);
    return ret;
}

/**
 * Linear (Dense) Layer: y = x @ W + b
 * @param {Float64Array} input
 * @param {Float64Array} weights
 * @param {Float64Array} bias
 * @param {number} rows
 * @param {number} cols
 * @returns {Float64Array}
 */
export async function linearLayer(input, weights, bias, rows, cols) { 
    const _start = performance.now();
    try {
        const _res = wasm.linearLayer(input, weights, bias, rows, cols);
        _logOp('linearLayer', _start);
        return _res;
    } catch (e) {
        _logOp('linearLayer', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(input, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArrayF64ToWasm0(weights, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passArrayF64ToWasm0(bias, wasm.__wbindgen_malloc);
    const len2 = WASM_VECTOR_LEN;
    const ret = wasm.linearLayer(ptr0, len0, ptr1, len1, ptr2, len2, rows, cols);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v4 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v4;
}

/**
 * Performs a simple linear regression ($y = mx + b$).
 *
 * Uses the Ordinary Least Squares method:
 * $$ m = \frac{n\sum xy - \sum x \sum y}{n\sum x^2 - (\sum x)^2} $$
 * $$ b = \frac{\sum y - m\sum x}{n} $$
 *
 * # Arguments
 * * `x` - Independent variables.
 * * `y` - Dependent variables.
 * @param {Float64Array} x
 * @param {Float64Array} y
 * @returns {LinearRegressionResult}
 */
export async function linearRegression(x, y) { 
    const _start = performance.now();
    try {
        const _res = wasm.linearRegression(x, y);
        _logOp('linearRegression', _start);
        return _res;
    } catch (e) {
        _logOp('linearRegression', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(x, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArrayF64ToWasm0(y, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.linearRegression(ptr0, len0, ptr1, len1);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return LinearRegressionResult.__wrap(ret[0]);
}

/**
 * Computes the LU decomposition (with partial pivoting) of a square matrix.
 * Returns [L, U, P] as flattened vectors.
 * @param {Float64Array} matrix
 * @param {number} n
 * @returns {Float64Array}
 */
export async function lu(matrix, n) { 
    const _start = performance.now();
    try {
        const _res = wasm.lu(matrix, n);
        _logOp('lu', _start);
        return _res;
    } catch (e) {
        _logOp('lu', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(matrix, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.lu(ptr0, len0, n);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v2;
}

/**
 * Computes the magnitude of a complex FFT result - Parallel
 * @param {Float64Array} complex_data
 * @returns {Float64Array}
 */
export async function magnitude(complex_data) { 
    const _start = performance.now();
    try {
        const _res = wasm.magnitude(complex_data);
        _logOp('magnitude', _start);
        return _res;
    } catch (e) {
        _logOp('magnitude', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(complex_data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.magnitude(ptr0, len0);
    var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v2;
}

export async function main_js() { 
    const _start = performance.now();
    try {
        const _res = wasm.main_js();
        _logOp('main_js', _start);
        return _res;
    } catch (e) {
        _logOp('main_js', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    wasm.set_panic_hook();
}

/**
 * Multiplies two matrices represented as flat arrays - Parallel
 * @param {Float64Array} a
 * @param {number} rows_a
 * @param {number} cols_a
 * @param {Float64Array} b
 * @param {number} rows_b
 * @param {number} cols_b
 * @returns {Float64Array}
 */
export async function matrixMultiply(a, rows_a, cols_a, b, rows_b, cols_b) { 
    const _start = performance.now();
    try {
        const _res = wasm.matrixMultiply(a, rows_a, cols_a, b, rows_b, cols_b);
        _logOp('matrixMultiply', _start);
        return _res;
    } catch (e) {
        _logOp('matrixMultiply', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(a, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArrayF64ToWasm0(b, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.matrixMultiply(ptr0, len0, rows_a, cols_a, ptr1, len1, rows_b, cols_b);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v3 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v3;
}

/**
 * Calculates the arithmetic mean of a numeric sequence.
 *
 * Use this for basic average calculations on `Float64Array`.
 *
 * $$ \bar{x} = \frac{1}{n} \sum_{i=1}^n x_i $$
 * @param {Float64Array} data
 * @returns {number}
 */
export async function mean(data) { 
    const _start = performance.now();
    try {
        const _res = wasm.mean(data);
        _logOp('mean', _start);
        return _res;
    } catch (e) {
        _logOp('mean', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.mean(ptr0, len0);
    return ret;
}

/**
 * Finds the median value in a data set.
 *
 * Performs a parallel unstable sort to find the middle value.
 * @param {Float64Array} data
 * @returns {number}
 */
export async function median(data) { 
    const _start = performance.now();
    try {
        const _res = wasm.median(data);
        _logOp('median', _start);
        return _res;
    } catch (e) {
        _logOp('median', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.median(ptr0, len0);
    return ret;
}

/**
 * Distance conversion: Meters to Inches.
 * @param {number} m
 * @returns {number}
 */
export async function metersToInches(m) { 
    const _start = performance.now();
    try {
        const _res = wasm.metersToInches(m);
        _logOp('metersToInches', _start);
        return _res;
    } catch (e) {
        _logOp('metersToInches', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ret = wasm.metersToInches(m);
    return ret;
}

/**
 * Nelder-Mead (Downhill Simplex) Optimization
 * Finds the minimum of function `f(x)` starting from `x0`.
 * @param {Function} f
 * @param {Float64Array} x0
 * @param {number} tol
 * @param {number} max_iters
 * @returns {Float64Array}
 */
export async function minimize_nelder_mead(f, x0, tol, max_iters) { 
    const _start = performance.now();
    try {
        const _res = wasm.minimize_nelder_mead(f, x0, tol, max_iters);
        _logOp('minimize_nelder_mead', _start);
        return _res;
    } catch (e) {
        _logOp('minimize_nelder_mead', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(x0, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.minimize_nelder_mead(f, ptr0, len0, tol, max_iters);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v2;
}

/**
 * Finds the most frequent value in a data set.
 * @param {Float64Array} data
 * @returns {number}
 */
export async function mode(data) { 
    const _start = performance.now();
    try {
        const _res = wasm.mode(data);
        _logOp('mode', _start);
        return _res;
    } catch (e) {
        _logOp('mode', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.mode(ptr0, len0);
    return ret;
}

/**
 * Applies a moving average filter to smoothing out a signal - Parallel
 * @param {Float64Array} data
 * @param {number} window
 * @returns {Float64Array}
 */
export async function movingAverage(data, window) { 
    const _start = performance.now();
    try {
        const _res = wasm.movingAverage(data, window);
        _logOp('movingAverage', _start);
        return _res;
    } catch (e) {
        _logOp('movingAverage', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.movingAverage(ptr0, len0, window);
    var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v2;
}

/**
 * Normalizes a vector - Parallel
 * @param {Float64Array} v
 * @returns {Float64Array}
 */
export async function normalize(v) { 
    const _start = performance.now();
    try {
        const _res = wasm.normalize(v);
        _logOp('normalize', _start);
        return _res;
    } catch (e) {
        _logOp('normalize', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(v, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.normalize(ptr0, len0);
    var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v2;
}

/**
 * Runge-Kutta 4th Order ODE Solver
 * Solves dy/dt = f(t, y) from t_start to t_end
 * @param {Function} f
 * @param {number} y0
 * @param {number} t_start
 * @param {number} t_end
 * @param {number} steps
 * @returns {Float64Array}
 */
export async function ode45_rk4(f, y0, t_start, t_end, steps) { 
    const _start = performance.now();
    try {
        const _res = wasm.ode45_rk4(f, y0, t_start, t_end, steps);
        _logOp('ode45_rk4', _start);
        return _res;
    } catch (e) {
        _logOp('ode45_rk4', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ret = wasm.ode45_rk4(f, y0, t_start, t_end, steps);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v1;
}

/**
 * Parse the pre-loaded buffer (zero-copy from JS perspective)
 * @param {number} delimiter
 * @param {number} skip_lines
 * @returns {number}
 */
export async function parseBufferInPlace(delimiter, skip_lines) { 
    const _start = performance.now();
    try {
        const _res = wasm.parseBufferInPlace(delimiter, skip_lines);
        _logOp('parseBufferInPlace', _start);
        return _res;
    } catch (e) {
        _logOp('parseBufferInPlace', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ret = wasm.parseBufferInPlace(delimiter, skip_lines);
    return ret >>> 0;
}

/**
 * Ultra-fast fixed-width numeric parser
 * @param {Uint8Array} data
 * @param {Uint32Array} widths
 * @param {number} skip_lines
 * @returns {Float64Array}
 */
export async function parseFixedWidthFast(data, widths, skip_lines) { 
    const _start = performance.now();
    try {
        const _res = wasm.parseFixedWidthFast(data, widths, skip_lines);
        _logOp('parseFixedWidthFast', _start);
        return _res;
    } catch (e) {
        _logOp('parseFixedWidthFast', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArray32ToWasm0(widths, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.parseFixedWidthFast(ptr0, len0, ptr1, len1, skip_lines);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Ultra-fast CSV numeric parser
 * Operates directly on bytes, no string allocations
 * @param {Uint8Array} data
 * @param {number} delimiter
 * @param {number} skip_lines
 * @returns {Float64Array}
 */
export async function parseNumericCSVFast(data, delimiter, skip_lines) { 
    const _start = performance.now();
    try {
        const _res = wasm.parseNumericCSVFast(data, delimiter, skip_lines);
        _logOp('parseNumericCSVFast', _start);
        return _res;
    } catch (e) {
        _logOp('parseNumericCSVFast', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.parseNumericCSVFast(ptr0, len0, delimiter, skip_lines);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Pressure conversion: Pascal to Bar.
 * @param {number} pa
 * @returns {number}
 */
export async function pascalToBar(pa) { 
    const _start = performance.now();
    try {
        const _res = wasm.pascalToBar(pa);
        _logOp('pascalToBar', _start);
        return _res;
    } catch (e) {
        _logOp('pascalToBar', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ret = wasm.pascalToBar(pa);
    return ret;
}

/**
 * Calculates the p-th percentile of a data set.
 * p is between 0 and 100.
 * @param {Float64Array} data
 * @param {number} p
 * @returns {number}
 */
export async function percentile(data, p) { 
    const _start = performance.now();
    try {
        const _res = wasm.percentile(data, p);
        _logOp('percentile', _start);
        return _res;
    } catch (e) {
        _logOp('percentile', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.percentile(ptr0, len0, p);
    return ret;
}

/**
 * Calculates the derivative of a polynomial.
 *
 * If $P(x) = \sum a_i x^i$, then $P'(x) = \sum i a_i x^{i-1}$.
 *
 * # Returns
 * New coefficients for the derived polynomial.
 * @param {Float64Array} coeffs
 * @returns {Float64Array}
 */
export async function polyDerive(coeffs) { 
    const _start = performance.now();
    try {
        const _res = wasm.polyDerive(coeffs);
        _logOp('polyDerive', _start);
        return _res;
    } catch (e) {
        _logOp('polyDerive', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(coeffs, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.polyDerive(ptr0, len0);
    var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v2;
}

/**
 * Evaluates a polynomial at point $x$ using Horner's method.
 *
 * The polynomial is defined by its coefficients $[a_0, a_1, \dots, a_n]$ representing:
 * $$ P(x) = a_n x^n + a_{n-1} x^{n-1} + \dots + a_1 x + a_0 $$
 *
 * # Arguments
 * * `coeffs` - Coefficients in ascending order of degree (index 0 is constant term).
 * * `x` - The value to evaluate at.
 *
 * # Complexity
 * $O(n)$ where $n$ is the degree.
 * @param {Float64Array} coeffs
 * @param {number} x
 * @returns {number}
 */
export async function polyEval(coeffs, x) { 
    const _start = performance.now();
    try {
        const _res = wasm.polyEval(coeffs, x);
        _logOp('polyEval', _start);
        return _res;
    } catch (e) {
        _logOp('polyEval', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(coeffs, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.polyEval(ptr0, len0, x);
    return ret;
}

/**
 * Integuerates a polynomial with a constant $C$.
 *
 * # Arguments
 * * `coeffs` - Original coefficients.
 * * `c` - Integration constant.
 * @param {Float64Array} coeffs
 * @param {number} c
 * @returns {Float64Array}
 */
export async function polyIntegrate(coeffs, c) { 
    const _start = performance.now();
    try {
        const _res = wasm.polyIntegrate(coeffs, c);
        _logOp('polyIntegrate', _start);
        return _res;
    } catch (e) {
        _logOp('polyIntegrate', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(coeffs, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.polyIntegrate(ptr0, len0, c);
    var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v2;
}

/**
 * Computes the Moore-Penrose pseudo-inverse of a matrix.
 * @param {Float64Array} matrix
 * @param {number} rows
 * @param {number} cols
 * @returns {Float64Array}
 */
export async function pseudoInverse(matrix, rows, cols) { 
    const _start = performance.now();
    try {
        const _res = wasm.pseudoInverse(matrix, rows, cols);
        _logOp('pseudoInverse', _start);
        return _res;
    } catch (e) {
        _logOp('pseudoInverse', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(matrix, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.pseudoInverse(ptr0, len0, rows, cols);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v2;
}

/**
 * Computes the QR decomposition of a matrix - Gram-Schmidt (Parallel)
 * Returns [Q, R] as flattened vectors.
 * @param {Float64Array} matrix
 * @param {number} rows
 * @param {number} cols
 * @returns {Float64Array}
 */
export async function qr(matrix, rows, cols) { 
    const _start = performance.now();
    try {
        const _res = wasm.qr(matrix, rows, cols);
        _logOp('qr', _start);
        return _res;
    } catch (e) {
        _logOp('qr', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(matrix, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.qr(ptr0, len0, rows, cols);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v2;
}

/**
 * Calculates the rank of a matrix.
 * @param {Float64Array} matrix
 * @param {number} rows
 * @param {number} cols
 * @returns {number}
 */
export async function rank(matrix, rows, cols) { 
    const _start = performance.now();
    try {
        const _res = wasm.rank(matrix, rows, cols);
        _logOp('rank', _start);
        return _res;
    } catch (e) {
        _logOp('rank', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(matrix, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.rank(ptr0, len0, rows, cols);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0] >>> 0;
}

/**
 * Reads an Excel file (.xlsx) and returns all data from the first sheet.
 *
 * # Arguments
 * * `file_bytes` - The complete file contents as a byte array
 *
 * # Returns
 * A 2D array of string values representing the spreadsheet data
 * @param {Uint8Array} file_bytes
 * @returns {any}
 */
export async function readExcelFile(file_bytes) { 
    const _start = performance.now();
    try {
        const _res = wasm.readExcelFile(file_bytes);
        _logOp('readExcelFile', _start);
        return _res;
    } catch (e) {
        _logOp('readExcelFile', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArray8ToWasm0(file_bytes, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.readExcelFile(ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * High-performance Excel numeric extraction.
 * Returns a flat Float64Array for brute-force processing.
 * @param {Uint8Array} file_bytes
 * @param {number} sheet_index
 * @param {number} skip_rows
 * @returns {Float64Array}
 */
export async function readExcelNumericFast(file_bytes, sheet_index, skip_rows) { 
    const _start = performance.now();
    try {
        const _res = wasm.readExcelNumericFast(file_bytes, sheet_index, skip_rows);
        _logOp('readExcelNumericFast', _start);
        return _res;
    } catch (e) {
        _logOp('readExcelNumericFast', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArray8ToWasm0(file_bytes, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.readExcelNumericFast(ptr0, len0, sheet_index, skip_rows);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Reads an Excel file and returns data from a specific sheet by index.
 * @param {Uint8Array} file_bytes
 * @param {number} sheet_index
 * @returns {any}
 */
export async function readExcelSheet(file_bytes, sheet_index) { 
    const _start = performance.now();
    try {
        const _res = wasm.readExcelSheet(file_bytes, sheet_index);
        _logOp('readExcelSheet', _start);
        return _res;
    } catch (e) {
        _logOp('readExcelSheet', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArray8ToWasm0(file_bytes, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.readExcelSheet(ptr0, len0, sheet_index);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Reads an Excel file and returns data from a specific sheet by name.
 * @param {Uint8Array} file_bytes
 * @param {string} sheet_name
 * @returns {any}
 */
export async function readExcelSheetByName(file_bytes, sheet_name) { 
    const _start = performance.now();
    try {
        const _res = wasm.readExcelSheetByName(file_bytes, sheet_name);
        _logOp('readExcelSheetByName', _start);
        return _res;
    } catch (e) {
        _logOp('readExcelSheetByName', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArray8ToWasm0(file_bytes, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(sheet_name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.readExcelSheetByName(ptr0, len0, ptr1, len1);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Extracts typed cell values with type information preserved.
 * Use this when you need to differentiate between strings and numbers.
 * @param {Uint8Array} file_bytes
 * @returns {any}
 */
export async function readExcelTyped(file_bytes) { 
    const _start = performance.now();
    try {
        const _res = wasm.readExcelTyped(file_bytes);
        _logOp('readExcelTyped', _start);
        return _res;
    } catch (e) {
        _logOp('readExcelTyped', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArray8ToWasm0(file_bytes, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.readExcelTyped(ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Simple MATLAB .mat (v5) level parser for numeric arrays.
 * @param {Uint8Array} bytes
 * @returns {any}
 */
export async function readMatFile(bytes) { 
    const _start = performance.now();
    try {
        const _res = wasm.readMatFile(bytes);
        _logOp('readMatFile', _start);
        return _res;
    } catch (e) {
        _logOp('readMatFile', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.readMatFile(ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Reads a CSV/TSV file with advanced configuration options.
 * @param {Uint8Array} data
 * @param {CSVReaderOptions | null} [options]
 * @returns {any}
 */
export async function read_csv_with_options(data, options) { 
    const _start = performance.now();
    try {
        const _res = wasm.read_csv_with_options(data, options);
        _logOp('read_csv_with_options', _start);
        return _res;
    } catch (e) {
        _logOp('read_csv_with_options', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    let ptr1 = 0;
    if (!isLikeNone(options)) {
        _assertClass(options, CSVReaderOptions);
        ptr1 = options.__destroy_into_raw();
    }
    const ret = wasm.read_csv_with_options(ptr0, len0, ptr1);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Simple NumPy (.npy) format parser (Version 1.0)
 * Note: Only supports little-endian f8 (float64) for now.
 * @param {Uint8Array} bytes
 * @returns {NpyData}
 */
export async function read_npy(bytes) { 
    const _start = performance.now();
    try {
        const _res = wasm.read_npy(bytes);
        _logOp('read_npy', _start);
        return _res;
    } catch (e) {
        _logOp('read_npy', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.read_npy(ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return NpyData.__wrap(ret[0]);
}

/**
 * ReLU activation function - Parallel
 * @param {Float64Array} x
 * @returns {Float64Array}
 */
export async function relu(x) { 
    const _start = performance.now();
    try {
        const _res = wasm.relu(x);
        _logOp('relu', _start);
        return _res;
    } catch (e) {
        _logOp('relu', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(x, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.relu(ptr0, len0);
    var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v2;
}

/**
 * @param {Float64Array} data
 * @param {Float64Array} x
 * @param {number} order
 * @returns {Float64Array}
 */
export async function removeBaseline(data, x, order) { 
    const _start = performance.now();
    try {
        const _res = wasm.removeBaseline(data, x, order);
        _logOp('removeBaseline', _start);
        return _res;
    } catch (e) {
        _logOp('removeBaseline', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArrayF64ToWasm0(x, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.removeBaseline(ptr0, len0, ptr1, len1, order);
    var v3 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v3;
}

/**
 * @param {Float64Array} data
 * @param {Float64Array} x
 * @param {number} order
 * @param {number} iters
 * @returns {Float64Array}
 */
export async function removeBaselineIterative(data, x, order, iters) { 
    const _start = performance.now();
    try {
        const _res = wasm.removeBaselineIterative(data, x, order, iters);
        _logOp('removeBaselineIterative', _start);
        return _res;
    } catch (e) {
        _logOp('removeBaselineIterative', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArrayF64ToWasm0(x, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.removeBaselineIterative(ptr0, len0, ptr1, len1, order, iters);
    var v3 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v3;
}

/**
 * Linear Resampling of a signal
 * @param {Float64Array} data
 * @param {number} new_len
 * @returns {Float64Array}
 */
export async function resample(data, new_len) { 
    const _start = performance.now();
    try {
        const _res = wasm.resample(data, new_len);
        _logOp('resample', _start);
        return _res;
    } catch (e) {
        _logOp('resample', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.resample(ptr0, len0, new_len);
    var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v2;
}

/**
 * Resamples the signal to a new length using linear interpolation.
 * @param {Float64Array} data
 * @param {number} new_len
 * @returns {Float64Array}
 */
export async function resample_linear(data, new_len) { 
    const _start = performance.now();
    try {
        const _res = wasm.resample_linear(data, new_len);
        _logOp('resample_linear', _start);
        return _res;
    } catch (e) {
        _logOp('resample_linear', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.resample_linear(ptr0, len0, new_len);
    var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v2;
}

/**
 * @param {Float64Array} data
 * @returns {Float64Array}
 */
export async function rfft(data) { 
    const _start = performance.now();
    try {
        const _res = wasm.rfft(data);
        _logOp('rfft', _start);
        return _res;
    } catch (e) {
        _logOp('rfft', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.rfft(ptr0, len0);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v2;
}

/**
 * Brent's Method for Root Finding
 * Finds a root of function `f` in the interval `[a, b]`.
 * @param {Function} f
 * @param {number} a
 * @param {number} b
 * @param {number} tol
 * @returns {number}
 */
export async function roots_brent(f, a, b, tol) { 
    const _start = performance.now();
    try {
        const _res = wasm.roots_brent(f, a, b, tol);
        _logOp('roots_brent', _start);
        return _res;
    } catch (e) {
        _logOp('roots_brent', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ret = wasm.roots_brent(f, a, b, tol);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0];
}

/**
 * Rounds a number to a specific number of decimal places.
 *
 * # Arguments
 * * `value` - The number to round.
 * * `decimals` - Precision (number of fractional digits).
 * @param {number} value
 * @param {number} decimals
 * @returns {number}
 */
export async function roundToPrecision(value, decimals) { 
    const _start = performance.now();
    try {
        const _res = wasm.roundToPrecision(value, decimals);
        _logOp('roundToPrecision', _start);
        return _res;
    } catch (e) {
        _logOp('roundToPrecision', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ret = wasm.roundToPrecision(value, decimals);
    return ret;
}

export async function set_panic_hook() { 
    const _start = performance.now();
    try {
        const _res = wasm.set_panic_hook();
        _logOp('set_panic_hook', _start);
        return _res;
    } catch (e) {
        _logOp('set_panic_hook', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    wasm.set_panic_hook();
}

/**
 * Sigmoid activation function - Parallel
 * @param {Float64Array} x
 * @returns {Float64Array}
 */
export async function sigmoid(x) { 
    const _start = performance.now();
    try {
        const _res = wasm.sigmoid(x);
        _logOp('sigmoid', _start);
        return _res;
    } catch (e) {
        _logOp('sigmoid', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(x, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.sigmoid(ptr0, len0);
    var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v2;
}

/**
 * Sinc function (Normalized).
 *
 * $$ \text{sinc}(x) = \frac{\sin(\pi x)}{\pi x} $$
 *
 * Returns 1.0 when $x = 0$.
 * @param {number} x
 * @returns {number}
 */
export async function sinc(x) { 
    const _start = performance.now();
    try {
        const _res = wasm.sinc(x);
        _logOp('sinc', _start);
        return _res;
    } catch (e) {
        _logOp('sinc', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ret = wasm.sinc(x);
    return ret;
}

/**
 * Calculates the skewness of a data set.
 * @param {Float64Array} data
 * @returns {number}
 */
export async function skewness(data) { 
    const _start = performance.now();
    try {
        const _res = wasm.skewness(data);
        _logOp('skewness', _start);
        return _res;
    } catch (e) {
        _logOp('skewness', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.skewness(ptr0, len0);
    return ret;
}

/**
 * @param {Float64Array} data
 * @param {number} window
 * @param {number} degree
 * @returns {Float64Array}
 */
export async function smoothSG(data, window, degree) { 
    const _start = performance.now();
    try {
        const _res = wasm.smoothSG(data, window, degree);
        _logOp('smoothSG', _start);
        return _res;
    } catch (e) {
        _logOp('smoothSG', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.smoothSG(ptr0, len0, window, degree);
    var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v2;
}

/**
 * Analyzes the first bytes of a file to detect its format.
 *
 * # Arguments
 * * `header_bytes` - First 1024-4096 bytes of the file
 *
 * # Returns
 * A `FormatHint` struct with detected format information
 * @param {Uint8Array} header_bytes
 * @returns {FormatHint}
 */
export async function sniffFormat(header_bytes) { 
    const _start = performance.now();
    try {
        const _res = wasm.sniffFormat(header_bytes);
        _logOp('sniffFormat', _start);
        return _res;
    } catch (e) {
        _logOp('sniffFormat', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArray8ToWasm0(header_bytes, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.sniffFormat(ptr0, len0);
    return FormatHint.__wrap(ret);
}

/**
 * Softmax activation function - Parallel
 * @param {Float64Array} x
 * @returns {Float64Array}
 */
export async function softmax(x) { 
    const _start = performance.now();
    try {
        const _res = wasm.softmax(x);
        _logOp('softmax', _start);
        return _res;
    } catch (e) {
        _logOp('softmax', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(x, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.softmax(ptr0, len0);
    var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v2;
}

/**
 * Solves a linear system Ax = B using Gaussian elimination with partial pivoting.
 * @param {Float64Array} a
 * @param {Float64Array} b
 * @param {number} n
 * @returns {Float64Array}
 */
export async function solveLinearSystem(a, b, n) { 
    const _start = performance.now();
    try {
        const _res = wasm.solveLinearSystem(a, b, n);
        _logOp('solveLinearSystem', _start);
        return _res;
    } catch (e) {
        _logOp('solveLinearSystem', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(a, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArrayF64ToWasm0(b, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.solveLinearSystem(ptr0, len0, ptr1, len1, n);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v3 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v3;
}

/**
 * Computes a Spectrogram (magnitudes of STFT)
 * @param {Float64Array} data
 * @param {number} window_size
 * @param {number} hop_size
 * @returns {Float64Array}
 */
export async function spectrogram(data, window_size, hop_size) { 
    const _start = performance.now();
    try {
        const _res = wasm.spectrogram(data, window_size, hop_size);
        _logOp('spectrogram', _start);
        return _res;
    } catch (e) {
        _logOp('spectrogram', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.spectrogram(ptr0, len0, window_size, hop_size);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v2;
}

/**
 * Calculates the sample standard deviation of a numeric sequence.
 *
 * $$ s = \sqrt{s^2} $$
 * @param {Float64Array} data
 * @returns {number}
 */
export async function standardDeviation(data) { 
    const _start = performance.now();
    try {
        const _res = wasm.standardDeviation(data);
        _logOp('standardDeviation', _start);
        return _res;
    } catch (e) {
        _logOp('standardDeviation', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.standardDeviation(ptr0, len0);
    return ret;
}

/**
 * Short-Time Fourier Transform (STFT) - Parallel
 * Returns a flattened vector of complex numbers [re, im, ...]
 * @param {Float64Array} data
 * @param {number} window_size
 * @param {number} hop_size
 * @returns {Float64Array}
 */
export async function stft(data, window_size, hop_size) { 
    const _start = performance.now();
    try {
        const _res = wasm.stft(data, window_size, hop_size);
        _logOp('stft', _start);
        return _res;
    } catch (e) {
        _logOp('stft', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.stft(ptr0, len0, window_size, hop_size);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v2;
}

/**
 * Computes the Singular Value Decomposition (SVD) of a matrix.
 * Returns [U, S, Vt] as flattened vectors.
 * @param {Float64Array} matrix
 * @param {number} rows
 * @param {number} cols
 * @returns {Float64Array}
 */
export async function svd(matrix, rows, cols) { 
    const _start = performance.now();
    try {
        const _res = wasm.svd(matrix, rows, cols);
        _logOp('svd', _start);
        return _res;
    } catch (e) {
        _logOp('svd', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(matrix, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.svd(ptr0, len0, rows, cols);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v2;
}

/**
 * Converts radians to degrees.
 *
 * $$ \text{deg} = \text{rad} \cdot \frac{180}{\pi} $$
 * @param {number} radians
 * @returns {number}
 */
export async function toDegrees(radians) { 
    const _start = performance.now();
    try {
        const _res = wasm.toDegrees(radians);
        _logOp('toDegrees', _start);
        return _res;
    } catch (e) {
        _logOp('toDegrees', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ret = wasm.toDegrees(radians);
    return ret;
}

/**
 * Converts degrees to radians.
 *
 * $$ \text{rad} = \text{deg} \cdot \frac{\pi}{180} $$
 * @param {number} degrees
 * @returns {number}
 */
export async function toRadians(degrees) { 
    const _start = performance.now();
    try {
        const _res = wasm.toRadians(degrees);
        _logOp('toRadians', _start);
        return _res;
    } catch (e) {
        _logOp('toRadians', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ret = wasm.toRadians(degrees);
    return ret;
}

/**
 * Calculates the trace of a square matrix.
 * @param {Float64Array} matrix
 * @param {number} n
 * @returns {number}
 */
export async function trace(matrix, n) { 
    const _start = performance.now();
    try {
        const _res = wasm.trace(matrix, n);
        _logOp('trace', _start);
        return _res;
    } catch (e) {
        _logOp('trace', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(matrix, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.trace(ptr0, len0, n);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0];
}

/**
 * Transposes a matrix - Parallel
 * @param {Float64Array} data
 * @param {number} rows
 * @param {number} cols
 * @returns {Float64Array}
 */
export async function transpose(data, rows, cols) { 
    const _start = performance.now();
    try {
        const _res = wasm.transpose(data, rows, cols);
        _logOp('transpose', _start);
        return _res;
    } catch (e) {
        _logOp('transpose', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.transpose(ptr0, len0, rows, cols);
    var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v2;
}

/**
 * Calculates the sample variance of a numeric sequence.
 *
 * $$ s^2 = \frac{1}{n-1} \sum_{i=1}^n (x_i - \bar{x})^2 $$
 * @param {Float64Array} data
 * @returns {number}
 */
export async function variance(data) { 
    const _start = performance.now();
    try {
        const _res = wasm.variance(data);
        _logOp('variance', _start);
        return _res;
    } catch (e) {
        _logOp('variance', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ptr0 = passArrayF64ToWasm0(data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.variance(ptr0, len0);
    return ret;
}

/**
 * Returns the current version of the library.
 * @returns {string}
 */
export async function version() { 
    const _start = performance.now();
    try {
        const _res = wasm.version();
        _logOp('version', _start);
        return _res;
    } catch (e) {
        _logOp('version', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.version();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

export class wbg_rayon_PoolBuilder {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(wbg_rayon_PoolBuilder.prototype);
        obj.__wbg_ptr = ptr;
        wbg_rayon_PoolBuilderFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        wbg_rayon_PoolBuilderFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wbg_rayon_poolbuilder_free(ptr, 0);
    }
    build() {
        wasm.wbg_rayon_poolbuilder_build(this.__wbg_ptr);
    }
    /**
     * @returns {number}
     */
    numThreads() {
        const ret = wasm.wbg_rayon_poolbuilder_numThreads(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    receiver() {
        const ret = wasm.wbg_rayon_poolbuilder_receiver(this.__wbg_ptr);
        return ret >>> 0;
    }
}
if (Symbol.dispose) wbg_rayon_PoolBuilder.prototype[Symbol.dispose] = wbg_rayon_PoolBuilder.prototype.free;

/**
 * @param {number} receiver
 */
export async function wbg_rayon_start_worker(receiver) { 
    const _start = performance.now();
    try {
        const _res = wasm.wbg_rayon_start_worker(receiver);
        _logOp('wbg_rayon_start_worker', _start);
        return _res;
    } catch (e) {
        _logOp('wbg_rayon_start_worker', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    wasm.wbg_rayon_start_worker(receiver);
}

/**
 * Wraps an angle to the range $[-\pi, \pi)$.
 * @param {number} angle
 * @returns {number}
 */
export async function wrapAngle(angle) { 
    const _start = performance.now();
    try {
        const _res = wasm.wrapAngle(angle);
        _logOp('wrapAngle', _start);
        return _res;
    } catch (e) {
        _logOp('wrapAngle', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    const ret = wasm.wrapAngle(angle);
    return ret;
}

/**
 * Writes data to a CSV string.
 * @param {any} data
 * @param {number | null} [delimiter]
 * @returns {string}
 */
export async function write_csv(data, delimiter) { 
    const _start = performance.now();
    try {
        const _res = wasm.write_csv(data, delimiter);
        _logOp('write_csv', _start);
        return _res;
    } catch (e) {
        _logOp('write_csv', _start, false);
        if (_config.onError) _config.onError(e);
        throw new MathError("Operation " + name + " failed: " + e.message, 'WASM_PANIC', { originalError: e });
    }

    let deferred2_0;
    let deferred2_1;
    try {
        const ret = wasm.write_csv(data, isLikeNone(delimiter) ? 0xFFFFFF : delimiter);
        var ptr1 = ret[0];
        var len1 = ret[1];
        if (ret[3]) {
            ptr1 = 0; len1 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred2_0 = ptr1;
        deferred2_1 = len1;
        return getStringFromWasm0(ptr1, len1);
    } finally {
        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
}

function __wbg_get_imports(memory) {
    const import0 = {
        __proto__: null,
        __wbg_Error_8c4e43fe74559d73: function(arg0, arg1) {
            const ret = Error(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg___wbindgen_boolean_get_bbbb1c18aa2f5e25: function(arg0) {
            const v = arg0;
            const ret = typeof(v) === 'boolean' ? v : undefined;
            return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
        },
        __wbg___wbindgen_debug_string_0bc8482c6e3508ae: function(arg0, arg1) {
            const ret = debugString(arg1);
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_is_function_0095a73b8b156f76: function(arg0) {
            const ret = typeof(arg0) === 'function';
            return ret;
        },
        __wbg___wbindgen_is_object_5ae8e5880f2c1fbd: function(arg0) {
            const val = arg0;
            const ret = typeof(val) === 'object' && val !== null;
            return ret;
        },
        __wbg___wbindgen_is_string_cd444516edc5b180: function(arg0) {
            const ret = typeof(arg0) === 'string';
            return ret;
        },
        __wbg___wbindgen_is_undefined_9e4d92534c42d778: function(arg0) {
            const ret = arg0 === undefined;
            return ret;
        },
        __wbg___wbindgen_jsval_loose_eq_9dd77d8cd6671811: function(arg0, arg1) {
            const ret = arg0 == arg1;
            return ret;
        },
        __wbg___wbindgen_memory_bd1fbcf21fbef3c8: function() {
            const ret = wasm.memory;
            return ret;
        },
        __wbg___wbindgen_module_f6b8052d79c1cc16: function() {
            const ret = wasmModule;
            return ret;
        },
        __wbg___wbindgen_number_get_8ff4255516ccad3e: function(arg0, arg1) {
            const obj = arg1;
            const ret = typeof(obj) === 'number' ? obj : undefined;
            getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
        },
        __wbg___wbindgen_rethrow_05525c567f154472: function(arg0) {
            throw arg0;
        },
        __wbg___wbindgen_string_get_72fb696202c56729: function(arg0, arg1) {
            const obj = arg1;
            const ret = typeof(obj) === 'string' ? obj : undefined;
            var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_throw_be289d5034ed271b: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg__wbg_cb_unref_d9b87ff7982e3b21: function(arg0) {
            arg0._wbg_cb_unref();
        },
        __wbg_apply_ada2ee1a60ac7b3c: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.apply(arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_async_79f2a61f9d0b31cf: function(arg0) {
            const ret = arg0.async;
            return ret;
        },
        __wbg_buffer_7b5f53e46557d8f1: function(arg0) {
            const ret = arg0.buffer;
            return ret;
        },
        __wbg_call_389efe28435a9388: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.call(arg1);
            return ret;
        }, arguments); },
        __wbg_call_4708e0c13bdc8e95: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.call(arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_call_812d25f1510c13c8: function() { return handleError(function (arg0, arg1, arg2, arg3) {
            const ret = arg0.call(arg1, arg2, arg3);
            return ret;
        }, arguments); },
        __wbg_crypto_86f2631e91b51511: function(arg0) {
            const ret = arg0.crypto;
            return ret;
        },
        __wbg_data_5330da50312d0bc1: function(arg0) {
            const ret = arg0.data;
            return ret;
        },
        __wbg_done_57b39ecd9addfe81: function(arg0) {
            const ret = arg0.done;
            return ret;
        },
        __wbg_error_7534b8e9a36f1ab4: function(arg0, arg1) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg0;
                deferred0_1 = arg1;
                console.error(getStringFromWasm0(arg0, arg1));
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_getRandomValues_b3f15fcbfabb0f8b: function() { return handleError(function (arg0, arg1) {
            arg0.getRandomValues(arg1);
        }, arguments); },
        __wbg_get_9b94d73e6221f75c: function(arg0, arg1) {
            const ret = arg0[arg1 >>> 0];
            return ret;
        },
        __wbg_get_b3ed3ad4be2bc8ac: function() { return handleError(function (arg0, arg1) {
            const ret = Reflect.get(arg0, arg1);
            return ret;
        }, arguments); },
        __wbg_instanceof_ArrayBuffer_c367199e2fa2aa04: function(arg0) {
            let result;
            try {
                result = arg0 instanceof ArrayBuffer;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_Uint8Array_9b9075935c74707c: function(arg0) {
            let result;
            try {
                result = arg0 instanceof Uint8Array;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_Window_ed49b2db8df90359: function(arg0) {
            let result;
            try {
                result = arg0 instanceof Window;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_isArray_d314bb98fcf08331: function(arg0) {
            const ret = Array.isArray(arg0);
            return ret;
        },
        __wbg_iterator_6ff6560ca1568e55: function() {
            const ret = Symbol.iterator;
            return ret;
        },
        __wbg_length_32ed9a279acd054c: function(arg0) {
            const ret = arg0.length;
            return ret;
        },
        __wbg_length_35a7bace40f36eac: function(arg0) {
            const ret = arg0.length;
            return ret;
        },
        __wbg_length_f7386240689107f3: function(arg0) {
            const ret = arg0.length;
            return ret;
        },
        __wbg_msCrypto_d562bbe83e0d4b91: function(arg0) {
            const ret = arg0.msCrypto;
            return ret;
        },
        __wbg_new_361308b2356cecd0: function() {
            const ret = new Object();
            return ret;
        },
        __wbg_new_3eb36ae241fe6f44: function() {
            const ret = new Array();
            return ret;
        },
        __wbg_new_4f8f3c123e474358: function() { return handleError(function (arg0, arg1) {
            const ret = new Worker(getStringFromWasm0(arg0, arg1));
            return ret;
        }, arguments); },
        __wbg_new_72c627ba80de1c21: function(arg0) {
            const ret = new Int32Array(arg0);
            return ret;
        },
        __wbg_new_8a6f238a6ece86ea: function() {
            const ret = new Error();
            return ret;
        },
        __wbg_new_b5d9e2fb389fef91: function(arg0, arg1) {
            try {
                var state0 = {a: arg0, b: arg1};
                var cb0 = (arg0, arg1) => {
                    const a = state0.a;
                    state0.a = 0;
                    try {
                        return wasm_bindgen__convert__closures_____invoke__h323db28b9d8eb8a8(a, state0.b, arg0, arg1);
                    } finally {
                        state0.a = a;
                    }
                };
                const ret = new Promise(cb0);
                return ret;
            } finally {
                state0.a = state0.b = 0;
            }
        },
        __wbg_new_d17d15ba1d2042a1: function(arg0) {
            const ret = new Float64Array(arg0);
            return ret;
        },
        __wbg_new_dd2b680c8bf6ae29: function(arg0) {
            const ret = new Uint8Array(arg0);
            return ret;
        },
        __wbg_new_no_args_1c7c842f08d00ebb: function(arg0, arg1) {
            const ret = new Function(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_new_with_args_7bba34e94b1cfa40: function(arg0, arg1, arg2, arg3) {
            const ret = new Function(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3));
            return ret;
        },
        __wbg_new_with_length_6523745c0bd32809: function(arg0) {
            const ret = new Float64Array(arg0 >>> 0);
            return ret;
        },
        __wbg_new_with_length_a2c39cbe88fd8ff1: function(arg0) {
            const ret = new Uint8Array(arg0 >>> 0);
            return ret;
        },
        __wbg_next_3482f54c49e8af19: function() { return handleError(function (arg0) {
            const ret = arg0.next();
            return ret;
        }, arguments); },
        __wbg_next_418f80d8f5303233: function(arg0) {
            const ret = arg0.next;
            return ret;
        },
        __wbg_node_e1f24f89a7336c2e: function(arg0) {
            const ret = arg0.node;
            return ret;
        },
        __wbg_of_ddc0942b0dce16a1: function(arg0, arg1, arg2) {
            const ret = Array.of(arg0, arg1, arg2);
            return ret;
        },
        __wbg_postMessage_771ef3293a28bbac: function() { return handleError(function (arg0, arg1) {
            arg0.postMessage(arg1);
        }, arguments); },
        __wbg_process_3975fd6c72f520aa: function(arg0) {
            const ret = arg0.process;
            return ret;
        },
        __wbg_prototypesetcall_bdcdcc5842e4d77d: function(arg0, arg1, arg2) {
            Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), arg2);
        },
        __wbg_push_8ffdcb2063340ba5: function(arg0, arg1) {
            const ret = arg0.push(arg1);
            return ret;
        },
        __wbg_queueMicrotask_0aa0a927f78f5d98: function(arg0) {
            const ret = arg0.queueMicrotask;
            return ret;
        },
        __wbg_queueMicrotask_5bb536982f78a56f: function(arg0) {
            queueMicrotask(arg0);
        },
        __wbg_randomFillSync_f8c153b79f285817: function() { return handleError(function (arg0, arg1) {
            arg0.randomFillSync(arg1);
        }, arguments); },
        __wbg_require_b74f47fc2d022fd6: function() { return handleError(function () {
            const ret = module.require;
            return ret;
        }, arguments); },
        __wbg_resolve_002c4b7d9d8f6b64: function(arg0) {
            const ret = Promise.resolve(arg0);
            return ret;
        },
        __wbg_set_3f1d0b984ed272ed: function(arg0, arg1, arg2) {
            arg0[arg1] = arg2;
        },
        __wbg_set_a7e6b10165583fc4: function(arg0, arg1, arg2) {
            arg0.set(getArrayF64FromWasm0(arg1, arg2));
        },
        __wbg_set_f43e577aea94465b: function(arg0, arg1, arg2) {
            arg0[arg1 >>> 0] = arg2;
        },
        __wbg_set_onmessage_6ed41050e4a5cee2: function(arg0, arg1) {
            arg0.onmessage = arg1;
        },
        __wbg_stack_0ed75d68575b0f3c: function(arg0, arg1) {
            const ret = arg1.stack;
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg_startWorkers_70d3fba1b282d44b: function(arg0, arg1, arg2) {
            const ret = startWorkers(arg0, arg1, wbg_rayon_PoolBuilder.__wrap(arg2));
            return ret;
        },
        __wbg_static_accessor_GLOBAL_12837167ad935116: function() {
            const ret = typeof global === 'undefined' ? null : global;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_GLOBAL_THIS_e628e89ab3b1c95f: function() {
            const ret = typeof globalThis === 'undefined' ? null : globalThis;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_SELF_a621d3dfbb60d0ce: function() {
            const ret = typeof self === 'undefined' ? null : self;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_WINDOW_f8727f0cf888e0bd: function() {
            const ret = typeof window === 'undefined' ? null : window;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_subarray_a96e1fef17ed23cb: function(arg0, arg1, arg2) {
            const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
            return ret;
        },
        __wbg_then_b9e7b3b5f1a9e1b5: function(arg0, arg1) {
            const ret = arg0.then(arg1);
            return ret;
        },
        __wbg_value_0546255b415e96c1: function(arg0) {
            const ret = arg0.value;
            return ret;
        },
        __wbg_value_fe6ee34af5dc3dce: function(arg0) {
            const ret = arg0.value;
            return ret;
        },
        __wbg_versions_4e31226f5e8dc909: function(arg0) {
            const ret = arg0.versions;
            return ret;
        },
        __wbg_waitAsync_a58b2134bff39c3e: function(arg0, arg1, arg2) {
            const ret = Atomics.waitAsync(arg0, arg1 >>> 0, arg2);
            return ret;
        },
        __wbg_waitAsync_c0a39a7d3318d91e: function() {
            const ret = Atomics.waitAsync;
            return ret;
        },
        __wbindgen_cast_0000000000000001: function(arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { dtor_idx: 306, function: Function { arguments: [Externref], shim_idx: 307, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, wasm.wasm_bindgen__closure__destroy__h8deedcc2d2b0dfe7, wasm_bindgen__convert__closures_____invoke__h551172c0a29608e0);
            return ret;
        },
        __wbindgen_cast_0000000000000002: function(arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { dtor_idx: 306, function: Function { arguments: [NamedExternref("MessageEvent")], shim_idx: 307, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, wasm.wasm_bindgen__closure__destroy__h8deedcc2d2b0dfe7, wasm_bindgen__convert__closures_____invoke__h551172c0a29608e0);
            return ret;
        },
        __wbindgen_cast_0000000000000003: function(arg0) {
            // Cast intrinsic for `F64 -> Externref`.
            const ret = arg0;
            return ret;
        },
        __wbindgen_cast_0000000000000004: function(arg0, arg1) {
            // Cast intrinsic for `Ref(Slice(F64)) -> NamedExternref("Float64Array")`.
            const ret = getArrayF64FromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_cast_0000000000000005: function(arg0, arg1) {
            // Cast intrinsic for `Ref(Slice(U8)) -> NamedExternref("Uint8Array")`.
            const ret = getArrayU8FromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_cast_0000000000000006: function(arg0, arg1) {
            // Cast intrinsic for `Ref(String) -> Externref`.
            const ret = getStringFromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_cast_0000000000000007: function(arg0) {
            // Cast intrinsic for `U64 -> Externref`.
            const ret = BigInt.asUintN(64, arg0);
            return ret;
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
        __wbindgen_link_0b1f76d235fd2b86: function(arg0) {
            const val = `onmessage = function (ev) {
                let [ia, index, value] = ev.data;
                ia = new Int32Array(ia.buffer);
                let result = Atomics.wait(ia, index, value);
                postMessage(result);
            };
            `;
            const ret = typeof URL.createObjectURL === 'undefined' ? "data:application/javascript," + encodeURIComponent(val) : URL.createObjectURL(new Blob([val], { type: "text/javascript" }));
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        memory: memory || new WebAssembly.Memory({initial:22,maximum:16384,shared:true}),
    };
    return {
        __proto__: null,
        "./sci_math_wasm_bg.js": import0,
    };
}

function wasm_bindgen__convert__closures_____invoke__h551172c0a29608e0(arg0, arg1, arg2) {
    wasm.wasm_bindgen__convert__closures_____invoke__h551172c0a29608e0(arg0, arg1, arg2);
}

function wasm_bindgen__convert__closures_____invoke__h323db28b9d8eb8a8(arg0, arg1, arg2, arg3) {
    wasm.wasm_bindgen__convert__closures_____invoke__h323db28b9d8eb8a8(arg0, arg1, arg2, arg3);
}

const CSVReaderOptionsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_csvreaderoptions_free(ptr >>> 0, 1));
const ComplexFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_complex_free(ptr >>> 0, 1));
const DataBufferFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_databuffer_free(ptr >>> 0, 1));
const FormatHintFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_formathint_free(ptr >>> 0, 1));
const GpuContextFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_gpucontext_free(ptr >>> 0, 1));
const LinearRegressionResultFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_linearregressionresult_free(ptr >>> 0, 1));
const NpyDataFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_npydata_free(ptr >>> 0, 1));
const SciEngineFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_sciengine_free(ptr >>> 0, 1));
const SymbolicExprFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_symbolicexpr_free(ptr >>> 0, 1));
const TextStreamerFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_textstreamer_free(ptr >>> 0, 1));
const wbg_rayon_PoolBuilderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wbg_rayon_poolbuilder_free(ptr >>> 0, 1));

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_externrefs.set(idx, obj);
    return idx;
}

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
}

const CLOSURE_DTORS = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(state => state.dtor(state.a, state.b));

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches && builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

function getArrayF64FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getFloat64ArrayMemory0().subarray(ptr / 8, ptr / 8 + len);
}

function getArrayU32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer !== wasm.memory.buffer) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

let cachedFloat64ArrayMemory0 = null;
function getFloat64ArrayMemory0() {
    if (cachedFloat64ArrayMemory0 === null || cachedFloat64ArrayMemory0.buffer !== wasm.memory.buffer) {
        cachedFloat64ArrayMemory0 = new Float64Array(wasm.memory.buffer);
    }
    return cachedFloat64ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

let cachedUint32ArrayMemory0 = null;
function getUint32ArrayMemory0() {
    if (cachedUint32ArrayMemory0 === null || cachedUint32ArrayMemory0.buffer !== wasm.memory.buffer) {
        cachedUint32ArrayMemory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachedUint32ArrayMemory0;
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.buffer !== wasm.memory.buffer) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function makeMutClosure(arg0, arg1, dtor, f) {
    const state = { a: arg0, b: arg1, cnt: 1, dtor };
    const real = (...args) => {

        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        const a = state.a;
        state.a = 0;
        try {
            return f(a, state.b, ...args);
        } finally {
            state.a = a;
            real._wbg_cb_unref();
        }
    };
    real._wbg_cb_unref = () => {
        if (--state.cnt === 0) {
            state.dtor(state.a, state.b);
            state.a = 0;
            CLOSURE_DTORS.unregister(state);
        }
    };
    CLOSURE_DTORS.register(real, state, state);
    return real;
}

function passArray32ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 4, 4) >>> 0;
    getUint32ArrayMemory0().set(arg, ptr / 4);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passArrayF64ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 8, 8) >>> 0;
    getFloat64ArrayMemory0().set(arg, ptr / 8);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_externrefs.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}

let cachedTextDecoder = (typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { ignoreBOM: true, fatal: true }) : undefined);
if (cachedTextDecoder) cachedTextDecoder.decode();

const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().slice(ptr, ptr + len));
}

const cachedTextEncoder = (typeof TextEncoder !== 'undefined' ? new TextEncoder() : undefined);

if (cachedTextEncoder) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasm;
function __wbg_finalize_init(instance, module, thread_stack_size) {
    wasm = instance.exports;
    wasmModule = module;
    cachedDataViewMemory0 = null;
    cachedFloat64ArrayMemory0 = null;
    cachedUint32ArrayMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    if (typeof thread_stack_size !== 'undefined' && (typeof thread_stack_size !== 'number' || thread_stack_size === 0 || thread_stack_size % 65536 !== 0)) {
        throw 'invalid stack size';
    }
    wasm.__wbindgen_start(thread_stack_size);
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = module.ok && expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module, memory) {
    if (wasm !== undefined) return wasm;

    let thread_stack_size
    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module, memory, thread_stack_size} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports(memory);
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module, thread_stack_size);
}

async function __wbg_init(module_or_path, memory) {
    if (wasm !== undefined) return wasm;

    let thread_stack_size
    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path, memory, thread_stack_size} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('sci_math_wasm_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports(memory);

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module, thread_stack_size);
}

export { initSync, __wbg_init as default };
