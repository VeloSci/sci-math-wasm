use rayon::prelude::*;

/// Baseline Correction (Polynomial Subtraction) - Parallel
pub fn remove_baseline(data: &[f64], x: &[f64], order: usize, out: &mut [f64]) {
    let coeffs = crate::fitting::fit_polynomial(x, data, order).unwrap_or(vec![0.0; order+1]);
    apply_baseline_coeffs(data, x, &coeffs, out);
}

/// Iterative Polish Polynomial Baseline Removal
pub fn remove_baseline_iterative(data: &[f64], x: &[f64], order: usize, iters: usize, out: &mut [f64]) {
    let mut current_data = data.to_vec();
    
    for _ in 0..iters {
        let coeffs = crate::fitting::fit_polynomial(x, &current_data, order).unwrap_or(vec![0.0; order+1]);
        
        current_data.par_iter_mut().enumerate().for_each(|(i, val)| {
            let mut fit_val = 0.0;
            let mut p = 1.0;
            for c in &coeffs { fit_val += c * p; p *= x[i]; }
            
            if data[i] > fit_val {
                *val = fit_val;
            } else {
                *val = data[i];
            }
        });
    }
    
    let final_coeffs = crate::fitting::fit_polynomial(x, &current_data, order).unwrap_or(vec![0.0; order+1]);
    apply_baseline_coeffs(data, x, &final_coeffs, out);
}

pub fn apply_baseline_coeffs(data: &[f64], x: &[f64], coeffs: &[f64], out: &mut [f64]) {
    out.par_iter_mut().enumerate()
       .with_min_len(4096)
       .for_each(|(i, val)| {
           let xi = x[i];
           let mut b = 0.0;
           let mut p = 1.0;
           for c in coeffs { b += c * p; p *= xi; }
           *val = data[i] - b;
       });
}
