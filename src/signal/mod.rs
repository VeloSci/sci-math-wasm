//! # Signal Processing
//! 
//! Tools for signal analysis, including transforms and filters.

use wasm_bindgen::prelude::*;
use num_complex::Complex64;
use std::f64::consts::PI;

/// Performs a Fast Fourier Transform (FFT) on a real-valued signal.
/// 
/// The output is a flat array of alternating real and imaginary parts:
/// `[re0, im0, re1, im1, ...]`
/// 
/// $$ X_k = \sum_{n=0}^{N-1} x_n e^{-\frac{i2\pi}{N} kn} $$
/// 
/// # Arguments
/// * `input` - Real-valued input signal. Length must be a power of two.
/// 
/// # Returns
/// Flat array of complex numbers (size $2N$).
#[wasm_bindgen]
pub fn fft(input: &[f64]) -> Result<Vec<f64>, JsValue> {
    let n = input.len();
    if !n.is_power_of_two() {
        return Err(JsValue::from_str("Input length must be a power of two"));
    }

    let mut complex_input: Vec<Complex64> = input.iter()
        .map(|&x| Complex64::new(x, 0.0))
        .collect();

    cooley_tukey(&mut complex_input);

    let mut output = Vec::with_capacity(n * 2);
    for c in complex_input {
        output.push(c.re);
        output.push(c.im);
    }

    Ok(output)
}

fn cooley_tukey(a: &mut [Complex64]) {
    let n = a.len();
    if n <= 1 {
        return;
    }

    let mut even: Vec<Complex64> = a.iter().step_by(2).copied().collect();
    let mut odd: Vec<Complex64> = a.iter().skip(1).step_by(2).copied().collect();

    cooley_tukey(&mut even);
    cooley_tukey(&mut odd);

    for k in 0..n / 2 {
        let angle = -2.0 * PI * k as f64 / n as f64;
        let t = Complex64::from_polar(1.0, angle) * odd[k];
        a[k] = even[k] + t;
        a[k + n / 2] = even[k] - t;
    }
}

/// Computes the magnitude of a complex FFT result.
/// 
/// $$ |X_k| = \sqrt{Re(X_k)^2 + Im(X_k)^2} $$
/// 
/// # Arguments
/// * `complex_data` - Flat array `[re0, im0, ...]`
#[wasm_bindgen]
pub fn magnitude(complex_data: &[f64]) -> Vec<f64> {
    complex_data.chunks_exact(2)
        .map(|chunk| {
            let re = chunk[0];
            let im = chunk[1];
            (re * re + im * im).sqrt()
        })
        .collect()
}

/// Applies a moving average filter to smoothing out a signal.
/// 
/// $$ y[n] = \frac{1}{W} \sum_{i=0}^{W-1} x[n-i] $$
/// 
/// # Arguments
/// * `data` - Input signal.
/// * `window_size` - Size of the averaging window.
#[wasm_bindgen]
pub fn moving_average(data: &[f64], window_size: usize) -> Vec<f64> {
    if window_size <= 1 || data.len() < window_size {
        return data.to_vec();
    }

    let mut result = Vec::with_capacity(data.len());
    for i in 0..data.len() {
        let start = if i < window_size / 2 { 0 } else { i - window_size / 2 };
        let end = (start + window_size).min(data.len());
        let slice = &data[start..end];
        let sum: f64 = slice.iter().sum();
        result.push(sum / slice.len() as f64);
    }
    result
}

/// Simple peak detection based on local maxima and a threshold.
/// 
/// # Arguments
/// * `data` - Input signal.
/// * `threshold` - Minimum height for a peak to be considered.
/// 
/// # Returns
/// Array of indices where peaks were found.
#[wasm_bindgen]
pub fn find_peaks(data: &[f64], threshold: f64) -> Vec<usize> {
    let mut peaks = Vec::new();
    if data.len() < 3 {
        return peaks;
    }

    for i in 1..(data.len() - 1) {
        if data[i] > data[i - 1] && data[i] > data[i + 1] && data[i] >= threshold {
            peaks.push(i);
        }
    }
    peaks
}
