//! # Unit Conversions
//! 
//! Utilities for converting between scientific units.

use wasm_bindgen::prelude::*;

/// Temperature conversion: Celsius to Fahrenheit.
#[wasm_bindgen]
pub fn celsius_to_fahrenheit(c: f64) -> f64 {
    c * 1.8 + 32.0
}

/// Temperature conversion: Fahrenheit to Celsius.
#[wasm_bindgen]
pub fn fahrenheit_to_celsius(f: f64) -> f64 {
    (f - 32.0) / 1.8
}

/// Temperature conversion: Celsius to Kelvin.
#[wasm_bindgen]
pub fn celsius_to_kelvin(c: f64) -> f64 {
    c + 273.15
}

/// Pressure conversion: Pascal to Bar.
#[wasm_bindgen]
pub fn pascal_to_bar(pa: f64) -> f64 {
    pa / 100_000.0
}

/// Pressure conversion: Bar to Pascal.
#[wasm_bindgen]
pub fn bar_to_pascal(bar: f64) -> f64 {
    bar * 100_000.0
}

/// Distance conversion: Meters to Inches.
#[wasm_bindgen]
pub fn meters_to_inches(m: f64) -> f64 {
    m * 39.3701
}
