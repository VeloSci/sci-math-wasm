use rayon::prelude::*;

/// Richardson-Lucy Deconvolution - Parallel (Inner Loop)
pub fn deconvolve_rl(data: &[f64], kernel: &[f64], iterations: u32, out: &mut [f64]) {
    let n = data.len();
    let kn = kernel.len();
    let kh = kn / 2;
    let mut current = vec![1.0; n];
    let mut k_flipped = kernel.to_vec();
    k_flipped.reverse();
    
    // Adaptive Threshold
    if n < 2048 {
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
            
        (0..n).into_par_iter().with_min_len(8192).for_each(|i| unsafe {
             let d_ptr = d_addr as *const f64;
             let est_ptr = est_addr as *const f64;
             let rel_ptr = rel_addr as *mut f64;
            let ev = *est_ptr.add(i);
            *rel_ptr.add(i) = if ev > 1e-12 { *d_ptr.add(i) / ev } else { 0.0 };
        });

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
