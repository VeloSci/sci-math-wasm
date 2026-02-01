import { getWasmProvider } from './wasm-provider';

export function clamp(value: number, min: number, max: number): number {
    const wasm = getWasmProvider();
    if (wasm && wasm.clamp) return wasm.clamp(value, min, max);
    return Math.max(min, Math.min(value, max));
}

export function lerp(a: number, b: number, t: number): number {
    const wasm = getWasmProvider();
    if (wasm && wasm.lerp) return wasm.lerp(a, b, t);
    return a + t * (b - a);
}

export function distance2D(x1: number, y1: number, x2: number, y2: number): number {
    const wasm = getWasmProvider();
    if (wasm && wasm.distance2D) return wasm.distance2D(x1, y1, x2, y2);
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

export function roundToPrecision(value: number, decimals: number): number {
    const wasm = getWasmProvider();
    if (wasm && wasm.roundToPrecision) return wasm.roundToPrecision(value, decimals);
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}

export function toRadians(degrees: number): number {
    const wasm = getWasmProvider();
    if (wasm && wasm.toRadians) return wasm.toRadians(degrees);
    return degrees * Math.PI / 180.0;
}

export function toDegrees(radians: number): number {
    const wasm = getWasmProvider();
    if (wasm && wasm.toDegrees) return wasm.toDegrees(radians);
    return radians * 180.0 / Math.PI;
}

export function sinc(x: number): number {
    const wasm = getWasmProvider();
    if (wasm && wasm.sinc) return wasm.sinc(x);
    if (x === 0) return 1.0;
    const px = Math.PI * x;
    return Math.sin(px) / px;
}

export function hypot(a: number, b: number): number {
    const wasm = getWasmProvider();
    if (wasm && wasm.hypot) return wasm.hypot(a, b);
    return Math.sqrt(a * a + b * b);
}

export function wrapAngle(angle: number): number {
    const wasm = getWasmProvider();
    if (wasm && wasm.wrapAngle) return wasm.wrapAngle(angle);
    let wrapped = angle % (2.0 * Math.PI);
    if (wrapped > Math.PI) wrapped -= 2.0 * Math.PI;
    else if (wrapped < -Math.PI) wrapped += 2.0 * Math.PI;
    return wrapped;
}

export function celsiusToFahrenheit(c: number): number { return c * 1.8 + 32.0; }
export function fahrenheitToCelsius(f: number): number { return (f - 32.0) / 1.8; }
export function celsiusToKelvin(c: number): number { return c + 273.15; }
export function pascalToBar(pa: number): number { return pa / 100000.0; }
export function barToPascal(bar: number): number { return bar * 100000.0; }
export function metersToInches(m: number): number { return m * 39.3701; }
export function version(): string { return "0.2.2"; }

export function fastMandelbrot(input: Float64Array | number[], iters: number): Float64Array {
    const wasm = getWasmProvider();
    if (wasm && wasm.fastMandelbrot) return wasm.fastMandelbrot(input, iters);
    const len = input.length;
    const output = new Float64Array(len);
    for (let i = 0; i < len; i++) {
        const c = input[i];
        let x = c, y = c, d = 0;
        for (let j = 0; j < iters; j++) {
            const nx = x * x - y * y + c;
            const ny = 2.0 * x * y + 0.5;
            x = nx; y = ny;
            const magSq = x * x + y * y;
            d += Math.sqrt(magSq);
            if (magSq > 100.0) { x = 0; y = 0; }
        }
        output[i] = d;
    }
    return output;
}
