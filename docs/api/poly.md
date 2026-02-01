# Polynomials

Tools for polynomial evaluation, differentiation, and integration via `SciMathJS`.

## API Reference

### `polyEval`
Evaluates a polynomial at a given point using Horner's method.

**Signature:**
```typescript
function polyEval(coeffs: Float64Array | number[], x: number): number
```

---

### `polyDerive`
Calculates the derivative of a polynomial.

**Signature:**
```typescript
function polyDerive(coeffs: Float64Array | number[]): Float64Array
```

---

### `polyIntegrate`
Calculates the indefinite integral of a polynomial.

**Signature:**
```typescript
function polyIntegrate(coeffs: Float64Array | number[], c: number): Float64Array
```
