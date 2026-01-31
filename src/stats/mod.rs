//! # Statistical Functions
//! 
//! Collection of statistical analysis tools for data processing.

use wasm_bindgen::prelude::*;

/// Calculates the arithmetic mean of a numeric sequence.
/// 
/// $$ \bar{x} = \frac{1}{n} \sum_{i=1}^{n} x_i $$
/// 
/// # Arguments
/// * `data` - A slice of floating point numbers.
/// 
/// # Errors
/// Returns `NaN` if the input sequence is empty.
#[wasm_bindgen]
pub fn mean(data: &[f64]) -> f64 {
    if data.is_empty() {
        return f64::NAN;
    }
    let sum: f64 = data.iter().sum();
    sum / data.len() as f64
}

/// Calculates the variance of a sample.
/// 
/// $$ s^2 = \frac{\sum (x_i - \bar{x})^2}{n - 1} $$
/// 
/// # Arguments
/// * `data` - A slice of floating point numbers.
#[wasm_bindgen]
pub fn variance(data: &[f64]) -> f64 {
    if data.len() < 2 {
        return 0.0;
    }
    let m = mean(data);
    let variance = data.iter()
        .map(|value| {
            let diff = value - m;
            diff * diff
        })
        .sum::<f64>() / (data.len() - 1) as f64;
    
    variance
}

/// Calculates the standard deviation of a sample.
/// 
/// $$ \sigma = \sqrt{s^2} $$
#[wasm_bindgen]
pub fn standard_deviation(data: &[f64]) -> f64 {
    variance(data).sqrt()
}

/// Finds the median value in a data set.
/// 
/// Note: This operation clones the data to perform sorting, which has a complexity of $O(n \log n)$.
#[wasm_bindgen]
pub fn median(data: &[f64]) -> f64 {
    if data.is_empty() {
        return f64::NAN;
    }
    
    let mut sorted_data = data.to_vec();
    // Sort handling NaNs by placing them at the end
    sorted_data.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    
    let mid = sorted_data.len() / 2;
    if sorted_data.len() % 2 == 0 {
        (sorted_data[mid - 1] + sorted_data[mid]) / 2.0
    } else {
        sorted_data[mid]
    }
}
