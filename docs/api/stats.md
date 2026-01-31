# Statistical Functions

Collection of statistical analysis tools for data processing.

## API Reference

### `mean`
Calculates the arithmetic mean of a sequence.

**Formula:**
$$ \bar{x} = \frac{1}{n} \sum_{i=1}^{n} x_i $$

**Signature:**
```typescript
function mean(data: Float64Array): number
```

---

### `median`
Finds the median value in a data set.

**Complexity:** $O(n \log n)$

**Signature:**
```typescript
function median(data: Float64Array): number
```

---

### `variance`
Calculates the sample variance ($n-1$).

**Formula:**
$$ s^2 = \frac{\sum (x_i - \bar{x})^2}{n - 1} $$

**Signature:**
```typescript
function variance(data: Float64Array): number
```

---

### `standard_deviation`
Calculates the sample standard deviation.

**Formula:**
$$ \sigma = \sqrt{s^2} $$

**Signature:**
```typescript
function standard_deviation(data: Float64Array): number
```
