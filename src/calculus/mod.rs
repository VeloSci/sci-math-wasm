//! # Numerical Calculus
//! 
//! Numerical differentiation and integration methods.

use wasm_bindgen::prelude::*;

/// Calculates the numerical derivative of a discrete signal using central difference.
/// 
/// $$ f'(x_i) \approx \frac{f(x_{i+1}) - f(x_{i-1})}{2h} $$
/// 
/// # Arguments
/// * `y` - Data points.
/// * `dx` - Spacing between points.
/// 
/// # Returns
/// A vector of the same length as `y`. Boundary points use forward/backward difference.
#[wasm_bindgen]
pub fn derivative(y: &[f64], dx: f64) -> Vec<f64> {
    let n = y.len();
    if n < 2 {
        return vec![0.0; n];
    }
    
    let mut dy = Vec::with_capacity(n);
    
    // Forward difference for the first point
    dy.push((y[1] - y[0]) / dx);
    
    // Central difference for interior points
    for i in 1..(n - 1) {
        dy.push((y[i + 1] - y[i - 1]) / (2.0 * dx));
    }
    
    // Backward difference for the last point
    dy.push((y[n - 1] - y[n - 2]) / dx);
    
    dy
}

/// Computes the definite integral of a signal using the Trapezoidal rule.
/// 
/// $$ \int_a^b f(x) dx \approx \frac{\Delta x}{2} \sum_{i=1}^{n} (f(x_{i-1}) + f(x_i)) $$
/// 
/// # Arguments
/// * `y` - Data points.
/// * `dx` - Spacing between points.
#[wasm_bindgen]
pub fn integrate_trapezoidal(y: &[f64], dx: f64) -> f64 {
    if y.len() < 2 {
        return 0.0;
    }
    
    let sum: f64 = y.windows(2)
        .map(|w| w[0] + w[1])
        .sum();
        
    (dx / 2.0) * sum
}

/// Computes the cumulative integral of a signal.
/// 
/// # Returns
/// Vector where each point $i$ is the integral from 0 to $i$.
#[wasm_bindgen]
pub fn cumulative_integrate(y: &[f64], dx: f64) -> Vec<f64> {
    let mut result = Vec::with_capacity(y.len());
    let mut sum = 0.0;
    result.push(0.0);
    
    for w in y.windows(2) {
        sum += (dx / 2.0) * (w[0] + w[1]);
        result.push(sum);
    }
    
    result
}
