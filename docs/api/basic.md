# Basic Mathematics

Fundamental arithmetic operations optimized for scientific use.

## API Reference

### `clamp`
Clamps a value between a minimum and maximum.

**Formula:**
$$ f(x, \min, \max) = \max(\min, \min(x, \max)) $$

**Signature:**
```typescript
function clamp(value: number, min: number, max: number): number
```

**Example:**
```typescript
const value = clamp(15, 0, 10); // 10
```

---

### `lerp`
Linear interpolation between two values.

**Formula:**
$$ f(a, b, t) = a + t \cdot (b - a) $$

**Signature:**
```typescript
function lerp(a: number, b: number, t: number): number
```

---

### `distance_2d`
Euclidean distance between two 2D points.

**Formula:**
$$ d = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2} $$

**Signature:**
```typescript
function distance_2d(x1: number, y1: number, x2: number, y2: number): number
```

---

### `round_to_precision`
Rounds a number to a specific number of decimal places.

**Signature:**
```typescript
function round_to_precision(value: number, decimals: number): number
```
