# Complex Numbers

Basic arithmetic and utilities for complex number math via `SciMathJS`.

## API Reference

### `Complex` (Class)
Represents a complex number.

**Constructor:**
```typescript
new Complex(re: number, im: number)
```

**Methods:**
- `add(other: Complex): Complex`
- `mul(other: Complex): Complex`
- `magnitude(): number`
- `phase(): number`
- `free(): void`

**Static Methods:**
- `fromPolar(r: number, theta: number): Complex`
