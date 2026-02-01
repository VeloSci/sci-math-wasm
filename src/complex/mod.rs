//! # Complex Numbers
//! 
//! Basic arithmetic and utilities for complex number math.

use wasm_bindgen::prelude::*;
use num_complex::Complex64;

/// A complex number with real and imaginary parts.
#[wasm_bindgen]
#[derive(Copy, Clone)]
pub struct Complex {
    pub re: f64,
    pub im: f64,
}

#[wasm_bindgen]
impl Complex {
    #[wasm_bindgen(constructor)]
    pub fn new(re: f64, im: f64) -> Complex {
        Complex { re, im }
    }

    /// Adds another complex number.
    pub fn add(&self, other: &Complex) -> Complex {
        Complex {
            re: self.re + other.re,
            im: self.im + other.im,
        }
    }

    /// Multiplies by another complex number.
    /// 
    /// $$ (a + bi)(c + di) = (ac - bd) + (ad + bc)i $$
    pub fn mul(&self, other: &Complex) -> Complex {
        let c1 = Complex64::new(self.re, self.im);
        let c2 = Complex64::new(other.re, other.im);
        let res = c1 * c2;
        Complex { re: res.re, im: res.im }
    }

    /// Returns the magnitude (norm) of the complex number.
    /// 
    /// $$ |z| = \sqrt{a^2 + b^2} $$
    pub fn magnitude(&self) -> f64 {
        (self.re * self.re + self.im * self.im).sqrt()
    }

    /// Returns the phase (argument) in radians.
    pub fn phase(&self) -> f64 {
        self.im.atan2(self.re)
    }

    /// Creates a complex number from polar coordinates.
    /// 
    /// $$ z = r(\cos \theta + i \sin \theta) $$
    pub fn from_polar(r: f64, theta: f64) -> Complex {
        let res = Complex64::from_polar(r, theta);
        Complex { re: res.re, im: res.im }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::f64::consts::PI;

    #[test]
    fn test_add_and_mul() {
        let a = Complex::new(1.0, 2.0);
        let b = Complex::new(3.0, 4.0);
        let sum = a.add(&b);
        assert_eq!(sum.re, 4.0);
        assert_eq!(sum.im, 6.0);

        let prod = a.mul(&b);
        assert_eq!(prod.re, -5.0);
        assert_eq!(prod.im, 10.0);
    }

    #[test]
    fn test_magnitude_and_phase() {
        let z = Complex::new(0.0, 1.0);
        assert!((z.magnitude() - 1.0).abs() < 1e-12);
        assert!((z.phase() - PI / 2.0).abs() < 1e-12);
    }

    #[test]
    fn test_from_polar_roundtrip() {
        let z = Complex::from_polar(2.0, PI / 3.0);
        assert!((z.magnitude() - 2.0).abs() < 1e-12);
        assert!((z.phase() - PI / 3.0).abs() < 1e-12);
    }
}
