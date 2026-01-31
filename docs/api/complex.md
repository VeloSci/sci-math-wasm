# Complex Numbers

Support for arithmetic with complex numbers.

## `Complex` Class

### constructor
```typescript
new Complex(re: number, im: number)
```

### Methods

- **`add(other: Complex): Complex`**: Addition.
- **`mul(other: Complex): Complex`**: Multiplication.
- **`magnitude(): number`**: Absolute value $|z|$.
- **`phase(): number`**: Phase angle $\theta$ in radians.

### Static Methods

- **`from_polar(r: number, theta: number): Complex`**: Creates a complex number from polar form $r e^{i\theta}$.

## Example
```typescript
import { Complex } from 'sci-math-wasm';

const z1 = new Complex(1, 1);
const z2 = new Complex(2, -1);
const z3 = z1.mul(z2);

console.log(`Real: ${z3.re}, Imaginary: ${z3.im}`);
```
