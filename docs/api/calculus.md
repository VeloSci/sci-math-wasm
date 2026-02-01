# Numerical Calculus

Tools for numerical differentiation, integration, and smoothing via `SciMathJS`.

## Usage

```typescript
import { SciMathJS } from '@velo-sci/sci-math-wasm';

const data = new Float64Array([1, 2, 4, 8, 16]);
const derivative = SciMathJS.diff5Pt(data, 1.0);
```

## API Reference

### `diff5Pt`
Calculates numerical derivatives of a data series using a 5-point stencil for high accuracy.

**Formula:**
$$ f'(x) \approx \frac{-f(x+2h) + 8f(x+h) - 8f(x-h) + f(x-2h)}{12h} $$

**Signature:**
```typescript
function diff5Pt(data: Float64Array | number[], h: number): Float64Array
```

---

### `integrateSimpson`
Computes the definite integral of a function using Simpson's 1/3 rule.

**Formula:**
$$ \int_a^b f(x)dx \approx \frac{h}{3} \left[ f(x_0) + 4\sum_{i=1,3,...}f(x_i) + 2\sum_{i=2,4,...}f(x_i) + f(x_n) \right] $$

**Signature:**
```typescript
function integrateSimpson(data: Float64Array | number[], h: number): number
```

---

### `smoothSG`
Savitzky-Golay smoothing filter. Uses a polynomial regression of local points to smooth data while preserving peak shape.

**Signature:**
```typescript
function smoothSG(data: Float64Array | number[], window: number): Float64Array
```
