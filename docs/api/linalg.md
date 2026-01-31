# Linear Algebra

Vector and Matrix operations optimized for continuous memory layouts.

## API Reference

### `dot_product`
Calculates the scalar product of two vectors.

**Formula:**
$$ \mathbf{a} \cdot \mathbf{b} = \sum_{i=1}^{n} a_i b_i $$

**Signature:**
```typescript
function dot_product(a: Float64Array, b: Float64Array): number
```

---

### `normalize`
Returns the unit vector direction of the input vector.

**Formula:**
$$ \mathbf{\hat{V}} = \frac{\mathbf{V}}{\|\mathbf{V}\|} $$

**Signature:**
```typescript
function normalize(v: Float64Array): Float64Array
```

---

### `matrix_multiply`
Multiplies two matrices stored as flat arrays (row-major).

**Formula:**
$$ C_{ij} = \sum_{k=1}^{n} A_{ik} B_{kj} $$

**Signature:**
```typescript
function matrix_multiply(
  a: Float64Array, 
  rows_a: number, 
  cols_a: number, 
  b: Float64Array, 
  rows_b: number, 
  cols_b: number
): Float64Array
```

**Example:**
```typescript
// Multiply 2x2 Identity by 2x2 Matrix
const A = new Float64Array([1, 0, 0, 1]);
const B = new Float64Array([1, 2, 3, 4]);
const C = matrix_multiply(A, 2, 2, B, 2, 2);
// C => [1, 2, 3, 4]
```
