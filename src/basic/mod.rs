//! # Basic Mathematical Operations
//! 
//! This module provides fundamental arithmetic and utility functions
//! optimized for performance in WebAssembly environments.

use wasm_bindgen::prelude::*;

/// Clamps a value between a minimum and maximum range.
/// 
/// The mathematical representation is:
/// $$ f(x, \min, \max) = \max(\min, \min(x, \max)) $$
/// 
/// # Arguments
/// * `value` - The value to clamp.
/// * `min` - The lower bound.
/// * `max` - The upper bound.
/// 
/// # Examples
/// ```typescript
/// const result = math.clamp(15, 0, 10); // returns 10
/// ```
#[wasm_bindgen]
pub fn clamp(value: f64, min: f64, max: f64) -> f64 {
    if value < min {
        min
    } else if value > max {
        max
    } else {
        value
    }
}

/// Linear interpolation between two values.
/// 
/// The formula used is:
/// $$ f(a, b, t) = a + t \cdot (b - a) $$
/// 
/// # Arguments
/// * `a` - Start value.
/// * `b` - End value.
/// * `t` - Interpolation factor (usually between 0.0 and 1.0).
/// 
/// # Complexity
/// $O(1)$
#[wasm_bindgen]
pub fn lerp(a: f64, b: f64, t: f64) -> f64 {
    a + t * (b - a)
}

/// Calculates the Euclidean distance between two 2D points.
/// 
/// $$ d = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2} $$
/// 
/// # Arguments
/// * `x1`, `y1` - Coordinates of the first point.
/// * `x2`, `y2` - Coordinates of the second point.
#[wasm_bindgen(js_name = distance2D)]
pub fn distance_2d(x1: f64, y1: f64, x2: f64, y2: f64) -> f64 {
    ((x2 - x1).powi(2) + (y2 - y1).powi(2)).sqrt()
}

/// Rounds a number to a specific number of decimal places.
/// 
/// # Arguments
/// * `value` - The number to round.
/// * `decimals` - Precision (number of fractional digits).
#[wasm_bindgen(js_name = roundToPrecision)]
pub fn round_to_precision(value: f64, decimals: u32) -> f64 {
    let factor = 10f64.powi(decimals as i32);
    (value * factor).round() / factor
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_clamp_bounds() {
        assert_eq!(clamp(5.0, 0.0, 10.0), 5.0);
        assert_eq!(clamp(-2.0, 0.0, 10.0), 0.0);
        assert_eq!(clamp(12.0, 0.0, 10.0), 10.0);
    }

    #[test]
    fn test_lerp_midpoint() {
        assert_eq!(lerp(0.0, 10.0, 0.5), 5.0);
        assert_eq!(lerp(10.0, 20.0, 0.0), 10.0);
        assert_eq!(lerp(10.0, 20.0, 1.0), 20.0);
    }

    #[test]
    fn test_distance_2d() {
        let d = distance_2d(0.0, 0.0, 3.0, 4.0);
        assert!((d - 5.0).abs() < 1e-12);
    }

    #[test]
    fn test_round_to_precision() {
        assert_eq!(round_to_precision(3.14159, 2), 3.14);
        assert_eq!(round_to_precision(3.145, 2), 3.15);
    }
}
