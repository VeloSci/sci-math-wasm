# Basic Math Utilities

General purpose mathematical utilities and interpolation via `SciMathJS`.

## API Reference

### `clamp`
Clamps a value between a minimum and maximum.

**Signature:**
```typescript
function clamp(value: number, min: number, max: number): number
```

---

### `lerp`
Linear interpolation between two values.

**Formula:**
$$ y = a + t(b - a) $$

**Signature:**
```typescript
function lerp(a: number, b: number, t: number): number
```

---

### `distance2D`
Calculates the Euclidean distance between two 2D points.

**Formula:**
$$ d = \sqrt{(x_2-x_1)^2 + (y_2-y_1)^2} $$

**Signature:**
```typescript
function distance2D(x1: number, y1: number, x2: number, y2: number): number
```

---

### `roundToPrecision`
Rounds a number to a specified number of decimal places.

**Signature:**
```typescript
function roundToPrecision(value: number, decimals: number): number
```

---

### `fastMandelbrot`
Heavily optimized Mandelbrot set distance calculation. Delegates directly to WASM for maximum performance.

**Signature:**
```typescript
function fastMandelbrot(input: Float64Array | number[], iters: number): Float64Array
```
