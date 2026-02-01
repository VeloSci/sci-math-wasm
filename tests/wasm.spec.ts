import os from 'os';
import { beforeAll, describe, expect, it } from 'vitest';
import * as wasm from '../pkg/node/sci_math_wasm.js';

const {
  clamp, lerp, distance_2d, round_to_precision,
  mean, variance, standard_deviation, median,
  to_radians, to_degrees, sinc, hypot, wrap_angle,
  fft, magnitude, moving_average, find_peaks,
  dot_product, normalize, matrix_multiply,
  poly_eval, poly_derive, poly_integrate,
  linear_regression, LinearRegressionResult,
  Complex,
  celsius_to_fahrenheit, fahrenheit_to_celsius, celsius_to_kelvin,
  pascal_to_bar, bar_to_pascal, meters_to_inches,
  version,
  init_threads,
} = wasm as any;

beforeAll(async () => {
  const maybeInit = (wasm as any).default;
  if (typeof maybeInit === 'function') {
    await maybeInit();
  }
  const threads = Math.max(2, Math.min(8, os.cpus()?.length ?? 4));
  if (typeof init_threads === 'function') {
    try {
      await init_threads(threads);
      console.log(`Thread pool initialized with ${threads} threads`);
    } catch (err) {
      console.warn('Failed to initialize threads (Worker not available in test env):', err);
    }
  }
});

describe('basic', () => {
  it('clamp/lerp/distance/round', () => {
    expect(clamp(12, 0, 10)).toBe(10);
    expect(lerp(0, 10, 0.25)).toBeCloseTo(2.5);
    expect(distance_2d(0, 0, 3, 4)).toBeCloseTo(5);
    expect(round_to_precision(3.14159, 3)).toBeCloseTo(3.142);
  });
});

describe('stats', () => {
  const data = new Float64Array([1, 2, 3, 4]);
  it('mean/variance/std/median', () => {
    expect(mean(data)).toBeCloseTo(2.5);
    expect(variance(data)).toBeCloseTo(1.6666667);
    expect(standard_deviation(data)).toBeCloseTo(Math.sqrt(1.6666667));
    expect(median(data)).toBeCloseTo(2.5);
  });
});

describe('trig', () => {
  it('conversions and functions', () => {
    const rad = to_radians(180);
    expect(rad).toBeCloseTo(Math.PI);
    expect(to_degrees(rad)).toBeCloseTo(180);
    expect(sinc(0)).toBeCloseTo(1);
    expect(hypot(3, 4)).toBeCloseTo(5);
    const wrapped = wrap_angle(3 * Math.PI);
    expect(wrapped).toBeCloseTo(-Math.PI);
  });
});

describe('signal', () => {
  it('fft and magnitude', () => {
    const input = new Float64Array([1, 0, 0, 0]);
    const spectrum = fft(input);
    expect(spectrum.length).toBe(8);
    const mags = magnitude(spectrum);
    mags.forEach((m: number) => expect(m).toBeCloseTo(1));

    const N = 16;
    const sineInput = new Float64Array(N);
    const freq = 2; 
    for (let i = 0; i < N; i++) {
        sineInput[i] = Math.sin((2 * Math.PI * freq * i) / N);
    }
    const sineSpectrum = fft(sineInput);
    const sineMags = magnitude(sineSpectrum);
    
    expect(sineMags[freq]).toBeGreaterThan(sineMags[0]);
    expect(sineMags[freq]).toBeGreaterThan(sineMags[freq+1]);
    expect(sineMags[freq]).toBeCloseTo(N/2, 1);
  });

  it('moving_average and find_peaks', () => {
    const data = new Float64Array([1, 2, 3, 4, 5]);
    const smoothed = moving_average(data, 3);
    // Expected: [1.5, 2, 3, 4, 4.5] based on centered window logic
    expect(Array.from(smoothed)).toEqual([1.5, 2, 3, 4, 4.5]);

    const peaks = find_peaks(new Float64Array([0, 1, 3, 1, 0.5, 2, 0]), 1.5);
    expect(peaks).toEqual(new Uint32Array([2, 5]));
  });
});

describe('linalg', () => {
  it('dot/normalize/matmul', () => {
    const a = new Float64Array([1, 2, 3]);
    const b = new Float64Array([4, 5, 6]);
    expect(dot_product(a, b)).toBeCloseTo(32);

    const n = normalize(a);
    expect(n.length).toBe(3);
    expect(n[0]).toBeCloseTo(1 / Math.sqrt(14));

    const matA = new Float64Array([1, 2, 3, 4]);
    const matB = new Float64Array([5, 6, 7, 8]);
    const res = matrix_multiply(matA, 2, 2, matB, 2, 2);
    expect(Array.from(res)).toEqual([19, 22, 43, 50]);
  });
});

describe('polynomials', () => {
  it('eval/derive/integrate', () => {
    const coeffs = new Float64Array([1, 0, 2]);
    expect(poly_eval(coeffs, 2)).toBeCloseTo(9);

    const d = poly_derive(coeffs);
    expect(Array.from(d)).toEqual([0, 4]);

    const integrated = poly_integrate(new Float64Array([1, 2]), 5);
    expect(Array.from(integrated)).toEqual([5, 1, 1]);
  });
});

describe('regression', () => {
  it('linear_regression returns struct fields', () => {
    const x = new Float64Array([1, 2, 3, 4]);
    const y = new Float64Array([2, 4, 6, 8]);
    const res = linear_regression(x, y) as any;
    expect(res.slope).toBeCloseTo(2);
    expect(res.intercept).toBeCloseTo(0);
    expect(res.r_squared).toBeCloseTo(1);
    res.free();
  });
});

describe('complex', () => {
  it('operations and polar', () => {
    const a = new Complex(1, 2);
    const b = new Complex(3, 4);
    const sum = a.add(b);
    expect(sum.re).toBeCloseTo(4);
    expect(sum.im).toBeCloseTo(6);

    const prod = a.mul(b);
    expect(prod.re).toBeCloseTo(-5);
    expect(prod.im).toBeCloseTo(10);

    const fromPolar = Complex.from_polar(2, Math.PI / 3);
    expect(fromPolar.magnitude()).toBeCloseTo(2);
    
    // Explicitly free to help GC/teardown in strict environments
    a.free();
    b.free();
    sum.free();
    prod.free();
    fromPolar.free();
  });
});

describe('units', () => {
  it('temperature/pressure/distance conversions', () => {
    expect(celsius_to_fahrenheit(0)).toBeCloseTo(32);
    expect(fahrenheit_to_celsius(32)).toBeCloseTo(0);
    expect(celsius_to_kelvin(25)).toBeCloseTo(298.15);
    expect(pascal_to_bar(100_000)).toBeCloseTo(1);
    expect(bar_to_pascal(1)).toBeCloseTo(100_000);
    expect(meters_to_inches(1)).toBeCloseTo(39.3701, 4);
  });
});

describe('metadata', () => {
  it('version is available', () => {
    expect(version()).toMatch(/\d+\.\d+\.\d+/);
  });
});
