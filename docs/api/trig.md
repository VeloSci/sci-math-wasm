# Trigonometry

Trigonometric functions and unit conversions via `SciMathJS`.

## API Reference

### `toRadians` / `toDegrees`
Convert between degrees and radians.

**Signatures:**
```typescript
function toRadians(degrees: number): number
function toDegrees(radians: number): number
```

---

### `sinc`
Normalized sinc function.

**Formula:**
$$ \text{sinc}(x) = \frac{\sin(\pi x)}{\pi x} $$

**Signature:**
```typescript
function sinc(x: number): number
```

---

### `hypot`
Calculates the hypotenuse of a right-angled triangle.

**Formula:**
$$ h = \sqrt{a^2 + b^2} $$

**Signature:**
```typescript
function hypot(a: number, b: number): number
```

---

### `wrapAngle`
Wraps an angle to the range $[-\pi, \pi)$.

**Signature:**
```typescript
function wrapAngle(angle: number): number
```
