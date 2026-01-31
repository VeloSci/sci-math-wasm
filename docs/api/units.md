# Unit Conversions

Standard utilities for physical unit conversions.

## API Reference

### Temperature
*   `celsius_to_fahrenheit(c: number): number`
*   `fahrenheit_to_celsius(f: number): number`
*   `celsius_to_kelvin(c: number): number`

### Pressure
*   `pascal_to_bar(pa: number): number`
*   `bar_to_pascal(bar: number): number`

### Distance
*   `meters_to_inches(m: number): number`

## Example

```typescript
import { celsius_to_fahrenheit } from 'sci-math-wasm';

const tempC = 25.0;
const tempF = celsius_to_fahrenheit(tempC);
console.log(`${tempC}°C is ${tempF}°F`);
```
