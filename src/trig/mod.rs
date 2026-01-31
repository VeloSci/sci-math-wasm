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
pub fn hypot(a: f64, b: f64) -> f64 {
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
