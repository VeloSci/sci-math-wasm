# Trigonometry

Helper functions for angular math and wave generation.

## API Reference

### `to_radians`
Converts degrees to radians.

**Formula:**
$$ \mathrm{rad} = \mathrm{deg} \cdot \frac{\pi}{180} $$

**Signature:**
```typescript
function to_radians(degrees: number): number
```

---

### `to_degrees`
Converts radians to degrees.

**Formula:**
$$ \mathrm{deg} = \mathrm{rad} \cdot \frac{180}{\pi} $$

**Signature:**
```typescript
function to_degrees(radians: number): number
```

---

### `sinc`
The normalized sinc function, common in signal processing.

**Formula:**
$$ \mathrm{sinc}(x) = \frac{\sin(\pi x)}{\pi x} $$
*(Returns 1.0 when x = 0)*

**Signature:**
```typescript
function sinc(x: number): number
```

---

### `hypot`
Calculates the hypotenuse of a right triangle safely avoiding overflow.

**Formula:**
$$ h = \sqrt{a^2 + b^2} $$

**Signature:**
```typescript
function hypot(a: number, b: number): number
```

---

### `wrap_angle`
Wraps an angle to be within the $[-\pi, \pi]$ range. Useful for steering behaviors and angular differences.

**Signature:**
```typescript
function wrap_angle(angle: number): number
```
