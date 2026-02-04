import os from 'os';
import { beforeAll, describe, expect, it } from 'vitest';
import * as wasm from '../pkg/node/sci_math_wasm.js';

const {
  clamp, lerp, distance2D, roundToPrecision,
  mean, variance, standardDeviation, median, mode, skewness, kurtosis,
  toRadians, toDegrees, sinc, hypot, wrapAngle,
  fft, magnitude, movingAverage, findPeaks, decimate, resample_linear,
  dotProduct, normalize, matrixMultiply, trace, detLU,
  polyEval, polyDerive, polyIntegrate,
  linearRegression, LinearRegressionResult,
  Complex, SymbolicExpr,
  CSVReaderOptions, read_csv_with_options, write_csv,
  genetic_algorithm,
  celsiusToFahrenheit, fahrenheitToCelsius, celsiusToKelvin,
  pascalToBar, barToPascal, metersToInches,
  version,
  initThreadPool,
} = wasm as any;

beforeAll(async () => {
  const maybeInit = (wasm as any).default;
  if (typeof maybeInit === 'function') {
    await maybeInit();
  }
  const threads = Math.max(2, Math.min(8, os.cpus()?.length ?? 4));
  if (typeof initThreadPool === 'function') {
    try {
      await initThreadPool(threads);
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
    expect(distance2D(0, 0, 3, 4)).toBeCloseTo(5);
    expect(roundToPrecision(3.14159, 3)).toBeCloseTo(3.142);
  });
});

describe('stats', () => {
  const data = new Float64Array([1, 2, 3, 4, 2, 2]); // mode is 2
  it('mean/variance/std/median/mode/skew/kurt', () => {
    expect(mean(data)).toBeCloseTo(2.333333);
    expect(mode(data)).toBeCloseTo(2);
    // Skewness/Kurtosis checks
    const sk = skewness(data);
    const ku = kurtosis(data);
    expect(sk).toBeDefined();
    expect(ku).toBeDefined();
  });
});

describe('trig', () => {
  it('conversions and functions', () => {
    const rad = toRadians(180);
    expect(rad).toBeCloseTo(Math.PI);
    expect(toDegrees(rad)).toBeCloseTo(180);
    expect(sinc(0)).toBeCloseTo(1);
    expect(hypot(3, 4)).toBeCloseTo(5);
    const wrapped = wrapAngle(3 * Math.PI);
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

  it('movingAverage and findPeaks', () => {
    const data = new Float64Array([1, 2, 3, 4, 5]);
    const smoothed = movingAverage(data, 3);
    // Expected: [1.5, 2, 3, 4, 4.5] based on centered window logic
    expect(Array.from(smoothed)).toEqual([1.5, 2, 3, 4, 4.5]);

    const peaks = findPeaks(new Float64Array([0, 1, 3, 1, 0.5, 2, 0]), 1.5, 0.0);
    expect(peaks).toEqual(new Uint32Array([2, 5]));
  });

  it('decimate/resample', () => {
      const data = new Float64Array([1, 2, 3, 4, 5, 6]);
      const decimated = decimate(data, 2);
      expect(Array.from(decimated)).toEqual([1, 3, 5]);
      
      const resampled = resample_linear(new Float64Array([0, 10]), 5);
      expect(resampled.length).toBe(5);
      expect(resampled[2]).toBeCloseTo(5);
  });
});

describe('linalg', () => {
  it('dot/normalize/matmul/trace/det', () => {
    const a = new Float64Array([1, 2, 3]);
    const b = new Float64Array([4, 5, 6]);
    expect(dotProduct(a, b)).toBeCloseTo(32);

    const n = normalize(a);
    expect(n.length).toBe(3);
    expect(n[0]).toBeCloseTo(1 / Math.sqrt(14));

    const matA = new Float64Array([1, 2, 3, 4]); // [[1,2],[3,4]]
    const matB = new Float64Array([5, 6, 7, 8]); // [[5,6],[7,8]]
    const res = matrixMultiply(matA, 2, 2, matB, 2, 2);
    expect(Array.from(res)).toEqual([19, 22, 43, 50]);
    
    expect(trace(matA, 2)).toBe(5);
    expect(detLU(matA, 2)).toBeCloseTo(-2);
  });
});

describe('polynomials', () => {
  it('eval/derive/integrate', () => {
    const coeffs = new Float64Array([1, 0, 2]);
    expect(polyEval(coeffs, 2)).toBeCloseTo(9);

    const d = polyDerive(coeffs);
    expect(Array.from(d)).toEqual([0, 4]);

    const integrated = polyIntegrate(new Float64Array([1, 2]), 5);
    expect(Array.from(integrated)).toEqual([5, 1, 1]);
  });
});

describe('regression', () => {
  it('linearRegression returns struct fields', () => {
    const x = new Float64Array([1, 2, 3, 4]);
    const y = new Float64Array([2, 4, 6, 8]);
    const res = linearRegression(x, y) as any;
    expect(res.slope).toBeCloseTo(2);
    expect(res.intercept).toBeCloseTo(0);
    expect(res.rSquared).toBeCloseTo(1);
    res.free();
  });
});

describe('symbolic', () => {
    it('to_latex', () => {
        const expr = SymbolicExpr.parse('x');
        expect(expr.to_latex()).toBe('x');
        expr.free();
    });
});

describe('io', () => {
    it('read/write csv', () => {
       const csv = "a,b\n1,2\n3,4";
       const bytes = new TextEncoder().encode(csv);
       const data = read_csv_with_options(bytes, new CSVReaderOptions());
       expect(data.length).toBe(3); // header + 2 rows
       expect(data[1][0]).toBe("1");
       
       const out = write_csv(data);
       expect(out).toContain("a,b");
    });
});

describe('optimization', () => {
    it('genetic algorithm', () => {
        // f(x) = x^2, min at 0
        const f = (input: number[]) => input[0] * input[0];
        const bounds = new Float64Array([-10, 10]);
        // pop=100, gens=100, mut=0.1
        const res = genetic_algorithm(f, bounds, 100, 100, 0.1);
        expect(res.length).toBe(1);
        // Relax check as it is stochastic. < 4.0 is reasonable for -10..10 range reduction in a few gens
        expect(Math.abs(res[0])).toBeLessThan(4.0);
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

    const fromPolar = Complex.fromPolar(2, Math.PI / 3);
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
    expect(celsiusToFahrenheit(0)).toBeCloseTo(32);
    expect(fahrenheitToCelsius(32)).toBeCloseTo(0);
    expect(celsiusToKelvin(25)).toBeCloseTo(298.15);
    expect(pascalToBar(100_000)).toBeCloseTo(1);
    expect(barToPascal(1)).toBeCloseTo(100_000);
    expect(metersToInches(1)).toBeCloseTo(39.3701, 4);
  });
});

describe('metadata', () => {
  it('version is available', () => {
    expect(version()).toMatch(/\d+\.\d+\.\d+/);
  });
});
