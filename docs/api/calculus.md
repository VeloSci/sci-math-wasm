# Numerical Calculus

Tools for differentiation and integration of discrete data.

## API Reference

### `derivative`
Calculates the numerical derivative using central difference.

**Formula:**
$$ f'(x_i) \approx \frac{f(x_{i+1}) - f(x_{i-1})}{2h} $$

**Signature:**
```typescript
function derivative(y: Float64Array, dx: number): Float64Array
```

---

### `integrate_trapezoidal`
Definite integration using the Trapezoidal rule.

**Formula:**
$$ \int_a^b f(x) dx \approx \frac{\Delta x}{2} \sum_{i=1}^{n} (f(x_{i-1}) + f(x_i)) $$

**Signature:**
```typescript
function integrate_trapezoidal(y: Float64Array, dx: number): number
```

---

### `cumulative_integrate`
Calculates the cumulative integral of a signal.

**Signature:**
```typescript
function cumulative_integrate(y: Float64Array, dx: number): Float64Array
```
