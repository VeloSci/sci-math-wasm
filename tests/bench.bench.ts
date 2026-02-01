import { bench, describe } from 'vitest';
import { mean, matrix_multiply, fft, moving_average, derivative, poly_eval, linear_regression } from '../pkg/node';

// Simple pure JS versions for comparison
const jsMean = (data: Float64Array) => data.reduce((a, b) => a + b, 0) / data.length;
const jsMatMul = (a: Float64Array, rowsA: number, colsA: number, b: Float64Array, rowsB: number, colsB: number) => {
  if (colsA !== rowsB) throw new Error('dim mismatch');
  const out = new Float64Array(rowsA * colsB);
  for (let i = 0; i < rowsA; i++) {
    for (let j = 0; j < colsB; j++) {
      let sum = 0;
      for (let k = 0; k < colsA; k++) {
        sum += a[i * colsA + k] * b[k * colsB + j];
      }
      out[i * colsB + j] = sum;
    }
  }
  return out;
};

const vectorSmall = Float64Array.from({ length: 1024 }, (_, i) => i % 10);
const vectorLarge = Float64Array.from({ length: 65536 }, (_, i) => (i % 256) / 10);

const matSize = 64;
const makeMat = (n: number) => Float64Array.from({ length: n * n }, (_, i) => (i % 13) + 1);
const matA = makeMat(matSize);
const matB = makeMat(matSize);

describe('benchmarks wasm vs js', () => {
  bench('mean wasm 1k', () => {
    mean(vectorSmall);
  });

  bench('mean js 1k', () => {
    jsMean(vectorSmall);
  });

  bench('mean js 65k', () => {
    jsMean(vectorLarge);
  });

  bench('matmul wasm 64x64', () => {
    matrix_multiply(matA, matSize, matSize, matB, matSize, matSize);
  });

  bench('matmul js 64x64', () => {
    jsMatMul(matA, matSize, matSize, matB, matSize, matSize);
  });

  // Signal Processing Benchmarks
  const signalInput = Float64Array.from({ length: 4096 }, (_, i) => Math.sin(i * 0.1));
  
  bench('fft wasm 4096', () => {
    fft(signalInput);
  });

  // Simple JS Moving Average for comparison
  const jsMovingAverage = (data: Float64Array, window: number) => {
    const res = new Float64Array(data.length);
    for(let i=0; i<data.length; i++) {
        let sum = 0, count = 0;
        const start = Math.max(0, i - Math.floor(window/2));
        const end = Math.min(data.length, start + window);
        for(let j=start; j<end; j++) {
            sum += data[j];
            count++;
        }
        res[i] = sum / count;
    }
    return res;
  }
  
  bench('moving_average wasm 4k window=20', () => {
    moving_average(signalInput, 20);
  });

  bench('moving_average js 4k window=20', () => {
    jsMovingAverage(signalInput, 20);
  });

  // Calculus Benchmarks
  const jsDerivative = (y: Float64Array, dx: number) => {
    const n = y.length;
    const dy = new Float64Array(n);
    dy[0] = (y[1] - y[0]) / dx;
    for(let i=1; i<n-1; i++) {
        dy[i] = (y[i+1] - y[i-1]) / (2*dx);
    }
    dy[n-1] = (y[n-1] - y[n-2]) / dx;
    return dy;
  };

  bench('derivative wasm 4k', () => {
    derivative(signalInput, 0.1);
  });

  bench('derivative js 4k', () => {
    jsDerivative(signalInput, 0.1);
  });

  // Poly Benchmarks
  const polyCoeffs = new Float64Array([1, -2, 3, -4, 5, -6, 7, -8, 9]); // 8th degree
  const polyX = 1.2345;

  const jsPolyEval = (coeffs: Float64Array, x: number) => {
    let acc = 0;
    // coefficients are [constant, x, x^2...] based on src/poly/mod.rs which says:
    // "Coefficients in ascending order of degree (index 0 is constant term)"
    // and "coeffs.iter().rev().fold(0.0, |acc, &c| acc * x + c)"
    // Wait, iter().rev() means it starts from highest degree.
    // If [a0, a1, ... an], acc starts at 0.
    // rev() gives an, an-1, ... a0.
    // Loop 1: acc = 0*x + an = an
    // Loop 2: acc = an*x + an-1
    // Loop 3: acc = (an*x + an-1)*x + an-2 = an*x^2 + an-1*x + an-2
    // Correct.
    for (let i = coeffs.length - 1; i >= 0; i--) {
        acc = acc * x + coeffs[i];
    }
    return acc;
  };

  bench('poly_eval wasm degree 8', () => {
    poly_eval(polyCoeffs, polyX);
  });

  bench('poly_eval js degree 8', () => {
    jsPolyEval(polyCoeffs, polyX);
  });

  // Regression Benchmarks
  const regX = Float64Array.from({ length: 1000 }, (_, i) => i);
  const regY = Float64Array.from({ length: 1000 }, (_, i) => 2 * i + 5 + Math.random());

  const jsLinearRegression = (x: Float64Array, y: Float64Array) => {
      const n = x.length;
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      for (let i = 0; i < n; i++) {
          sumX += x[i];
          sumY += y[i];
          sumXY += x[i] * y[i];
          sumXX += x[i] * x[i];
      }
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
      return { slope, intercept };
  };

  bench('linear_regression wasm 1k pts', () => {
    linear_regression(regX, regY);
  });

  bench('linear_regression js 1k pts', () => {
    jsLinearRegression(regX, regY);
  });
});
