use rayon::prelude::*;
use wasm_bindgen::prelude::*;

/// Calculates the arithmetic mean of a numeric sequence - Parallel
#[wasm_bindgen]
pub fn mean(data: &[f64]) -> f64 {
    let n = data.len();
    if n == 0 { return f64::NAN; }
    
    let sum: f64 = data.par_iter()
        .with_min_len(8192)
        .sum();
    sum / n as f64
}

/// Calculates the variance of a sample - Parallel
#[wasm_bindgen]
pub fn variance(data: &[f64]) -> f64 {
    let n = data.len();
    if n < 2 { return 0.0; }
    
    let m = mean(data);
    let ss_tot: f64 = data.par_iter()
        .with_min_len(8192)
        .map(|x| (x - m).powi(2))
        .sum();
    
    ss_tot / (n - 1) as f64
}

/// Calculates the standard deviation of a sample - Parallel
#[wasm_bindgen(js_name = standardDeviation)]
pub fn standard_deviation(data: &[f64]) -> f64 {
    variance(data).sqrt()
}

/// Finds the median value in a data set - Parallel
#[wasm_bindgen]
pub fn median(data: &[f64]) -> f64 {
    if data.is_empty() { return f64::NAN; }
    
    let mut sorted_data = data.to_vec();
    // Parallel unstable sort for high performance
    sorted_data.par_sort_unstable_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    
    let mid = sorted_data.len() / 2;
    if sorted_data.len() % 2 == 0 {
        (sorted_data[mid - 1] + sorted_data[mid]) / 2.0
    } else {
        sorted_data[mid]
    }
}
