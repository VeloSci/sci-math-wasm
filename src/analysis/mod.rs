use wasm_bindgen::prelude::*;

pub mod smooth_sg;
pub mod peak_detection;
pub mod baseline;
pub mod deconvolve;
pub mod filters;
pub mod snr;

pub use smooth_sg::smooth_savitzky_golay;
pub use peak_detection::find_peaks;
pub use baseline::{remove_baseline, remove_baseline_iterative};
pub use deconvolve::deconvolve_rl;
pub use filters::butterworth_lowpass;
pub use snr::estimate_snr;

#[wasm_bindgen(js_name = smoothSG)]
pub fn smooth_sg_wasm(data: &[f64], window: usize, degree: usize) -> Vec<f64> {
    let mut out = vec![0.0; data.len()];
    smooth_savitzky_golay(data, window, degree, &mut out);
    out
}

#[wasm_bindgen(js_name = findPeaks)]
pub fn find_peaks_wasm(data: &[f64], threshold: f64, prominence: Option<f64>) -> Vec<u32> {
    find_peaks(data, threshold, prominence.unwrap_or(0.0))
}

#[wasm_bindgen(js_name = removeBaselineIterative)]
pub fn baseline_iterative_wasm(data: &[f64], x: &[f64], order: usize, iters: usize) -> Vec<f64> {
    let mut out = vec![0.0; data.len()];
    remove_baseline_iterative(data, x, order, iters, &mut out);
    out
}

#[wasm_bindgen(js_name = removeBaseline)]
pub fn baseline_remove_wasm(data: &[f64], x: &[f64], order: usize) -> Vec<f64> {
    let mut out = vec![0.0; data.len()];
    remove_baseline(data, x, order, &mut out);
    out
}

#[wasm_bindgen(js_name = deconvolveRL)]
pub fn deconvolve_rl_wasm(data: &[f64], kernel: &[f64], iterations: u32) -> Vec<f64> {
    let mut out = vec![0.0; data.len()];
    deconvolve_rl(data, kernel, iterations, &mut out);
    out
}

#[wasm_bindgen(js_name = butterworthLowpass)]
pub fn butterworth_filter_wasm(data: &[f64], cutoff: f64, fs: f64) -> Vec<f64> {
    let mut out = vec![0.0; data.len()];
    butterworth_lowpass(data, &mut out, cutoff, fs);
    out
}

#[wasm_bindgen(js_name = estimateSNR)]
pub fn snr_estimate_wasm(data: &[f64]) -> f64 {
    estimate_snr(data)
}

/// Downsamples the signal by keeping every `n`-th sample.
#[wasm_bindgen]
pub fn decimate(data: &[f64], factor: usize) -> Vec<f64> {
    if factor < 1 { return data.to_vec(); }
    data.iter().step_by(factor).cloned().collect()
}

/// Resamples the signal to a new length using linear interpolation.
#[wasm_bindgen]
pub fn resample_linear(data: &[f64], new_len: usize) -> Vec<f64> {
    if data.is_empty() || new_len == 0 { return vec![]; }
    if data.len() == 1 { return vec![data[0]; new_len]; }
    
    let n = data.len();
    let factor = (n - 1) as f64 / (new_len - 1) as f64;
    
    (0..new_len).map(|i| {
        let pos = i as f64 * factor;
        let idx = pos.floor() as usize;
        let frac = pos - idx as f64;
        
        if idx >= n - 1 {
            data[n - 1]
        } else {
            data[idx] * (1.0 - frac) + data[idx + 1] * frac
        }
    }).collect()
}
