//! # Polynomial Operations
//! 
//! Evaluation and manipulation of polynomials.

use wasm_bindgen::prelude::*;

/// Evaluates a polynomial at point $x$ using Horner's method.
/// 
/// The polynomial is defined by its coefficients $[a_0, a_1, \dots, a_n]$ representing:
/// $$ P(x) = a_n x^n + a_{n-1} x^{n-1} + \dots + a_1 x + a_0 $$
/// 
/// # Arguments
/// * `coeffs` - Coefficients in ascending order of degree (index 0 is constant term).
/// * `x` - The value to evaluate at.
/// 
/// # Complexity
/// $O(n)$ where $n$ is the degree.
#[wasm_bindgen]
pub fn poly_eval(coeffs: &[f64], x: f64) -> f64 {
    if coeffs.is_empty() {
        return 0.0;
    }
    // Horner's method
    coeffs.iter().rev().fold(0.0, |acc, &c| acc * x + c)
}

/// Calculates the derivative of a polynomial.
/// 
/// If $P(x) = \sum a_i x^i$, then $P'(x) = \sum i a_i x^{i-1}$.
/// 
/// # Returns
/// New coefficients for the derived polynomial.
#[wasm_bindgen]
pub fn poly_derive(coeffs: &[f64]) -> Vec<f64> {
    if coeffs.len() <= 1 {
        return vec![0.0];
    }
    coeffs.iter().enumerate().skip(1)
        .map(|(i, &c)| c * i as f64)
        .collect()
}

/// Integuerates a polynomial with a constant $C$.
/// 
/// # Arguments
/// * `coeffs` - Original coefficients.
/// * `c` - Integration constant.
#[wasm_bindgen]
pub fn poly_integrate(coeffs: &[f64], c: f64) -> Vec<f64> {
    let mut integrated = vec![c];
    for (i, &val) in coeffs.iter().enumerate() {
        integrated.push(val / (i + 1) as f64);
    }
    integrated
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_poly_eval_horner() {
        let coeffs = [1.0, 0.0, 2.0]; // 2x^2 + 1
        let val = poly_eval(&coeffs, 2.0);
        assert_eq!(val, 9.0);
    }

    #[test]
    fn test_poly_derive() {
        let coeffs = [1.0, 2.0, 3.0]; // 3x^2 + 2x + 1
        let d = poly_derive(&coeffs);
        assert_eq!(d, vec![2.0, 6.0]); // 6x + 2
    }

    #[test]
    fn test_poly_integrate_with_constant() {
        let coeffs = [1.0, 2.0]; // 2x + 1
        let integrated = poly_integrate(&coeffs, 5.0);
        assert_eq!(integrated, vec![5.0, 1.0, 1.0]);
    }
}
