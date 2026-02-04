use rayon::prelude::*;

/// Robust SNR Estimate - Parallel
pub fn estimate_snr(data: &[f64]) -> f64 {
    let n = data.len();
    if n < 2 { return 0.0; }
    
    let sum: f64 = data.par_iter().sum();
    let mean = sum / n as f64;
    
    let ss_tot: f64 = data.par_iter()
        .map(|&x| (x - mean).powi(2))
        .sum();
    let svar = ss_tot / n as f64;
    
    let mut diffs: Vec<f64> = data.par_windows(2).map(|w| (w[1] - w[0]).abs()).collect();
    
    diffs.par_sort_unstable_by(|a, b| a.partial_cmp(b).expect("Numeric SNR failure"));
    
    let ns = diffs[diffs.len() / 2] / 0.6745;
    let nvar = ns.powi(2);
    
    if nvar < 1e-18 { return 100.0; }
    10.0 * (svar / nvar).log10()
}
