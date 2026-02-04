# Symbolic Math

Symbolic mathematics and expression manipulation.

## Usage

```typescript
import { SymbolicExpr } from '@velo-sci/sci-math-wasm';

const expr = SymbolicExpr.parse("sin(x) + 2*x^2");
const latex = expr.to_latex();
console.log(latex); // \sin(x) + 2 \cdot x^{2}
```

## API Reference

### `SymbolicExpr`
A wrapper around the symbolic expression engine.

#### `parse(input: string): SymbolicExpr`
Parses a string mathematical expression into a symbolic tree.

#### `to_latex(): string`
Converts the symbolic expression into a LaTeX formatted string, suitable for rendering with MathJax or KaTeX.

#### `free()`
Releases the memory associated with the expression.
