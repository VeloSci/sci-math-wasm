//! # Trigonometric Functions
//! 
//! Optimized trigonometric operations and coordinate conversions.

use wasm_bindgen::prelude::*;
use std::f64::consts::PI;

/// Converts degrees to radians.
/// 
/// $$ \text{rad} = \text{deg} \cdot \frac{\pi}{180} $$
#[wasm_bindgen]
pub fn to_radians(degrees: f64) -> f64 {
    degrees * PI / 180.0
}

/// Converts radians to degrees.
/// 
/// $$ \text{deg} = \text{rad} \cdot \frac{180}{\pi} $$
#[wasm_bindgen]
pub fn to_degrees(radians: f64) -> f64 {
    radians * 180.0 / PI
}

/// Sinc function (Normalized).
/// 
/// $$ \text{sinc}(x) = \frac{\sin(\pi x)}{\pi x} $$
/// 
/// Returns 1.0 when $x = 0$.
#[wasm_bindgen]
pub fn sinc(x: f64) -> f64 {
    if x == 0.0 {
        1.0
    } else {
        let px = PI * x;
        px.sin() / px
    }
}

/// Calculates the hypotenuse of a right-angled triangle.
/// 
/// $$ h = \sqrt{a^2 + b^2} $$
#[wasm_bindgen]
pub fn hypotenuse(a: f64, b: f64) -> f64 {
    a.hypot(b)
}

/// Wraps an angle to the range $[-\pi, \pi]$.
#[wasm_bindgen]
pub fn wrap_angle(angle: f64) -> f64 {
    let mut wrapped = angle % (2.0 * PI);
    if wrapped > PI {
        wrapped -= 2.0 * PI;
    } else if wrapped < -PI {
        wrapped += 2.0 * PI;
    }
    wrapped
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_to_radians_degrees_cycle() {
        let rad = to_radians(180.0);
        assert!((rad - PI).abs() < 1e-12);
        let deg = to_degrees(rad);
        assert!((deg - 180.0).abs() < 1e-12);
    }

    #[test]
    fn test_sinc_zero_and_value() {
        assert!((sinc(0.0) - 1.0).abs() < 1e-12);
        let v = sinc(1.0);
        assert!((v - (PI.sin() / PI)).abs() < 1e-12);
    }

    #[test]
    fn test_hypot_basic() {
        assert!((hypot(3.0, 4.0) - 5.0).abs() < 1e-12);
    }

    #[test]
    fn test_wrap_angle_range() {
        let wrapped = wrap_angle(3.0 * PI);
        assert!((wrapped - PI).abs() < 1e-6);
        let wrapped_neg = wrap_angle(-3.0 * PI);
        assert!((wrapped_neg + PI).abs() < 1e-6);
    }
}
