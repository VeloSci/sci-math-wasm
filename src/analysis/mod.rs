use rayon::prelude::*;

/// Savitzky-Golay Smoothing Filter - Parallel (Chunked)
pub fn smooth_savitzky_golay(data: &[f64], window: usize, out: &mut [f64]) {
    let n = data.len();
    if n < window { return; }
    
    // Edges (sequential)
    let half = window / 2;
    for i in 0..half {
        out[i] = data[i];
        out[n - 1 - i] = data[n - 1 - i];
    }
    
    // Parallel middle section with large chunks
    // The overhead of Rayon is too high for small windows per pixel, so we process 4096 pixels per thread.
    let work_range = half..n - half;
    let in_ptr = data.as_ptr() as usize;
    let out_ptr = out.as_mut_ptr() as usize;

    (work_range).into_par_iter()
        .with_min_len(4096) 
        .for_each(|i| unsafe {
            let p_in = in_ptr as *const f64;
            let p_out = out_ptr as *mut f64;
            
             match window {
                5 => {
                    let inv = 1.0 / 35.0;
                    let sum = -3.0 * *p_in.add(i-2) + 12.0 * *p_in.add(i-1) + 17.0 * *p_in.add(i) 
                            + 12.0 * *p_in.add(i+1) - 3.0 * *p_in.add(i+2);
                    *p_out.add(i) = sum * inv;
                },
                7 => {
                    let inv = 1.0 / 21.0;
                    let sum = -2.0 * *p_in.add(i-3) + 3.0 * *p_in.add(i-2) + 6.0 * *p_in.add(i-1) 
                            + 7.0 * *p_in.add(i) + 6.0 * *p_in.add(i+1) + 3.0 * *p_in.add(i+2) 
                            - 2.0 * *p_in.add(i+3);
                    *p_out.add(i) = sum * inv;
                },
                9 => {
                    let inv = 1.0 / 231.0;
                    let sum = -21.0 * *p_in.add(i-4) + 14.0 * *p_in.add(i-3) + 39.0 * *p_in.add(i-2) 
                            + 54.0 * *p_in.add(i-1) + 59.0 * *p_in.add(i) + 54.0 * *p_in.add(i+1) 
                            + 39.0 * *p_in.add(i+2) + 14.0 * *p_in.add(i+3) - 21.0 * *p_in.add(i+4);
                    *p_out.add(i) = sum * inv;
                },
                11 => {
                    let inv = 1.0 / 429.0;
                    let sum = -36.0 * *p_in.add(i-5) + 9.0 * *p_in.add(i-4) + 44.0 * *p_in.add(i-3) 
                            + 69.0 * *p_in.add(i-2) + 84.0 * *p_in.add(i-1) + 89.0 * *p_in.add(i) 
                            + 84.0 * *p_in.add(i+1) + 69.0 * *p_in.add(i+2) + 44.0 * *p_in.add(i+3) 
                            + 9.0 * *p_in.add(i+4) - 36.0 * *p_in.add(i+5);
                    *p_out.add(i) = sum * inv;
                },
                _ => {}
            }
        });
}

/// Fast Peak Detection - Parallel
pub fn find_peaks(data: &[f64], threshold: f64) -> Vec<u32> {
    let n = data.len();
    if n < 3 { return vec![]; }
    
    // Chunked parallel peak finding
    let chunks: Vec<Vec<u32>> = (1..n-1).into_par_iter()
        .with_min_len(4096)
        .fold(|| Vec::with_capacity(64), |mut acc, i| {
            unsafe {
                let val = *data.get_unchecked(i);
                if val > threshold && val > *data.get_unchecked(i-1) && val > *data.get_unchecked(i+1) {
                    acc.push(i as u32);
                }
            }
            acc
        })
        .collect();
        
    chunks.into_iter().flatten().collect()
}

/// Baseline Correction (Polynomial Subtraction) - Parallel
pub fn remove_baseline(data: &[f64], x: &[f64], order: usize, out: &mut [f64]) {
    let coeffs = crate::fitting::fit_polynomial(x, data, order).unwrap_or(vec![0.0; order+1]);
    
    // Parallelize the subtraction (computationally minimal, so HUGE chunks needed)
    out.par_iter_mut().enumerate()
       .with_min_len(4096)
       .for_each(|(i, val)| {
           let xi = x[i];
           let mut b = 0.0;
           let mut p = 1.0;
           for c in &coeffs { b += c * p; p *= xi; }
           *val = data[i] - b;
       });
}

/// Richardson-Lucy Deconvolution - Parallel (Inner Loop)
pub fn deconvolve_rl(data: &[f64], kernel: &[f64], iterations: u32, out: &mut [f64]) {
    let n = data.len();
    let kn = kernel.len();
    let kh = kn / 2;
    let mut current = vec![1.0; n];
    let mut k_flipped = kernel.to_vec();
    k_flipped.reverse();
    
    // Adaptive Threshold: If N < 2048, overhead of launching threads > gain.
    if n < 2048 {
        // Sequential Implementation
        let d_ptr = data.as_ptr();
        let k_ptr = kernel.as_ptr();
        let kf_ptr = k_flipped.as_ptr();
        
        for _ in 0..iterations {
            let mut estimation = vec![0.0; n];
            let mut rel = vec![0.0; n];
            let mut temp = vec![0.0; n];
            
            let cur_ptr = current.as_ptr();
            let est_ptr = estimation.as_mut_ptr();
            let rel_ptr = rel.as_mut_ptr();
            let tmp_ptr = temp.as_mut_ptr();
            
            unsafe {
                 for i in 0..n {
                    let mut sum = 0.0;
                    let i_start = if i >= kh { 0 } else { kh - i };
                    let i_end = if i + kh < n { kn } else { n - i + kh };
                    for j in i_start..i_end {
                        sum += *cur_ptr.add(i + j - kh) * *k_ptr.add(j);
                    }
                    *est_ptr.add(i) = sum;
                }
                for i in 0..n {
                    let ev = *est_ptr.add(i);
                    *rel_ptr.add(i) = if ev > 1e-12 { *d_ptr.add(i) / ev } else { 0.0 };
                }
                for i in 0..n {
                    let mut corr = 0.0;
                    let i_start = if i >= kh { 0 } else { kh - i };
                    let i_end = if i + kh < n { kn } else { n - i + kh };
                    for j in i_start..i_end {
                        corr += *rel_ptr.add(i + j - kh) * *kf_ptr.add(j);
                    }
                    *tmp_ptr.add(i) = *cur_ptr.add(i) * corr;
                }
            }
            current.copy_from_slice(&temp);
        }
        out.copy_from_slice(&current);
        return;
    }

    // Parallel Implementation for Large Datasets
    let d_addr = data.as_ptr() as usize;
    let k_addr = kernel.as_ptr() as usize;
    let kf_addr = k_flipped.as_ptr() as usize;

    for _ in 0..iterations {
        let mut estimation = vec![0.0; n];
        let mut rel = vec![0.0; n];
        let mut temp = vec![0.0; n];
        
        let cur_addr = current.as_ptr() as usize;
        let est_addr = estimation.as_mut_ptr() as usize;
        let rel_addr = rel.as_mut_ptr() as usize;
        let tmp_addr = temp.as_mut_ptr() as usize;
        
        // Massive Parallelism for Convolution Step
        (0..n).into_par_iter().with_min_len(8192).for_each(|i| unsafe {
            let cur_ptr = cur_addr as *const f64;
            let k_ptr = k_addr as *const f64;
            let est_ptr = est_addr as *mut f64;
            
            let mut sum = 0.0;
            let i_start = if i >= kh { 0 } else { kh - i };
            let i_end = if i + kh < n { kn } else { n - i + kh };
            for j in i_start..i_end {
                sum += *cur_ptr.add(i + j - kh) * *k_ptr.add(j);
            }
            *est_ptr.add(i) = sum;
        });
            
        // Relative Error Step
        (0..n).into_par_iter().with_min_len(8192).for_each(|i| unsafe {
             let d_ptr = d_addr as *const f64;
             let est_ptr = est_addr as *const f64;
             let rel_ptr = rel_addr as *mut f64;
             // Unused in this specific loop but pre-declared for 'Nuclear Option' symmetry
             let _tmp_ptr = tmp_addr as *mut f64;
             let _cur_ptr = cur_addr as *const f64;
             let _kf_ptr = kf_addr as *const f64;

            // Rel
            let ev = *est_ptr.add(i);
            let rv = if ev > 1e-12 { *d_ptr.add(i) / ev } else { 0.0 };
            *rel_ptr.add(i) = rv;
        });

         // Correlation Step
         (0..n).into_par_iter().with_min_len(8192).for_each(|i| unsafe {
             let rel_ptr = rel_addr as *const f64;
             let cur_ptr = cur_addr as *const f64;
             let kf_ptr = kf_addr as *const f64;
             let tmp_ptr = tmp_addr as *mut f64;

             let mut corr = 0.0;
             let i_start = if i >= kh { 0 } else { kh - i };
             let i_end = if i + kh < n { kn } else { n - i + kh };
             for j in i_start..i_end {
                 corr += *rel_ptr.add(i + j - kh) * *kf_ptr.add(j);
             }
             *tmp_ptr.add(i) = *cur_ptr.add(i) * corr;
         });

        current.copy_from_slice(&temp);
    }
    out.copy_from_slice(&current);
}

/// Butterworth Low-pass Filter (2nd Order IIR) - Parallel (Chunked with Warmup)
pub fn butterworth_lowpass(data: &[f64], out: &mut [f64], cutoff: f64, fs: f64) {
    let n = data.len();
    let ff = cutoff / fs;
    let ita = (std::f64::consts::PI * ff).tan();
    let q = std::f64::consts::SQRT_2;
    
    let b0 = (ita * ita) / (1.0 + q * ita + (ita * ita));
    let b1 = 2.0 * b0;
    let b2 = b0;
    let a1 = 2.0 * (ita * ita - 1.0) / (1.0 + q * ita + (ita * ita));
    let a2 = (1.0 - q * ita + (ita * ita)) / (1.0 + q * ita + (ita * ita));

    // Adaptive threshold: Sequential for small N, Parallel for large N
    if n < 2048 {
        let mut x1 = 0.0; let mut x2 = 0.0; let mut y1 = 0.0; let mut y2 = 0.0;
        for i in 0..n {
            let x0 = data[i];
            let y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
            out[i] = y0;
            x2 = x1; x1 = x0; y2 = y1; y1 = y0;
        }
        return;
    }

    // Parallel Implementation: Chunked with Warmup
    // Overlap of 128 samples is sufficient for the IIR state to stabilize for a 2nd order Butterworth
    let chunk_size = 65536; 
    let warmup = 128;
    let in_ptr = data.as_ptr() as usize;
    let out_ptr = out.as_mut_ptr() as usize;

    (0..n).into_par_iter().step_by(chunk_size).for_each(|start| unsafe {
        let end = (start + chunk_size).min(n);
        let p_in = in_ptr as *const f64;
        let p_out = out_ptr as *mut f64;
        
        let mut x1 = 0.0; let mut x2 = 0.0; let mut y1 = 0.0; let mut y2 = 0.0;
        
        // Warmup: process preceding samples (if any) to stabilize state
        if start > warmup {
            for i in (start - warmup)..start {
                let x0 = *p_in.add(i);
                let y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
                x2 = x1; x1 = x0; y2 = y1; y1 = y0;
            }
        } else if start > 0 {
            for i in 0..start {
                let x0 = *p_in.add(i);
                let y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
                x2 = x1; x1 = x0; y2 = y1; y1 = y0;
            }
        }

        // Process actual chunk
        for i in start..end {
            let x0 = *p_in.add(i);
            let y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
            *p_out.add(i) = y0;
            x2 = x1; x1 = x0; y2 = y1; y1 = y0;
        }
    });
}

/// Robust SNR Estimate - Parallel
pub fn estimate_snr(data: &[f64]) -> f64 {
    let n = data.len();
    if n < 2 { return 0.0; }
    
    // Parallel mean
    let sum: f64 = data.par_iter().sum();
    let mean = sum / n as f64;
    
    // Parallel variance
    let ss_tot: f64 = data.par_iter()
        .map(|&x| (x - mean).powi(2))
        .sum();
    let svar = ss_tot / n as f64;
    
    // Noise estimation via differences
    let mut diffs: Vec<f64> = data.par_windows(2).map(|w| (w[1] - w[0]).abs()).collect();
    
    // Sort for median (Parallel sort)
    diffs.par_sort_unstable_by(|a, b| a.partial_cmp(b).expect("Numeric SNR failure"));
    
    let ns = diffs[diffs.len() / 2] / 0.6745;
    let nvar = ns.powi(2);
    
    if nvar < 1e-18 { return 100.0; }
    10.0 * (svar / nvar).log10()
}
