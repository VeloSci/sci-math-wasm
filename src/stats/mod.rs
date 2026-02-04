use rayon::prelude::*;
use wasm_bindgen::prelude::*;

/// Calculates the arithmetic mean of a numeric sequence.
///
/// Use this for basic average calculations on `Float64Array`.
///
/// $$ \bar{x} = \frac{1}{n} \sum_{i=1}^n x_i $$
#[wasm_bindgen]
pub fn mean(data: &[f64]) -> f64 {
    let n = data.len();
    if n == 0 { return f64::NAN; }
    
    let sum: f64 = data.par_iter()
        .with_min_len(8192)
        .sum();
    sum / n as f64
}

/// Calculates the sample variance of a numeric sequence.
///
/// $$ s^2 = \frac{1}{n-1} \sum_{i=1}^n (x_i - \bar{x})^2 $$
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

/// Calculates the sample standard deviation of a numeric sequence.
///
/// $$ s = \sqrt{s^2} $$
#[wasm_bindgen(js_name = standardDeviation)]
pub fn standard_deviation(data: &[f64]) -> f64 {
    variance(data).sqrt()
}

/// Finds the median value in a data set.
///
/// Performs a parallel unstable sort to find the middle value.
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

/// Calculates the sample covariance between two numeric sequences.
///
/// $$ cov(X, Y) = \frac{1}{n-1} \sum_{i=1}^n (x_i - \bar{x})(y_i - \bar{y}) $$
#[wasm_bindgen]
pub fn covariance(x: &[f64], y: &[f64]) -> Result<f64, JsValue> {
    let n = x.len();
    if n != y.len() {
        return Err(JsValue::from_str("Vectors must have the same length"));
    }
    if n < 2 { return Ok(0.0); }
    
    let mx = mean(x);
    let my = mean(y);
    
    let sum_prod: f64 = x.par_iter().zip(y.par_iter())
        .with_min_len(8192)
        .map(|(&xi, &yi)| (xi - mx) * (yi - my))
        .sum();
    
    Ok(sum_prod / (n - 1) as f64)
}

/// Calculates the Pearson correlation coefficient between two numeric sequences.
///
/// $$ r_{xy} = \frac{cov(X, Y)}{s_x s_y} $$
#[wasm_bindgen]
pub fn correlation(x: &[f64], y: &[f64]) -> Result<f64, JsValue> {
    let n = x.len();
    if n != y.len() {
        return Err(JsValue::from_str("Vectors must have the same length"));
    }
    if n < 2 { return Ok(0.0); }
    
    let cov = covariance(x, y)?;
    let sx = standard_deviation(x);
    let sy = standard_deviation(y);
    
    if sx == 0.0 || sy == 0.0 { return Ok(0.0); }
    Ok(cov / (sx * sy))
}

/// Calculates a histogram of the data - Parallel
#[wasm_bindgen]
pub fn histogram(data: &[f64], bins: usize) -> Vec<u32> {
    if data.is_empty() || bins == 0 { return vec![]; }
    
    let mut min = data[0];
    let mut max = data[0];
    for &x in data {
        if x < min { min = x; }
        if x > max { max = x; }
    }
    
    if min == max {
        let mut res = vec![0; bins];
        res[0] = data.len() as u32;
        return res;
    }
    
    let range = max - min;
    let bin_width = range / bins as f64;
    
    // Parallel counting using atomic-like structure or just chunks + merge
    // For now, simple thread-local histograms and then merge
    let chunk_size = (data.len() / rayon::current_num_threads().max(1)).max(1024);
    
    data.par_chunks(chunk_size)
        .map(|chunk| {
            let mut local_counts = vec![0u32; bins];
            for &x in chunk {
                let bin_idx = (((x - min) / bin_width).floor() as usize).min(bins - 1);
                local_counts[bin_idx] += 1;
            }
            local_counts
        })
        .reduce(|| vec![0u32; bins], |mut acc, local| {
            for i in 0..bins {
                acc[i] += local[i];
            }
            acc
        })
}

/// Calculates the p-th percentile of a data set.
/// p is between 0 and 100.
#[wasm_bindgen]
pub fn percentile(data: &[f64], p: f64) -> f64 {
    if data.is_empty() { return f64::NAN; }
    if p <= 0.0 { return data.iter().fold(f64::INFINITY, |a, &b| a.min(b)); }
    if p >= 100.0 { return data.iter().fold(f64::NEG_INFINITY, |a, &b| a.max(b)); }
    
    let mut sorted_data = data.to_vec();
    sorted_data.par_sort_unstable_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    
    let n = sorted_data.len();
    let pos = p / 100.0 * (n - 1) as f64;
    let base = pos.floor() as usize;
    let rest = pos - base as f64;
    
    if base + 1 < n {
        sorted_data[base] + rest * (sorted_data[base + 1] - sorted_data[base])
    } else {
        sorted_data[base]
    }
}

/// Finds the most frequent value in a data set.
#[wasm_bindgen]
pub fn mode(data: &[f64]) -> f64 {
    if data.is_empty() { return f64::NAN; }
    let mut sorted_data = data.to_vec();
    sorted_data.par_sort_unstable_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    
    let mut max_count = 0;
    let mut mode_val = sorted_data[0];
    let mut current_count = 1;
    
    for i in 1..sorted_data.len() {
        if (sorted_data[i] - sorted_data[i-1]).abs() < 1e-10 {
            current_count += 1;
        } else {
            if current_count > max_count {
                max_count = current_count;
                mode_val = sorted_data[i-1];
            }
            current_count = 1;
        }
    }
    
    if current_count > max_count {
        mode_val = sorted_data[sorted_data.len() - 1];
    }
    
    mode_val
}

/// Calculates the skewness of a data set.
#[wasm_bindgen]
pub fn skewness(data: &[f64]) -> f64 {
    let n = data.len();
    if n < 3 { return 0.0; }
    
    let m = mean(data);
    let s = standard_deviation(data);
    if s == 0.0 { return 0.0; }
    
    let sum_cubed: f64 = data.par_iter()
        .map(|&x| ((x - m) / s).powi(3))
        .sum();
    
    (n as f64 / ((n - 1) as f64 * (n - 2) as f64)) * sum_cubed
}

/// Calculates the kurtosis (excess) of a data set.
#[wasm_bindgen]
pub fn kurtosis(data: &[f64]) -> f64 {
    let n = data.len();
    if n < 4 { return 0.0; }
    
    let m = mean(data);
    let s = standard_deviation(data);
    if s == 0.0 { return 0.0; }
    
    let sum_fourth: f64 = data.par_iter()
        .map(|&x| ((x - m) / s).powi(4))
        .sum();
    
    let term1 = (n as f64 * (n + 1) as f64) / ((n - 1) as f64 * (n - 2) as f64 * (n - 3) as f64);
    let term2 = (3.0 * (n - 1) as f64).powi(2) / ((n - 2) as f64 * (n - 3) as f64);
    
    term1 * sum_fourth - term2
}
