# Regression Analysis

Fitting models to data points using `SciMathJS`.

## API Reference

### `linearRegression`
Performs a simple linear regression using Ordinary Least Squares.

**Result Object:**
- `slope: number`
- `intercept: number`
- `rSquared: number`
- `free(): void` (WASM cleanup)

**Signature:**
```typescript
function linearRegression(x: Float64Array | number[], y: Float64Array | number[]): LinearRegressionResult
```

---

### `fitLinear`
Convenience method that returns results as a simple array.

**Signature:**
```typescript
function fitLinear(x: Float64Array | number[], y: Float64Array | number[]): [slope: number, intercept: number, rSquared: number]
```

---

### `fitPolynomial`
Fits a polynomial of specified order to data points.

**Signature:**
```typescript
function fitPolynomial(x: Float64Array | number[], y: Float64Array | number[], order: number): Float64Array | null
```

---

### `fitGaussians`
Fits a sum of $N$ Gaussian curves to the data using the Levenberg-Marquardt algorithm.

**Signature:**
```typescript
function fitGaussians(
  x: Float64Array | number[], 
  y: Float64Array | number[], 
  initial: number[]
): Float64Array
```

*   `initial`: Array of parameters sorted as `[amp1, mu1, sigma1, amp2, mu2, sigma2, ...]`.
*   Returns: Optimized parameters in the same format.

---

### `fitExponential` / `fitLogarithmic`
Non-linear regression models for specific data patterns.

**Signatures:**
```typescript
function fitExponential(x: Float64Array | number[], y: Float64Array | number[]): [a: number, b: number] | null
function fitLogarithmic(x: Float64Array | number[], y: Float64Array | number[]): [a: number, b: number] | null
```
