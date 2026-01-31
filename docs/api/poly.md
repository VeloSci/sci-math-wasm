# Polynomials

Efficient evaluation and manipulation of polynomial functions.

## API Reference

### `poly_eval`
Evaluates a polynomial at a given $x$ using Horner's Method.

**Formula:**
$$ P(x) = a_n x^n + \cdots + a_1 x + a_0 $$

*Coefficients are expected in **ascending** order of degree ($a_0$ first).*

**Complexity:** $O(n)$

**Signature:**
```typescript
function poly_eval(coeffs: Float64Array, x: number): number
```

**Example:**
```typescript
// P(x) = 2x^2 + 3x + 1
// coeffs = [1, 3, 2] (constant term first)
const result = poly_eval(new Float64Array([1, 3, 2]), 2.0);
// 1 + 3(2) + 2(2^2) = 1 + 6 + 8 = 15
```

---

### `poly_derive`
Calculates the analytical derivative of a polynomial.

**Formula:**
$$ P'(x) = \sum i a_i x^{i-1} $$

**Signature:**
```typescript
function poly_derive(coeffs: Float64Array): Float64Array
```

---

### `poly_integrate`
Calculates the indefinite integral (antiderivative) of a polynomial given a constant $C$.

**Signature:**
```typescript
function poly_integrate(coeffs: Float64Array, c: number): Float64Array
```
