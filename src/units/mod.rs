//! # Unit Conversions
//! 
//! Utilities for converting between scientific units.

use wasm_bindgen::prelude::*;

/// Temperature conversion: Celsius to Fahrenheit.
#[wasm_bindgen(js_name = celsiusToFahrenheit)]
pub fn celsius_to_fahrenheit(c: f64) -> f64 {
    c * 1.8 + 32.0
}

/// Temperature conversion: Fahrenheit to Celsius.
#[wasm_bindgen(js_name = fahrenheitToCelsius)]
pub fn fahrenheit_to_celsius(f: f64) -> f64 {
    (f - 32.0) / 1.8
}

/// Temperature conversion: Celsius to Kelvin.
#[wasm_bindgen(js_name = celsiusToKelvin)]
pub fn celsius_to_kelvin(c: f64) -> f64 {
    c + 273.15
}

/// Pressure conversion: Pascal to Bar.
#[wasm_bindgen(js_name = pascalToBar)]
pub fn pascal_to_bar(pa: f64) -> f64 {
    pa / 100_000.0
}

/// Pressure conversion: Bar to Pascal.
#[wasm_bindgen(js_name = barToPascal)]
pub fn bar_to_pascal(bar: f64) -> f64 {
    bar * 100_000.0
}

/// Distance conversion: Meters to Inches.
#[wasm_bindgen(js_name = metersToInches)]
pub fn meters_to_inches(m: f64) -> f64 {
    m * 39.3701
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_temperature_conversions() {
        assert!((celsius_to_fahrenheit(0.0) - 32.0).abs() < 1e-12);
        assert!((fahrenheit_to_celsius(32.0) - 0.0).abs() < 1e-12);
        assert!((celsius_to_kelvin(25.0) - 298.15).abs() < 1e-12);
    }

    #[test]
    fn test_pressure_conversions() {
        assert!((pascal_to_bar(100_000.0) - 1.0).abs() < 1e-12);
        assert!((bar_to_pascal(1.0) - 100_000.0).abs() < 1e-12);
    }

    #[test]
    fn test_distance_conversion() {
        assert!((meters_to_inches(1.0) - 39.3701).abs() < 1e-6);
    }
}
