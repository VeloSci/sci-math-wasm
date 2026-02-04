use rayon::prelude::*;

/// Savitzky-Golay Smoothing Filter - Parallel (Chunked)
pub fn smooth_savitzky_golay(data: &[f64], window: usize, degree: usize, out: &mut [f64]) {
    let n = data.len();
    if n < window || window < 3 || window % 2 == 0 { return; }
    
    // Attempt optimized static kernels first
    if degree == 2 {
        if let Some(_) = match_static_sg(data, window, out) {
            return;
        }
    }

    // Generalized SG: Calculate coefficients
    let coeffs = calculate_sg_coeffs(window, degree).unwrap_or_else(|_| vec![0.0; window]);
    
    let half = window / 2;
    for i in 0..half {
        out[i] = data[i];
        out[n - 1 - i] = data[n - 1 - i];
    }
    
    let work_range = half..n - half;
    let in_ptr = data.as_ptr() as usize;
    let out_ptr = out.as_mut_ptr() as usize;
    let coeffs_ptr = coeffs.as_ptr() as usize;

    (work_range).into_par_iter()
        .with_min_len(4096) 
        .for_each(|i| unsafe {
            let p_in = in_ptr as *const f64;
            let p_out = out_ptr as *mut f64;
            let p_c = coeffs_ptr as *const f64;
            
            let mut sum = 0.0;
            for j in 0..window {
                sum += *p_in.add(i + j - half) * *p_c.add(j);
            }
            *p_out.add(i) = sum;
        });
}

fn match_static_sg(data: &[f64], window: usize, out: &mut [f64]) -> Option<()> {
    let n = data.len();
    let half = window / 2;
    let in_ptr = data.as_ptr() as usize;
    let out_ptr = out.as_mut_ptr() as usize;

    match window {
        5 | 7 | 9 | 11 => {
             (half..n-half).into_par_iter().with_min_len(4096).for_each(|i| unsafe {
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
                    _ => unreachable!()
                }
             });
             Some(())
        },
        _ => None
    }
}

pub fn calculate_sg_coeffs(window: usize, degree: usize) -> Result<Vec<f64>, String> {
    let half = (window / 2) as i32;
    let m = degree + 1;
    let mut matrix = vec![0.0; m * m];
    let mut b = vec![0.0; m];
    
    for i in 0..m {
        for j in 0..m {
            let p = i + j;
            let mut sum = 0.0;
            for k in -half..=half {
                sum += (k as f64).powi(p as i32);
            }
            matrix[i * m + j] = sum;
        }
    }
    
    b[0] = 1.0; 
    
    if let Some(coeffs_fit) = crate::fitting::solve_linear_system(&mut matrix, &mut b, m) {
        let mut weights = vec![0.0; window];
        for (idx, k) in (-half..=half).enumerate() {
            let mut val = 0.0;
            let mut pk = 1.0;
            for p in 0..m {
                val += coeffs_fit[p] * pk;
                pk *= k as f64;
            }
            weights[idx] = val;
        }
        Ok(weights)
    } else {
        Err("Failed to solve SG system".into())
    }
}
