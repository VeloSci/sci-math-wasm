# Optimization

Optimization algorithms for finding global or local minima of functions.

## Usage

```typescript
import { genetic_algorithm } from '@velo-sci/sci-math-wasm';

const f = (input: number[]) => input[0] * input[0] + input[1] * input[1];
const bounds = new Float64Array([-10, 10, -10, 10]); // Bounds for x and y
const solution = genetic_algorithm(f, bounds, 100, 50, 0.1);
console.log('Optimum:', solution); // Should be close to [0, 0]
```

## API Reference

### `genetic_algorithm`
A robust Genetic Algorithm (GA) implementation for finding the global minimum of a multi-dimensional function. It uses tournament selection, single-point crossover, and random mutation, with elitism to preserve the best solution.

**Parameters:**
- `f`: The objective function to minimize. It receives an array of numbers (the candidate solution) and returns a single number (score/loss).
- `bounds`: A flat `Float64Array` defining min/max for each dimension. Format: `[min1, max1, min2, max2, ...]`
- `pop_size`: Size of the population (e.g., 50-100).
- `generations`: Number of generations to run (e.g., 50-1000).
- `mutation_rate`: Probability of mutation for each gene (e.g., 0.05 - 0.1).

**Returns:**
- `Float64Array`: The best solution vector found.

**Signature:**
```typescript
function genetic_algorithm(
    f: (args: number[]) => number, 
    bounds: Float64Array, 
    pop_size: number, 
    generations: number, 
    mutation_rate: number
): Float64Array
```

---

### `minimize_nelder_mead`
Downhill Simplex (Nelder-Mead) algorithm for local optimization. Best for non-linear optimization where derivatives are not available.

**Signature:**
```typescript
function minimize_nelder_mead(
    f: (args: number[]) => number,
    x0: Float64Array | number[],
    tol: number,
    max_iters: number
): Float64Array
```

---

### `least_squares`
Solves a linear least squares problem $Ax = B$ for overdetermined systems.

**Signature:**
```typescript
function least_squares(
    a: Float64Array | number[], 
    b: Float64Array | number[], 
    rows: number, 
    cols: number
): Float64Array
```

