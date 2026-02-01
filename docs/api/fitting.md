# Curve Fitting

Optimized parallel algorithms for fitting mathematical models to data.

## API Reference

### `fit_linear`
Performs a linear regression ($y = mx + c$) using parallelized least squares.

**Signature:**
```typescript
function fit_linear(x: Float64Array, y: Float64Array): { slope: number, intercept: number, r2: number }
```

### `fit_polynomial`
Fits a polynomial of degree `order` to the data ($y = a_0 + a_1x + a_2x^2 + ...$).

**Signature:**
```typescript
function fit_polynomial(x: Float64Array, y: Float64Array, order: number): Float64Array | undefined
```
**Returns:** Coefficients $[a_0, a_1, \dots, a_n]$.

### `fit_exponential`
Fits an exponential model ($y = A \cdot e^{Bx}$).

**Signature:**
```typescript
function fit_exponential(x: Float64Array, y: Float64Array): Float64Array | undefined
```
**Returns:** Parameters $[A, B]$.

### `fit_logarithmic`
Fits a logarithmic model ($y = A + B \cdot \ln(x)$).

**Signature:**
```typescript
function fit_logarithmic(x: Float64Array, y: Float64Array): Float64Array | undefined
```
**Returns:** Parameters $[A, B]$.

### `fit_gaussians`
Fits a Gaussian curve ($y = A \cdot e^{-\frac{(x-\mu)^2}{2\sigma^2}}$) using the Levenberg-Marquardt algorithm.

**Signature:**
```typescript
function fit_gaussians(x: Float64Array, y: Float64Array, initial: Float64Array): Float64Array
```
**Arguments:**
- `initial`: Initial guess $[A, \mu, \sigma]$.

**Returns:** Refined parameters $[A, \mu, \sigma]$.
