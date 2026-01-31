# Regression Analysis

Fitting mathematical models to observed data.

## API Reference

### `linear_regression`
Performs a Simple Linear Regression ($y = mx + b$).

**Formulas:**
$$ m = \frac{n\sum xy - \sum x \sum y}{n\sum x^2 - (\sum x)^2} $$

$$ b = \frac{\sum y - m\sum x}{n} $$

**Signature:**
```typescript
function linear_regression(x: Float64Array, y: Float64Array): LinearRegressionResult
```

**Returns Object:**
```typescript
interface LinearRegressionResult {
  slope: number;
  intercept: number;
  r_squared: number;
}
```

**Example:**
```typescript
const x = new Float64Array([1, 2, 3, 4]);
const y = new Float64Array([2, 4, 5, 4]);
const result = linear_regression(x, y);
console.log(`Model: y = ${result.slope}x + ${result.intercept}`);
```
